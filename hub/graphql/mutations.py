import datetime
import logging
import uuid
from enum import Enum
from typing import List, Optional

from django.utils.timezone import now

import jsonpatch
import strawberry
import strawberry_django
from asgiref.sync import async_to_sync
from graphql import GraphQLError
from procrastinate.contrib.django.models import ProcrastinateJob
from strawberry import auto
from strawberry.field_extensions import InputMutationExtension
from strawberry.scalars import JSON
from strawberry.types.info import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import IsAuthenticated

from hub import models
from hub.graphql.types import model_types
from hub.graphql.utils import graphql_type_to_dict
from hub.models import BatchRequest
from hub.permissions import user_can_manage_source

logger = logging.getLogger(__name__)


@strawberry.type
class MutationError:
    code: int
    message: str


@strawberry.type
class MutationOutput:
    code: int
    errors: list[MutationError]


@strawberry.input
class IDObject:
    id: str


@strawberry.input
class UpdateMappingItemInput:
    source: str
    source_path: str
    destination_column: str


@strawberry.input
class MapLayerInput:
    id: str
    name: str
    source: str
    visible: Optional[bool] = True
    custom_marker_text: Optional[str] = None
    inspector_type: Optional[str] = None
    inspector_config: Optional[JSON] = None
    mapbox_paint: Optional[JSON] = None
    mapbox_layout: Optional[JSON] = None


@strawberry_django.input(models.MapReport, partial=True)
class MapReportInput:
    id: auto
    organisation: auto
    name: auto
    slug: Optional[str]
    description: auto
    created_at: auto
    last_update: auto
    layers: Optional[List[MapLayerInput]]
    display_options: Optional[strawberry.scalars.JSON]


@strawberry.mutation(extensions=[IsAuthenticated(), InputMutationExtension()])
async def create_organisation(
    info: Info, name: str, slug: Optional[str] = None, description: Optional[str] = None
) -> models.Membership:
    org = await models.Organisation.objects.acreate(
        name=name, slug=slug, description=description
    )
    user = get_current_user(info)
    membership = await models.Membership.objects.acreate(
        user=user, organisation=org, role="owner"
    )
    return membership


@strawberry_django.input(models.Organisation, partial=True)
class OrganisationInputPartial:
    id: auto
    name: str
    slug: Optional[str]
    description: Optional[str]


@strawberry.enum
class WebhookType(Enum):
    Import = "Import"
    Update = "Update"


@strawberry.mutation(extensions=[IsAuthenticated()])
def enable_webhook(
    external_data_source_id: str, webhook_type: WebhookType
) -> models.ExternalDataSource:
    data_source: models.ExternalDataSource = models.ExternalDataSource.objects.get(
        id=external_data_source_id
    )
    if webhook_type == WebhookType.Import:
        data_source.enable_auto_import()
    else:
        data_source.enable_auto_update()
    return data_source


@strawberry.mutation(extensions=[IsAuthenticated()])
def disable_webhook(
    external_data_source_id: str, webhook_type: WebhookType
) -> models.ExternalDataSource:
    data_source: models.ExternalDataSource = models.ExternalDataSource.objects.get(
        id=external_data_source_id
    )
    if webhook_type == WebhookType.Import:
        data_source.disable_auto_import()
    else:
        data_source.disable_auto_update()
    return data_source


@strawberry.type
class ExternalDataSourceAction:
    id: strawberry.scalars.ID
    external_data_source: model_types.ExternalDataSource


@strawberry.mutation(extensions=[IsAuthenticated()])
async def trigger_update(
    info: Info, external_data_source_id: str
) -> ExternalDataSourceAction:
    data_source: models.ExternalDataSource = (
        await models.ExternalDataSource.objects.aget(id=external_data_source_id)
    )

    batch_request = await BatchRequest.objects.acreate(
        user=get_current_user(info),
        type=BatchRequest.BatchRequestType.Update,
        source=data_source,
    )
    request_id = str(batch_request.id)

    await data_source.schedule_refresh_all(request_id=request_id)
    return ExternalDataSourceAction(id=request_id, external_data_source=data_source)


@strawberry.mutation(extensions=[IsAuthenticated()])
def refresh_webhooks(external_data_source_id: str) -> models.ExternalDataSource:
    data_source = models.ExternalDataSource.objects.get(id=external_data_source_id)
    data_source.refresh_webhooks()
    return data_source


