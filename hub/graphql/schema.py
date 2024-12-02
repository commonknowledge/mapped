import logging
from typing import List, Optional

from django.core.exceptions import ObjectDoesNotExist, PermissionDenied

import strawberry
import strawberry_django
from gqlauth.core.middlewares import JwtSchema
from gqlauth.core.types_ import GQLAuthError
from gqlauth.user import arg_mutations as gqlauth_mutations
from gqlauth.user.queries import UserQueries
from graphql import GraphQLError
from strawberry.extensions import QueryDepthLimiter
from strawberry.types import ExecutionContext
from strawberry_django import mutations as django_mutations
from strawberry_django.optimizer import DjangoOptimizerExtension
from strawberry_django.permissions import IsAuthenticated

from hub import models
from hub.graphql import auth_mutations
from hub.graphql import mutations as mutation_types
from hub.graphql.extensions.analytics import APIAnalyticsExtension
from hub.graphql.extensions.api_blacklist import APIBlacklistGuard
from hub.graphql.types import model_types, public_queries
from hub.graphql.utils import graphql_type_to_dict

logger = logging.getLogger(__name__)


@strawberry.type
class Query(UserQueries):
    memberships: List[model_types.Membership] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    all_organisations: List[model_types.PublicOrganisation] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    my_organisations: List[model_types.Organisation] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    external_data_source: model_types.ExternalDataSource = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    shared_data_source: model_types.SharedDataSource = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    external_data_sources: List[model_types.ExternalDataSource] = (
        strawberry_django.field(extensions=[IsAuthenticated()])
    )
    imported_data_geojson_point: Optional[model_types.MapReportMemberFeature] = (
        model_types.imported_data_geojson_point
    )
    shared_data_sources: List[model_types.SharedDataSource] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    airtable_source: model_types.AirtableSource = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    airtable_sources: List[model_types.AirtableSource] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    mailchimp_source: model_types.MailchimpSource = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    mailchimp_sources: List[model_types.MailchimpSource] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    job: model_types.QueueJob = strawberry_django.field(extensions=[IsAuthenticated()])
    jobs: List[model_types.QueueJob] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    reports: List[model_types.Report] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    map_report: model_types.MapReport = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    map_reports: List[model_types.MapReport] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    hub_homepages: List[model_types.HubHomepage] = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    hub_homepage: model_types.HubHomepage = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    hub_page: model_types.HubPage = strawberry_django.field(
        extensions=[IsAuthenticated()]
    )
    hub_page_by_path: Optional[model_types.HubPage] = model_types.hub_page_by_path
    hub_by_hostname: Optional[model_types.HubHomepage] = model_types.hub_by_hostname
    postcode_search: public_queries.UnauthenticatedPostcodeQueryResponse = (
        public_queries.postcode_search
    )
    public_map_report: model_types.MapReport = strawberry_django.field(
        resolver=model_types.public_map_report
    )
    area: Optional[model_types.Area] = model_types.area_by_gss
    dataSet: Optional[model_types.DataSet] = model_types.dataset_by_name
    mapping_sources: List[model_types.MappingSource] = strawberry_django.field(
        resolver=model_types.mapping_sources,
        extensions=[IsAuthenticated()],
    )

    enrich_postcode: public_queries.AuthenticatedPostcodeQueryResponse = (
        strawberry.field(
            resolver=public_queries.enrich_postcode,
            extensions=[IsAuthenticated()],
        )
    )
    enrich_postcodes: List[public_queries.AuthenticatedPostcodeQueryResponse] = (
        strawberry.field(
            resolver=public_queries.enrich_postcodes,
            extensions=[IsAuthenticated()],
        )
    )
    generic_data_by_external_data_source: List[model_types.GenericData] = (
        model_types.generic_data_by_external_data_source
    )

    @strawberry.field
    def test_data_source(
        self,
        info: strawberry.types.Info,
        input: mutation_types.CreateExternalDataSourceInput,
    ) -> model_types.ExternalDataSource:
        for crm_type_key, model in models.source_models.items():
            # Custom handler for Google Sheets as more OAuth logic is required to get an access token
            if crm_type_key == "editablegooglesheets":
                input_dict = graphql_type_to_dict(input, delete_null_keys=True)
                return models.EditableGoogleSheetsSource.from_oauth_redirect_success(
                    **input_dict[crm_type_key]
                )

            input_dict = graphql_type_to_dict(input, delete_null_keys=True)
            if crm_type_key in input_dict and input_dict[crm_type_key] is not None:
                return model(**input_dict[crm_type_key])
        raise ValueError("Unsupported data source type")

    list_api_tokens = public_queries.list_api_tokens

    @strawberry.field
    def google_sheets_auth_url(
        self, info: strawberry.types.Info, redirect_url: str
    ) -> str:
        return models.EditableGoogleSheetsSource.authorization_url(redirect_url)


