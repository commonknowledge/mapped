from corsheaders.signals import check_request_enabled
from wagtail.models import Site
from urllib.parse import urlparse


def cors_logic(sender, request, **kwargs):
    # if not already handled by CORS_ALLOWED_ORIGINS

    # Anyone can access the public API
    if isinstance(request.path, str) and request.path.startswith("/api/"):
        return True

    # And multi-tenant sites can acces the API and media assets etc.
    request_origin = urlparse(request.headers["origin"])
    request_hostname = request_origin.hostname
    return Site.objects.filter(hostname=request_hostname).exists()


# https://pypi.org/project/django-cors-headers/#:~:text=com%22%2C%0A%5D-,Signals,-If%20you%20have
check_request_enabled.connect(cors_logic)