@strawberry_django.mutation(extensions=[IsAuthenticated()], handle_django_errors=True)
def create_map_report(info: Info, data: MapReportInput) -> models.MapReport:
    existing_reports = model_types.Report.get_queryset(
        models.Report.objects.get_queryset(), info
    ).exists()
    user = get_current_user(info)

    if data.organisation:
        organisation = models.Organisation.objects.get(id=data.organisation.set)
    else:
        organisation = models.Organisation.get_or_create_for_user(user)

    date_time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    # Check for duplicate layers in existing reports
    if "layers" in data.display_options:
        display_layers = data.display_options["layers"]
        for layer in display_layers:
            layer_id = layer["id"]
            # Query for existing report with the same layer
            existing_report = models.MapReport.objects.filter(
                layers__contains=[{"id": layer_id}]
            ).first()
            if existing_report:
                report_link = f"/reports/{existing_report.id}"
                raise GraphQLError(
                    f"A map for this data source already exists. "
                    f'You can view it <a className="underline" href="{report_link}" target="_blank">here</a>'
                )

    # Prepare base parameters
    params = {
        **graphql_type_to_dict(data, delete_null_keys=True),
        **{
            "organisation": organisation,
            "name": data.name or f"New map ({date_time_str})",
            "display_options": data.display_options or {},
        },
    }

    map_report = models.MapReport.objects.create(**params)

    if "layers" in data.display_options:
        display_layers = data.display_options["layers"]
        map_report.layers = [
            {
                "id": layer["id"],
                "name": layer["name"],
                "source": layer["source"],
                "visible": layer["visible"],
                "custom_marker_text": layer.get("custom_marker_text"),
            }
            for layer in display_layers
        ]

    map_report.save()
    # If this is the first report, add the user's first member list to it
    if not data.layers and not existing_reports:
        member_list = (
            model_types.ExternalDataSource.get_queryset(
                models.ExternalDataSource.objects.get_queryset(),
                info,
            )
            .filter(data_type=models.ExternalDataSource.DataSourceType.MEMBER)
            .first()
        )
        if member_list:
            map_report.name = f"Auto-generated report on {member_list.name}"
            map_report.layers = [
                {
                    "id": str(uuid.uuid4()),
                    "name": member_list.name,
                    "source": str(member_list.id),
                    "visible": True,
                }
            ]
            map_report.save()

    return map_report


@strawberry_django.mutation(extensions=[IsAuthenticated()])
async def import_all(
    info: Info, external_data_source_id: str
) -> ExternalDataSourceAction:
    data_source: models.ExternalDataSource = (
        await models.ExternalDataSource.objects.aget(id=external_data_source_id)
    )
    batch_request = await BatchRequest.objects.acreate(
        user=get_current_user(info),
        type=BatchRequest.BatchRequestType.Import,
        source=data_source,
    )

    request_id = str(batch_request.id)
    requested_at = now().isoformat()

    await data_source.schedule_import_all(
        requested_at=requested_at, request_id=request_id
    )
    return ExternalDataSourceAction(id=request_id, external_data_source=data_source)


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def cancel_import(
    info: Info, external_data_source_id: str, request_id: str, all: bool = False
) -> ExternalDataSourceAction:
    data_source: models.ExternalDataSource = models.ExternalDataSource.objects.get(
        id=external_data_source_id
    )
    # Confirm user has access to this source
    user = get_current_user(info)
    assert user_can_manage_source(user, data_source)
    # Execute
    data_source.cancel_jobs(type=BatchRequest.BatchRequestType.Import, all=all)
    # Update all remaining procrastinate jobs, cancel them
    return ExternalDataSourceAction(id=request_id, external_data_source=data_source)


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def cancel_update(
    info: Info, external_data_source_id: str, request_id: str, all: bool = False
) -> ExternalDataSourceAction:
    data_source: models.ExternalDataSource = models.ExternalDataSource.objects.get(
        id=external_data_source_id
    )
    # Confirm user has access to this source
    user = get_current_user(info)
    assert user_can_manage_source(user, data_source)
    # Execute
    data_source.cancel_jobs(type=BatchRequest.BatchRequestType.Update, all=all)
    # Update all remaining procrastinate jobs, cancel them
    return ExternalDataSourceAction(id=request_id, external_data_source=data_source)


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def delete_all_records(
    info: Info, external_data_source_id: str
) -> model_types.ExternalDataSource:
    data_source = models.ExternalDataSource.objects.get(id=external_data_source_id)
    # Confirm user has access to this source
    user = get_current_user(info)
    assert user_can_manage_source(user, data_source)
    # Don't import more records, since we want to wipe 'em
    ProcrastinateJob.objects.filter(
        args__external_data_source_id=external_data_source_id,
        status__in=["todo", "doing"],
    ).update(status="cancelled")
    # Delete all data
    data_source.get_import_data().all().delete()
    return models.ExternalDataSource.objects.get(id=external_data_source_id)


