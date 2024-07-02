import logging

from django.conf import settings

import httpx
from benedict import benedict

from utils.cached_fn import async_cached_fn
from utils.py import transform_dict_values_recursive

logger = logging.getLogger(__name__)


def standardise_postcode(postcode: str):
    return postcode.replace(" ", "")


def create_key(postcode: str):
    postcode = standardise_postcode(postcode)
    return f"electoral_commission_postcode_lookup:{postcode}"


@async_cached_fn(key=create_key, timeout_seconds=60 * 60 * 24, cache_type="db")
async def electoral_commision_postcode_lookup(postcode: str):
    postcode = standardise_postcode(postcode)
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(settings.ASYNC_CLIENT_TIMEOUT_SECONDS)
    ) as client:
        url = f"https://api.electoralcommission.org.uk/api/v1/postcode/{postcode}/?token={settings.ELECTORAL_COMMISSION_API_KEY}"
        logger.info(f"getting electoral commission postcode url: {url}")
        response = await client.get(url)
        json = response.json()
        json = transform_dict_values_recursive(
            json, lambda v: v.replace("\n", ", ") if isinstance(v, str) else v
        )
        logger.info(f"electoral commission json: {json}")
        return benedict(json)


@async_cached_fn(
    key=lambda a: f"electoral_commission_address_lookup:{a}",
    timeout_seconds=60 * 60 * 24,
    cache_type="db",
)
async def electoral_commision_address_lookup(address_slug: str):
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(settings.ASYNC_CLIENT_TIMEOUT_SECONDS)
    ) as client:
        url = f"https://api.electoralcommission.org.uk/api/v1/address/{address_slug}/?token={settings.ELECTORAL_COMMISSION_API_KEY}"
        logger.info(f"getting electoral commission address: {url}")
        response = await client.get(url)
        json = response.json()
        json = transform_dict_values_recursive(
            json, lambda v: v.replace("\n", ", ") if isinstance(v, str) else v
        )
        logger.info(f"electoral commission json: {json}")
        return benedict(json)
