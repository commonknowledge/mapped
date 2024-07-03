from __future__ import annotations

import logging
import re
from datetime import timedelta
from inspect import isawaitable
from typing import Awaitable
from urllib.parse import urlsplit

from django.http import HttpRequest
from django.http.response import HttpResponse, HttpResponseBase
from django.utils.cache import patch_vary_headers
from django.utils.decorators import sync_and_async_middleware
from django.utils.timezone import now

from asgiref.sync import async_to_sync, iscoroutinefunction, sync_to_async
from corsheaders import middleware as cors_middleware
from corsheaders.conf import conf
from corsheaders.signals import check_request_enabled
from gqlauth.core.middlewares import USER_OR_ERROR_KEY, UserOrError
from gqlauth.core.middlewares import django_jwt_middleware as _django_jwt_middleware
from gqlauth.core.types_ import GQLAuthError, GQLAuthErrors
from whitenoise.middleware import WhiteNoiseMiddleware

from hub.models import UserProperties

logger = logging.getLogger(__name__)


@sync_and_async_middleware
def record_last_seen_middleware(get_response):
    one_day = timedelta(hours=24)

    def process_request(request):
        if request.user.is_authenticated:
            user = request.user
            props, _ = UserProperties.objects.get_or_create(user=user)
            last_seen = request.session.get("last_seen", None)
            yesterday = now().replace(hour=0, minute=0) - one_day
            if last_seen is None or last_seen < yesterday.timestamp():
                props.last_seen = now()
                request.session["last_seen"] = props.last_seen.timestamp()
                props.save()

    if iscoroutinefunction(get_response):

        async def middleware(request: HttpRequest):
            await sync_to_async(process_request)(request)
            return await get_response(request)

    else:

        def middleware(request: HttpRequest):
            process_request(request)
            return get_response(request)

    return middleware


@sync_and_async_middleware
def async_whitenoise_middleware(get_response):
    def logic(request):
        return WhiteNoiseMiddleware(get_response)(request)

    if iscoroutinefunction(get_response):

        async def middleware(request: HttpRequest):
            response = logic(request)
            if isawaitable(response):
                response = await response
            return response

    else:

        def middleware(request: HttpRequest):
            return logic(request)

    return middleware


@sync_and_async_middleware
def django_jwt_middleware(get_response):
    """
    Wrap the gqlauth jwt middleware in an exception
    handler (initially added because if a user is
    deleted, the middleware throws an error,
    causing a 500 instead of a 403).
    """
    gqlauth_middleware = _django_jwt_middleware(get_response)

    def exception_handler(error: Exception, request: HttpRequest):
        logger.warning(f"Gqlauth middleware error: {error}")
        user_or_error = UserOrError()
        user_or_error.error = GQLAuthError(code=GQLAuthErrors.UNAUTHENTICATED)
        setattr(request, USER_OR_ERROR_KEY, user_or_error)

    if iscoroutinefunction(get_response):

        async def middleware(request: HttpRequest):
            try:
                return await gqlauth_middleware(request)
            except Exception as e:
                exception_handler(e, request)
            return await get_response(request)

    else:

        def middleware(request: HttpRequest):
            try:
                return gqlauth_middleware(request)
            except Exception as e:
                exception_handler(e, request)
            return get_response(request)

    return middleware


class CorsMiddleware(cors_middleware.CorsMiddleware):
    """
    Override library CorsMiddleware to support async signals, required
    for running the app in ASGI mode (see hub.handlers.py).
    """

    def __call__(
        self, request: HttpRequest
    ) -> HttpResponseBase | Awaitable[HttpResponseBase]:
        if self.async_mode:
            return self.__acall__(request)
        response: HttpResponseBase | None = async_to_sync(self.check_preflight)(request)
        if response is None:
            result = self.get_response(request)
            assert isinstance(result, HttpResponseBase)
            response = result
        async_to_sync(self.add_response_headers)(request, response)
        return response

    async def __acall__(self, request: HttpRequest) -> HttpResponseBase:
        response = await self.check_preflight(request)
        if response is None:
            result = self.get_response(request)
            assert not isinstance(result, HttpResponseBase)
            response = await result
        await self.add_response_headers(request, response)
        return response

    async def check_preflight(self, request: HttpRequest) -> HttpResponseBase | None:
        """
        Generate a response for CORS preflight requests.
        """
        request._cors_enabled = await self.is_enabled(request)  # type: ignore [attr-defined]
        if (
            request._cors_enabled  # type: ignore [attr-defined]
            and request.method == "OPTIONS"
            and "access-control-request-method" in request.headers
        ):
            return HttpResponse(headers={"content-length": "0"})
        return None

    async def add_response_headers(
        self, request: HttpRequest, response: HttpResponseBase
    ) -> HttpResponseBase:
        """
        Add the respective CORS headers
        """
        enabled = getattr(request, "_cors_enabled", None)
        if enabled is None:
            enabled = await self.is_enabled(request)

        if not enabled:
            return response

        patch_vary_headers(response, ("origin",))

        origin = request.headers.get("origin")
        if not origin:
            return response

        try:
            url = urlsplit(origin)
        except ValueError:
            return response

        if (
            not conf.CORS_ALLOW_ALL_ORIGINS
            and not self.origin_found_in_white_lists(origin, url)
            and not await self.check_signal(request)
        ):
            return response

        if conf.CORS_ALLOW_ALL_ORIGINS and not conf.CORS_ALLOW_CREDENTIALS:
            response[cors_middleware.ACCESS_CONTROL_ALLOW_ORIGIN] = "*"
        else:
            response[cors_middleware.ACCESS_CONTROL_ALLOW_ORIGIN] = origin

        if conf.CORS_ALLOW_CREDENTIALS:
            response[cors_middleware.ACCESS_CONTROL_ALLOW_CREDENTIALS] = "true"

        if len(conf.CORS_EXPOSE_HEADERS):
            response[cors_middleware.ACCESS_CONTROL_EXPOSE_HEADERS] = ", ".join(
                conf.CORS_EXPOSE_HEADERS
            )

        if request.method == "OPTIONS":
            response[cors_middleware.ACCESS_CONTROL_ALLOW_HEADERS] = ", ".join(
                conf.CORS_ALLOW_HEADERS
            )
            response[cors_middleware.ACCESS_CONTROL_ALLOW_METHODS] = ", ".join(
                conf.CORS_ALLOW_METHODS
            )
            if conf.CORS_PREFLIGHT_MAX_AGE:
                response[cors_middleware.ACCESS_CONTROL_MAX_AGE] = str(
                    conf.CORS_PREFLIGHT_MAX_AGE
                )

        if (
            conf.CORS_ALLOW_PRIVATE_NETWORK
            and request.headers.get(
                cors_middleware.ACCESS_CONTROL_REQUEST_PRIVATE_NETWORK
            )
            == "true"
        ):
            response[cors_middleware.ACCESS_CONTROL_ALLOW_PRIVATE_NETWORK] = "true"

        return response

    async def is_enabled(self, request: HttpRequest) -> bool:
        return bool(
            re.match(conf.CORS_URLS_REGEX, request.path_info)
        ) or await self.check_signal(request)

    async def check_signal(self, request: HttpRequest) -> bool:
        signal_responses = await check_request_enabled.asend(
            sender=None, request=request
        )
        return any(return_value for function, return_value in signal_responses)
