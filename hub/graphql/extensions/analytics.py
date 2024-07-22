import logging

import posthog
from strawberry.extensions import SchemaExtension
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)


class APIAnalyticsExtension(SchemaExtension):
    def on_operation(self, *args, **kwargs):
        yield
        try:
            request = self.execution_context.context.request
            user = request.user

            if user:
                payload = {
                    "context": "private_api",
                    "operation_name": self.execution_context.operation_name,
                    "operation_type": self.execution_context.operation_type,
                    "path": request.path,
                    "method": request.method,
                    "headers": dict(request.headers),
                    "query_params": dict(request.GET),
                    "ip": request.META.get("REMOTE_ADDR"),
                    "user_agent": request.META.get("HTTP_USER_AGENT"),
                    "referrer": request.META.get("HTTP_REFERER"),
                    "language": request.META.get("HTTP_ACCEPT_LANGUAGE"),
                }

                if not posthog.disabled:
                    if isinstance(user, AnonymousUser):
                        posthog.identify(0, {"email": "anonymous"})
                        posthog.capture(0, "API request", properties=payload)
                    else:
                        posthog.identify(user.id, {"email": user.email})
                        posthog.capture(user.id, "API request", properties=payload)

        except Exception as e:
            logger.error(f"API Analytics Extension error: {e}")
