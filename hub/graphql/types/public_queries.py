import datetime
import json
import logging
from typing import List, Optional, cast

from django.conf import settings
from django.db.models import Q

import jwt
import pytz
import strawberry
import strawberry_django
from gqlauth.core.utils import app_settings
from gqlauth.jwt.types_ import TokenPayloadType, TokenType
from strawberry.dataloader import DataLoader
from strawberry.types.info import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import IsAuthenticated

from hub import models
from hub.enrichment.sources.electoral_commission_postcode_lookup import (
    electoral_commision_address_lookup,
    electoral_commision_postcode_lookup,
)
from hub.graphql.types import model_types
from hub.graphql.types.electoral_commission import ElectoralCommissionPostcodeLookup
from hub.graphql.types.postcodes import PostcodesIOResult
from utils.postcodesIO import get_bulk_postcode_geo

logger = logging.getLogger(__name__)


@strawberry.type
class UnauthenticatedPostcodeQueryResponse:
    postcode: str
    loaders: strawberry.Private[models.Loaders]

    @strawberry_django.field
    async def postcodesIO(self) -> Optional[PostcodesIOResult]:
        return await self.loaders["postcodesIO"].load(self.postcode)

    @strawberry_django.field
    async def constituency(self) -> Optional[model_types.Area]:
        postcode_data = await self.loaders["postcodesIO"].load(self.postcode)
        if postcode_data is None:
            return None
        id = postcode_data.codes.parliamentary_constituency
        return await models.Area.objects.aget(
            (Q(gss=id) | Q(name=id)) & Q(area_type__code="WMC")
        )

    @strawberry_django.field
    async def constituency_2024(self) -> Optional[model_types.Area]:
        postcode_data = await self.loaders["postcodesIO"].load(self.postcode)
        if postcode_data is None:
            return None
        id = postcode_data.codes.parliamentary_constituency_2025
        return await models.Area.objects.aget(
            (Q(gss=id) | Q(name=id)) & Q(area_type__code="WMC23")
        )

    @strawberry_django.field
    async def electoral_commission(
        self, address_slug: Optional[str] = None
    ) -> Optional[ElectoralCommissionPostcodeLookup]:
        if address_slug:
            result = await electoral_commision_address_lookup(address_slug)
        else:
            result = await electoral_commision_postcode_lookup(self.postcode)

        logger.info(f"electoral commission result: {result}")

        expected_keys = [
            "address_picker",
            "dates",
            "electoral_services",
            "registration",
            "postcode_location",
            "addresses",
        ]
        for key in expected_keys:
            if key not in result:
                return None
        return result


@strawberry.type
class AuthenticatedPostcodeQueryResponse(UnauthenticatedPostcodeQueryResponse):
    @strawberry_django.field
    async def custom_source_data(
        self, source: str, source_path: str, info: Info
    ) -> Optional[str]:
        source_loader = self.loaders["source_loaders"].get(source, None)
        postcode_data = await self.loaders["postcodesIO"].load(self.postcode)
        if source_loader is not None and postcode_data is not None:
            return await source_loader.load(
                models.EnrichmentLookup(
                    member_id=self.postcode,
                    postcode_data=postcode_data,
                    source_id=source,
                    source_path=source_path,
                )
            )


async def enrich_postcode(
    postcode: str, info: Info
) -> AuthenticatedPostcodeQueryResponse:
    user = get_current_user(info)
    loaders = models.Loaders(
        postcodesIO=DataLoader(load_fn=get_bulk_postcode_geo),
        source_loaders={
            str(source.id): source.data_loader_factory()
            async for source in models.ExternalDataSource.objects.filter(
                organisation__members__user=user,
                geography_column__isnull=False,
                geography_column_type__isnull=False,
            ).all()
        },
    )
    return AuthenticatedPostcodeQueryResponse(postcode=postcode, loaders=loaders)


async def enrich_postcodes(
    postcodes: List[str], info: Info
) -> AuthenticatedPostcodeQueryResponse:
    if len(postcodes) > settings.POSTCODES_IO_BATCH_MAXIMUM:
        raise ValueError(
            f"Batch query takes a maximum of 100 postcodes. You provided {len(postcodes)}"
        )
    user = get_current_user(info)
    loaders = models.Loaders(
        postcodesIO=DataLoader(load_fn=get_bulk_postcode_geo),
        source_loaders={
            str(source.id): source.data_loader_factory()
            async for source in models.ExternalDataSource.objects.filter(
                organisation__members__user=user,
                geography_column__isnull=False,
                geography_column_type__isnull=False,
            ).all()
        },
    )
    return [
        AuthenticatedPostcodeQueryResponse(postcode=postcode, loaders=loaders)
        for postcode in postcodes
    ]


@strawberry_django.field()
def postcode_search(postcode: str, info: Info) -> UnauthenticatedPostcodeQueryResponse:
    loaders = models.Loaders(postcodesIO=DataLoader(load_fn=get_bulk_postcode_geo))
    return UnauthenticatedPostcodeQueryResponse(postcode=postcode, loaders=loaders)


########################
# API token management
########################


@strawberry_django.type(models.APIToken)
class APIToken:
    token: str
    expires_at: datetime.datetime
    signature: strawberry.ID
    created_at: datetime.datetime
    revoked: bool


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def create_api_token(info: Info, expiry_days: int = 3650) -> APIToken:
    user = get_current_user(info)
    user_pk = app_settings.JWT_PAYLOAD_PK.python_name
    pk_field = {user_pk: getattr(user, user_pk)}
    expires_at = datetime.datetime.now(tz=pytz.utc) + datetime.timedelta(
        days=expiry_days
    )
    payload = TokenPayloadType(**pk_field, exp=expires_at)
    serialized = json.dumps(payload.as_dict(), sort_keys=True, indent=1)
    token = TokenType(
        token=str(
            jwt.encode(
                payload={"payload": serialized},
                key=cast(str, app_settings.JWT_SECRET_KEY.value),
                algorithm=app_settings.JWT_ALGORITHM,
            )
        ),
        payload=payload,
    )

    token_db = models.APIToken.objects.create(
        signature=token.token.split(".")[2],
        token=token.token,
        user=user,
        expires_at=expires_at,
    )
    models.refresh_tokens_cache()
    return token_db


@strawberry_django.mutation(extensions=[IsAuthenticated()])
def revoke_api_token(signature: strawberry.ID, info: Info) -> APIToken:
    token = models.APIToken.objects.get(signature=signature)
    token.revoked = True
    token.save()
    models.refresh_tokens_cache()
    return token


@strawberry_django.field(extensions=[IsAuthenticated()])
def list_api_tokens(info: Info) -> List[APIToken]:
    tokens = models.APIToken.objects.filter(user=get_current_user(info), revoked=False)
    return tokens


def decode_jwt(token: str) -> "TokenType":
    from gqlauth.core.utils import app_settings
    from gqlauth.jwt.types_ import TokenPayloadType, TokenType

    decoded = json.loads(
        jwt.decode(
            token,
            key=cast(str, app_settings.JWT_SECRET_KEY.value),
            algorithms=[
                app_settings.JWT_ALGORITHM,
            ],
        )["payload"]
    )

    signature = token.split(".")[2]

    if models.is_api_token_revoked(signature):
        return ExpiredTokenType(
            token=token, payload=TokenPayloadType.from_dict(decoded)
        )

    return TokenType(token=token, payload=TokenPayloadType.from_dict(decoded))


class ExpiredTokenType(TokenType):
    def is_expired(self) -> bool:
        return True

    def expires_at(self) -> datetime.datetime:
        return datetime.datetime.now()