@strawberry.type
class Mutation:
    token_auth = gqlauth_mutations.ObtainJSONWebToken.field
    # register = auth_mutations.Register.field
    verify_account = gqlauth_mutations.VerifyAccount.field
    resend_activation_email = gqlauth_mutations.ResendActivationEmail.field
    request_password_reset = auth_mutations.SendPasswordResetEmail.field
    perform_password_reset = auth_mutations.PasswordReset.field

    create_api_token = public_queries.create_api_token
    revoke_api_token = public_queries.revoke_api_token

    create_external_data_source: mutation_types.CreateExternalDataSourceOutput = (
        mutation_types.create_external_data_source
    )
    update_external_data_source: model_types.ExternalDataSource = (
        mutation_types.update_external_data_source
    )
    delete_external_data_source: model_types.ExternalDataSource = (
        django_mutations.delete(mutation_types.IDObject, extensions=[IsAuthenticated()])
    )

    enable_webhook: model_types.ExternalDataSource = mutation_types.enable_webhook
    disable_webhook: model_types.ExternalDataSource = mutation_types.disable_webhook
    trigger_update: mutation_types.ExternalDataSourceAction = (
        mutation_types.trigger_update
    )
    refresh_webhooks: model_types.ExternalDataSource = mutation_types.refresh_webhooks

    create_organisation: model_types.Membership = mutation_types.create_organisation
    update_organisation: model_types.Organisation = django_mutations.update(
        mutation_types.OrganisationInputPartial, extensions=[IsAuthenticated()]
    )

    import_all: mutation_types.ExternalDataSourceAction = mutation_types.import_all

    create_map_report: model_types.MapReport = mutation_types.create_map_report
    update_map_report: model_types.MapReport = django_mutations.update(
        mutation_types.MapReportInput, extensions=[IsAuthenticated()]
    )
    delete_map_report: model_types.MapReport = django_mutations.delete(
        mutation_types.IDObject, extensions=[IsAuthenticated()]
    )

    create_sharing_permission: model_types.SharingPermission = django_mutations.create(
        mutation_types.SharingPermissionCUDInput, extensions=[IsAuthenticated()]
    )
    delete_sharing_permission: model_types.SharingPermission = django_mutations.delete(
        mutation_types.IDObject, extensions=[IsAuthenticated()]
    )
    # TODO: install django-guardian to handle permissions
    update_sharing_permission: model_types.SharingPermission = django_mutations.update(
        mutation_types.SharingPermissionCUDInput, extensions=[IsAuthenticated()]
    )
    update_sharing_permissions: List[model_types.ExternalDataSource] = (
        mutation_types.update_sharing_permissions
    )
    create_child_page: model_types.HubPage = mutation_types.create_child_page
    delete_page: bool = mutation_types.delete_page
    update_page: model_types.HubPage = mutation_types.update_page

    add_member: bool = mutation_types.add_member


class CustomErrorLoggingSchema(JwtSchema):
    errors_to_ignore: List[type[Exception]] = [
        GQLAuthError,
        PermissionDenied,
        ObjectDoesNotExist,
    ]
    """
    Squash ignorable GraphQL exceptions for cleaner logs
    (currently just Permissions and Not Found errors)
    """

    def process_errors(
        self,
        errors: List[GraphQLError],
        execution_context: ExecutionContext | None = None,
    ) -> None:
        notable_errors = []
        for error in errors:
            matching_ignored_error_class = next(
                (
                    cls
                    for cls in self.errors_to_ignore
                    if isinstance(error.original_error, cls)
                ),
                None,
            )
            if matching_ignored_error_class is not None:
                # Log a warning for an ignored error class
                logger.warning(
                    f"GraphQL request raised {matching_ignored_error_class.__name__} exception."
                )
            else:
                # Otherwise pass the error to the default logger
                # (which prints the full stack trace)
                notable_errors.append(error)
        return super().process_errors(notable_errors, execution_context)


schema = CustomErrorLoggingSchema(
    query=Query,
    mutation=Mutation,
    extensions=[
        APIBlacklistGuard,
        APIAnalyticsExtension,
        DjangoOptimizerExtension,  # not required, but highly recommended
        QueryDepthLimiter(max_depth=10),
    ],
)