@strawberry_django.input(models.ExternalDataSource, partial=True)
class ExternalDataSourceInput:
    id: auto
    name: auto
    data_type: auto
    description: auto
    organisation: auto
    geography_column: auto
    geography_column_type: auto
    geocoding_config: Optional[strawberry.scalars.JSON]
    postcode_field: auto
    first_name_field: auto
    last_name_field: auto
    full_name_field: auto
    email_field: auto
    phone_field: auto
    address_field: auto
    title_field: auto
    description_field: auto
    image_field: auto
    start_time_field: auto
    end_time_field: auto
    public_url_field: auto
    social_url_field: auto
    can_display_point_field: auto
    auto_update_enabled: auto
    update_mapping: Optional[List[UpdateMappingItemInput]]
    auto_import_enabled: auto


@strawberry_django.input(models.AirtableSource, partial=True)
class AirtableSourceInput(ExternalDataSourceInput):
    api_key: str
    base_id: str
    table_id: str


@strawberry_django.input(models.MailchimpSource, partial=True)
class MailChimpSourceInput(ExternalDataSourceInput):
    api_key: str
    list_id: str


@strawberry_django.input(models.ActionNetworkSource, partial=True)
class ActionNetworkSourceInput(ExternalDataSourceInput):
    api_key: str
    group_slug: str


@strawberry_django.input(models.TicketTailorSource, partial=True)
class TicketTailorSourceInput(ExternalDataSourceInput):
    api_key: str


@strawberry_django.input(models.EditableGoogleSheetsSource, partial=True)
class EditableGoogleSheetsSourceInput(ExternalDataSourceInput):
    oauth_credentials: Optional[str]
    spreadsheet_id: str
    sheet_name: str
    id_field: Optional[str]


@strawberry.input()
class CreateExternalDataSourceInput:
    mailchimp: Optional[MailChimpSourceInput] = None
    airtable: Optional[AirtableSourceInput] = None
    actionnetwork: Optional[ActionNetworkSourceInput] = None
    tickettailor: Optional[TicketTailorSourceInput] = None
    editablegooglesheets: Optional[EditableGoogleSheetsSourceInput] = None


@strawberry.type
class CreateExternalDataSourceOutput(MutationOutput):
    result: Optional[model_types.ExternalDataSource]


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def create_external_data_source(
    info: Info, input: CreateExternalDataSourceInput
) -> models.ExternalDataSource:
    input_dict = graphql_type_to_dict(input, delete_null_keys=True)
    creator_fn = None
    for crm_type_key, model in models.source_models.items():
        if crm_type_key in input_dict and input_dict[crm_type_key] is not None:
            kwargs = input_dict[crm_type_key]
            # CreateExternalDataSourceInput expects organisation to be a dict like `{ set: 1 }`
            if org := kwargs.get("organisation", None):
                kwargs["organisation"] = models.Organisation.objects.get(
                    id=org.get("set")
                )
            else:
                user = get_current_user(info)
                kwargs["organisation"] = models.Organisation.get_or_create_for_user(
                    user
                )

            logger.info(f"Creating source of type {crm_type_key}", kwargs)

            def creator_fn() -> tuple[models.ExternalDataSource, bool]:  # noqa: F811
                deduplication_hash = model(**kwargs).get_deduplication_hash()
                return model.objects.get_or_create(
                    deduplication_hash=deduplication_hash, defaults=kwargs
                )

            break

    if creator_fn is None:
        return CreateExternalDataSourceOutput(
            code=400,
            errors=[
                MutationError(
                    code=400,
                    message=("You must provide input data for a specific source type."),
                )
            ],
            result=None,
        )

    try:
        source, created = creator_fn()

        if created:
            batch_request = BatchRequest.objects.create(
                source=source,
                user=get_current_user(info),
                type=BatchRequest.BatchRequestType.Import,
            )
            request_id = str(batch_request.id)
            requested_at = now().isoformat()
            async_to_sync(source.schedule_import_all)(
                requested_at=requested_at, request_id=request_id
            )
            return CreateExternalDataSourceOutput(code=200, errors=[], result=source)

        user = get_current_user(info)
        if user.memberships.filter(id=source.organisation.id).exists():
            return CreateExternalDataSourceOutput(code=409, errors=[], result=source)

        return CreateExternalDataSourceOutput(
            code=409,
            errors=[
                MutationError(
                    code=409,
                    message=(
                        "This source already exists in Mapped through another "
                        "organisation. Please contact us for assistance."
                    ),
                )
            ],
            result=None,
        )
    except Exception as e:
        logger.error(f"create_external_data_source error: {e}")
        return CreateExternalDataSourceOutput(code=500, errors=[], result=None)


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def update_external_data_source(
    info: Info, input: ExternalDataSourceInput
) -> models.ExternalDataSource:
    source = models.ExternalDataSource.objects.get(id=input.id)
    if not source.organisation.members.filter(user=get_current_user(info)).exists():
        raise PermissionError("You do not have permission to update this data source.")
    for key, value in graphql_type_to_dict(input, delete_null_keys=True).items():
        setattr(source, key, value)
    source.save()
    return source


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def update_external_data_source_api_key(info: Info, id: str, api_key: str) -> bool:
    source = models.ExternalDataSource.objects.get(id=id)
    if not source.organisation.members.filter(user=get_current_user(info)).exists():
        raise PermissionError("You do not have permission to update this data source.")
    source.api_key = api_key
    source.save()
    return True


@strawberry_django.input(models.SharingPermission, partial=True)
class SharingPermissionCUDInput:
    id: auto
    external_data_source_id: auto
    organisation_id: auto
    visibility_record_coordinates: auto
    visibility_record_details: auto


@strawberry.input
class SharingPermissionInput:
    id: Optional[strawberry.scalars.ID] = None
    external_data_source_id: strawberry.scalars.ID
    organisation_id: strawberry.scalars.ID
    visibility_record_coordinates: Optional[bool] = False
    visibility_record_details: Optional[bool] = False
    deleted: Optional[bool] = False


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def update_sharing_permissions(
    info: Info, from_org_id: str, permissions: List[SharingPermissionInput]
) -> List[models.ExternalDataSource]:
    user = get_current_user(info)
    for permission in permissions:
        source = models.ExternalDataSource.objects.get(
            id=permission.external_data_source_id
        )
        if not str(source.organisation_id) == from_org_id:
            raise PermissionError(
                "This data source does not belong to the organisation you specified."
            )
        if not source.organisation.members.filter(user=user).exists():
            raise PermissionError(
                "You do not have permission to change sharing preferences for this data source."
            )
        if permission.deleted:
            models.SharingPermission.objects.filter(id=permission.id).delete()
        else:
            models.SharingPermission.objects.update_or_create(
                # id=permission.id,
                external_data_source_id=permission.external_data_source_id,
                organisation_id=permission.organisation_id,
                defaults={
                    "visibility_record_coordinates": permission.visibility_record_coordinates,
                    "visibility_record_details": permission.visibility_record_details,
                },
            )
    # Return data sources for the current org
    result = list(
        models.ExternalDataSource.objects.filter(organisation_id=from_org_id).all()
    )
    return result


@strawberry_django.input(models.Page, partial=True)
class HubPageInput:
    title: Optional[str] = None
    slug: Optional[str] = None
    puck_json_content: Optional[strawberry.scalars.JSON] = None


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def update_page(info: Info, page_id: str, input: HubPageInput) -> model_types.HubPage:
    # TODO: permissions check
    user = get_current_user(info)
    page = models.Page.objects.get(id=page_id).specific
    for attr, value in vars(input).items():
        if value is not strawberry.UNSET and value is not None:
            setattr(page, attr, value)
    try:
        if (
            "root" in input.puck_json_content
            and "props" in input.puck_json_content["root"]
        ):
            metadata = input.puck_json_content["root"]["props"]
            for field in models.puck_wagtail_root_fields:
                if metadata.get(field):
                    setattr(page, field, metadata[field])
    except Exception as e:
        logger.error(f"Error updating page: {e}")
    page.save_revision(user=user, log_action=True).publish()
    return page


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def create_child_page(info: Info, parent_id: str, title: str) -> model_types.HubPage:
    # TODO: permissions check
    user = get_current_user(info)
    parent = models.Page.objects.get(id=parent_id)
    page = models.HubContentPage(title=title, owner=user)
    parent.add_child(instance=page)
    page.save_revision(user=user, log_action=True).publish()
    return page


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def delete_page(info: Info, page_id: str) -> bool:
    # TODO: permissions check
    user = get_current_user(info)
    page = models.Page.objects.get(id=page_id)
    page.unpublish(user=user, log_action=True)
    page.delete()
    return True


@strawberry_django.mutation()
async def add_member(
    info: Info,
    external_data_source_id: str,
    email: str,
    postcode: str,
    custom_fields: strawberry.scalars.JSON,
    tags: list[str],
) -> bool:
    source: models.ExternalDataSource = await models.ExternalDataSource.objects.filter(
        id=external_data_source_id
    ).afirst()
    if not source:
        logger.warning(f"Could not find external data source {external_data_source_id}")
        return False
    record = source.CUDRecord(
        email=email, postcode=postcode, data=custom_fields, tags=tags
    )
    member = source.create_one(record)
    member_id = source.get_record_id(member)
    await source.import_many([member_id])
    return True


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def patch_map_report_display_options(
    info: Info, report_id: str, patch: JSON
) -> models.MapReport:
    # Check permissions
    map_report = models.MapReport.objects.get(id=report_id)
    if not map_report.organisation.members.filter(user=get_current_user(info)).exists():
        raise PermissionError("You do not have permission to update this data source.")
    # Apply the patch
    new_display_options = jsonpatch.apply_patch(map_report.display_options, patch)
    map_report.display_options = new_display_options
    map_report.save()
    return map_report
