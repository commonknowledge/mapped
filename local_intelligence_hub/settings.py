"""
Django settings for local_intelligence_hub project.

Generated by 'django-admin startproject' using Django 4.1.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""

import json
from datetime import timedelta
from pathlib import Path
from typing import List, Tuple

import environ
import posthog
from gqlauth.settings_type import GqlAuthSettings

from hub.management.commands.autoscale_render_workers import ScalingStrategy

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DATABASE_CONNECTION_POOLER_HOSTPORT=(str, None),
    MINIO_STORAGE_ENDPOINT=(str, False),
    MINIO_STORAGE_ACCESS_KEY=(str, ""),
    MINIO_STORAGE_SECRET_KEY=(str, ""),
    MINIO_STORAGE_MEDIA_BUCKET_NAME=(str, "media"),
    MINIO_STORAGE_PUBLIC_MEDIA_BUCKET_NAME=(str, "public"),
    MINIO_STORAGE_STATIC_BUCKET_NAME=(str, "static"),
    MINIO_PRIVATE_UPLOADS_BUCKET=(str, "mapped-private"),
    MINIO_STORAGE_AUTO_CREATE_MEDIA_BUCKET=(bool, True),
    MINIO_STORAGE_AUTO_CREATE_STATIC_BUCKET=(bool, True),
    EMAIL_BACKEND=(str, "django.core.mail.backends.console.EmailBackend"),
    #
    BASE_URL=(str, False),
    FRONTEND_BASE_URL=(str, False),
    ALLOWED_HOSTS=(list, []),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:3000", "https://localhost:3000"]),
    # Required for Render blueprints
    PROD_BASE_URL=(str, False),
    PROD_FRONTEND_BASE_URL=(str, False),
    PROD_ALLOWED_HOSTS=(list, []),
    PROD_CORS_ALLOWED_ORIGINS=(list, []),
    #
    FRONTEND_SITE_TITLE=(str, False),
    SCHEDULED_UPDATE_SECONDS_DELAY=(int, 3),
    DEBUG=(bool, False),
    HIDE_DEBUG_TOOLBAR=(bool, True),
    LOG_QUERIES=(bool, False),
    GOOGLE_ANALYTICS=(str, ""),
    GOOGLE_SITE_VERIFICATION=(str, ""),
    GOOGLE_SHEETS_CLIENT_CONFIG=(str, "{}"),
    TEST_SERVER_PORT=(int, 8000),
    TEST_AIRTABLE_MEMBERLIST_BASE_ID=(str, ""),
    TEST_AIRTABLE_MEMBERLIST_TABLE_NAME=(str, ""),
    TEST_AIRTABLE_MEMBERLIST_API_KEY=(str, ""),
    SKIP_AIRTABLE_TESTS=(bool, False),
    TEST_AIRTABLE_PLEDGELIST_BASE_ID=(str, ""),
    TEST_AIRTABLE_PLEDGELIST_TABLE_NAME=(str, ""),
    TEST_AIRTABLE_PLEDGELIST_API_KEY=(str, ""),
    TEST_MAILCHIMP_MEMBERLIST_API_KEY=(str, ""),
    TEST_MAILCHIMP_MEMBERLIST_AUDIENCE_ID=(str, ""),
    TEST_ACTIONNETWORK_MEMBERLIST_API_KEY=(str, ""),
    SEED_AIRTABLE_MEMBERLIST_API_KEY=(str, ""),
    SEED_AIRTABLE_MEMBERLIST_BASE_ID=(str, ""),
    SEED_AIRTABLE_MEMBERLIST_TABLE_NAME=(str, ""),
    SEED_AIRTABLE_PLEDGELIST_API_KEY=(str, ""),
    SEED_AIRTABLE_PLEDGELIST_BASE_ID=(str, ""),
    SEED_AIRTABLE_PLEDGELIST_TABLE_NAME=(str, ""),
    SEED_AIRTABLE_DATASOURCE_API_KEY=(str, ""),
    SEED_AIRTABLE_DATASOURCE_BASE_ID=(str, ""),
    SEED_AIRTABLE_DATASOURCE_TABLE_NAME=(str, ""),
    SEED_AIRTABLE_EVENTS_API_KEY=(str, ""),
    SEED_AIRTABLE_EVENTS_BASE_ID=(str, ""),
    SEED_AIRTABLE_EVENTS_TABLE_NAME=(str, ""),
    TEST_TICKET_TAILOR_API_KEY=(str, ""),
    TEST_GOOGLE_SHEETS_CREDENTIALS=(str, ""),
    TEST_GOOGLE_SHEETS_SPREADSHEET_ID=(str, ""),
    TEST_GOOGLE_SHEETS_SHEET_NAME=(str, ""),
    DJANGO_SUPERUSER_USERNAME=(str, ""),
    DJANGO_SUPERUSER_PASSWORD=(str, ""),
    DJANGO_SUPERUSER_EMAIL=(str, ""),
    DJANGO_LOG_LEVEL=(str, "INFO"),
    DJANGO_HUB_LOG_LEVEL=(str, None),
    POSTHOG_API_KEY=(str, False),
    POSTHOG_HOST=(str, False),
    ENVIRONMENT=(str, "development"),
    SENTRY_DSN=(str, False),
    SENTRY_TRACE_SAMPLE_RATE=(float, 1.0),
    CRYPTOGRAPHY_KEY=(str, ""),
    CRYPTOGRAPHY_SALT=(str, ""),
    ENCRYPTION_SECRET_KEY=(str, ""),
    ELECTORAL_COMMISSION_API_KEY=(str, ""),
    MAILCHIMP_MYSOC_KEY=(str, ""),
    MAILCHIMP_MYSOC_SERVER_PREFIX=(str, ""),
    MAILCHIMP_MYSOC_LIST_ID=(str, ""),
    MAILCHIMP_MYSOC_DATA_UPDATE_TAG=(str, ""),
    MAILCHIMP_MYSOC_CLIMATE_INTEREST=(str, ""),
    MAILCHIMP_TCC_KEY=(str, ""),
    MAILCHIMP_TCC_SERVER_PREFIX=(str, ""),
    MAILCHIMP_TCC_LIST_ID=(str, ""),
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=(str, ""),
    DATA_UPLOAD_MAX_MEMORY_SIZE=(int, 2621440),
    FILE_UPLOAD_MAX_MEMORY_SIZE=(int, 2621440),
    CURRENT_MAPIT_GENERATION=(int, 56),
    # Batch
    IMPORT_UPDATE_ALL_BATCH_SIZE=(int, 100),
    ROW_COUNT_PER_WORKER=(int, 15000),
    RENDER_API_TOKEN=(str, None),
    RENDER_WORKER_SERVICE_ID=(str, None),
    RENDER_MIN_WORKER_COUNT=(int, 1),
    RENDER_MAX_WORKER_COUNT=(int, 5),
    RENDER_WORKER_SCALING_STRATEGY=(str, ScalingStrategy.sources_and_row_count.value),
    SUPER_QUICK_IMPORT_ROW_COUNT_THRESHOLD=(int, 2000),
    MEDIUM_PRIORITY_IMPORT_ROW_COUNT_THRESHOLD=(int, 7000),
    LARGE_IMPORT_ROW_COUNT_THRESHOLD=(int, 20000),
    RUNNING_JOBS_MAX_SECONDS=(int, 60 * 5),
)

environ.Env.read_env(BASE_DIR / ".env")

ENVIRONMENT = env("ENVIRONMENT")

# Should be alphanumeric
CRYPTOGRAPHY_KEY = env("CRYPTOGRAPHY_KEY")
CRYPTOGRAPHY_SALT = env("CRYPTOGRAPHY_SALT")
ENCRYPTION_SECRET_KEY = env("ENCRYPTION_SECRET_KEY")

if CRYPTOGRAPHY_KEY is None:
    raise ValueError("CRYPTOGRAPHY_KEY must be set")
if CRYPTOGRAPHY_SALT is None:
    raise ValueError("CRYPTOGRAPHY_SALT must be set")
if ENCRYPTION_SECRET_KEY is None:
    raise ValueError("ENCRYPTION_SECRET_KEY must be set")

MAPBOX_ACCESS_TOKEN = env("MAPBOX_ACCESS_TOKEN")
GOOGLE_MAPS_API_KEY = env("GOOGLE_MAPS_API_KEY")
ELECTORAL_COMMISSION_API_KEY = env("ELECTORAL_COMMISSION_API_KEY")

# Urls
FRONTEND_BASE_URL = (
    env("FRONTEND_BASE_URL")
    if ENVIRONMENT != "production"
    else env("PROD_FRONTEND_BASE_URL")
)
BACKEND_URL = env("BASE_URL") if ENVIRONMENT != "production" else env("PROD_BASE_URL")
BASE_URL = BACKEND_URL
# Network security
ALLOWED_HOSTS = (
    env("ALLOWED_HOSTS") if ENVIRONMENT != "production" else env("PROD_ALLOWED_HOSTS")
)
CORS_ALLOWED_ORIGINS = (
    env("CORS_ALLOWED_ORIGINS")
    if ENVIRONMENT != "production"
    else env("PROD_CORS_ALLOWED_ORIGINS")
)
if FRONTEND_BASE_URL and FRONTEND_BASE_URL not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(FRONTEND_BASE_URL)

FRONTEND_SITE_TITLE = env("FRONTEND_SITE_TITLE")
SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
EMAIL_BACKEND = env("EMAIL_BACKEND")
HIDE_DEBUG_TOOLBAR = env("HIDE_DEBUG_TOOLBAR")
LOG_QUERIES = env("LOG_QUERIES")
CACHE_FILE = env("CACHE_FILE")
MAPIT_URL = env("MAPIT_URL")
MAPIT_API_KEY = env("MAPIT_API_KEY")
CURRENT_MAPIT_GENERATION = env("CURRENT_MAPIT_GENERATION")
GOOGLE_ANALYTICS = env("GOOGLE_ANALYTICS")
GOOGLE_SITE_VERIFICATION = env("GOOGLE_SITE_VERIFICATION")
GOOGLE_SHEETS_CLIENT_CONFIG = json.loads(env("GOOGLE_SHEETS_CLIENT_CONFIG"))
TEST_SERVER_PORT = env("TEST_SERVER_PORT")
TEST_AIRTABLE_MEMBERLIST_BASE_ID = env("TEST_AIRTABLE_MEMBERLIST_BASE_ID")
TEST_AIRTABLE_MEMBERLIST_TABLE_NAME = env("TEST_AIRTABLE_MEMBERLIST_TABLE_NAME")
SKIP_AIRTABLE_TESTS = env("SKIP_AIRTABLE_TESTS")
TEST_MAILCHIMP_MEMBERLIST_API_KEY = env("TEST_MAILCHIMP_MEMBERLIST_API_KEY")
TEST_MAILCHIMP_MEMBERLIST_AUDIENCE_ID = env("TEST_MAILCHIMP_MEMBERLIST_AUDIENCE_ID")
TEST_ACTIONNETWORK_MEMBERLIST_API_KEY = env("TEST_ACTIONNETWORK_MEMBERLIST_API_KEY")
TEST_TICKET_TAILOR_API_KEY = env("TEST_TICKET_TAILOR_API_KEY")
TEST_GOOGLE_SHEETS_CREDENTIALS = env("TEST_GOOGLE_SHEETS_CREDENTIALS")
TEST_GOOGLE_SHEETS_SPREADSHEET_ID = env("TEST_GOOGLE_SHEETS_SPREADSHEET_ID")
TEST_GOOGLE_SHEETS_SHEET_NAME = env("TEST_GOOGLE_SHEETS_SHEET_NAME")
TEST_AIRTABLE_MEMBERLIST_API_KEY = env("TEST_AIRTABLE_MEMBERLIST_API_KEY")

# Seed data
SEED_AIRTABLE_MEMBERLIST_API_KEY = env("SEED_AIRTABLE_MEMBERLIST_API_KEY")
SEED_AIRTABLE_MEMBERLIST_BASE_ID = env("SEED_AIRTABLE_MEMBERLIST_BASE_ID")
SEED_AIRTABLE_MEMBERLIST_TABLE_NAME = env("SEED_AIRTABLE_MEMBERLIST_TABLE_NAME")

SEED_AIRTABLE_PLEDGELIST_API_KEY = env("SEED_AIRTABLE_PLEDGELIST_API_KEY")
SEED_AIRTABLE_PLEDGELIST_BASE_ID = env("SEED_AIRTABLE_PLEDGELIST_BASE_ID")
SEED_AIRTABLE_PLEDGELIST_TABLE_NAME = env("SEED_AIRTABLE_PLEDGELIST_TABLE_NAME")

SEED_AIRTABLE_DATASOURCE_API_KEY = env("SEED_AIRTABLE_DATASOURCE_API_KEY")
SEED_AIRTABLE_DATASOURCE_BASE_ID = env("SEED_AIRTABLE_DATASOURCE_BASE_ID")
SEED_AIRTABLE_DATASOURCE_TABLE_NAME = env("SEED_AIRTABLE_DATASOURCE_TABLE_NAME")

SEED_AIRTABLE_EVENTS_API_KEY = env("SEED_AIRTABLE_EVENTS_API_KEY")
SEED_AIRTABLE_EVENTS_BASE_ID = env("SEED_AIRTABLE_EVENTS_BASE_ID")
SEED_AIRTABLE_EVENTS_TABLE_NAME = env("SEED_AIRTABLE_EVENTS_TABLE_NAME")

DJANGO_SUPERUSER_USERNAME = env("DJANGO_SUPERUSER_USERNAME")
DJANGO_SUPERUSER_PASSWORD = env("DJANGO_SUPERUSER_PASSWORD")
DJANGO_SUPERUSER_EMAIL = env("DJANGO_SUPERUSER_EMAIL")

#
DJANGO_LOG_LEVEL = env("DJANGO_LOG_LEVEL")
DJANGO_HUB_LOG_LEVEL = env("DJANGO_HUB_LOG_LEVEL")
DJANGO_HUB_LOG_LEVEL = (
    DJANGO_HUB_LOG_LEVEL if DJANGO_HUB_LOG_LEVEL is not None else DJANGO_LOG_LEVEL
)

# mailing list signup config
MAILCHIMP_MYSOC_KEY = env("MAILCHIMP_MYSOC_KEY")
MAILCHIMP_MYSOC_SERVER_PREFIX = env("MAILCHIMP_MYSOC_SERVER_PREFIX")
MAILCHIMP_MYSOC_LIST_ID = env("MAILCHIMP_MYSOC_LIST_ID")
MAILCHIMP_MYSOC_DATA_UPDATE_TAG = env("MAILCHIMP_MYSOC_DATA_UPDATE_TAG")
MAILCHIMP_MYSOC_CLIMATE_INTEREST = env("MAILCHIMP_MYSOC_CLIMATE_INTEREST")
MAILCHIMP_TCC_KEY = env("MAILCHIMP_TCC_KEY")
MAILCHIMP_TCC_SERVER_PREFIX = env("MAILCHIMP_TCC_SERVER_PREFIX")
MAILCHIMP_TCC_LIST_ID = env("MAILCHIMP_TCC_LIST_ID")

# make sure CSRF checking still works behind load balancers
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if env.str("BUGS_EMAIL", None):  # pragma: no cover
    SERVER_EMAIL = env("BUGS_EMAIL")
    ADMINS = (("mySociety bugs", env("BUGS_EMAIL")),)

NON_LOGIN_URLS = (
    "/status/",
    "/accounts/login/",
    "/accounts/logout/",
    "/accounts/password_reset/",
    "/signup/",
    "/confirmation_sent/",
    "/bad_token/",
    "/activate/",
    "/privacy/",
    "/terms/",
    "/about/",
    "/contact/",
    "/",
)

# Application definition

INSTALLED_APPS = [
    "django.contrib.gis",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.postgres",
    "polymorphic",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
    "django.contrib.sitemaps",
    "compressor",
    "django_bootstrap5",
    "django_jsonform",
    "gqlauth",
    "hub",
    "corsheaders",
    "procrastinate.contrib.django",
    "strawberry_django",
    "django_cryptography",
    "wagtail.contrib.forms",
    "wagtail.contrib.redirects",
    "wagtail.embeds",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.search",
    "wagtail.admin",
    "wagtail",
    "modelcluster",
    "taggit",
    "wagtail_json_widget",
    "codemirror2",
    "wagtail_color_panel",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "hub.middleware.django_jwt_middleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "hub.middleware.record_last_seen_middleware",
    "wagtail.contrib.redirects.middleware.RedirectMiddleware",
]

if not DEBUG:
    # Apparently this speeds up django hot reload
    # https://stackoverflow.com/a/49396824/1053937
    MIDDLEWARE.insert(1, "hub.middleware.async_whitenoise_middleware")

ROOT_URLCONF = "local_intelligence_hub.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.template.context_processors.media",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "hub.context_processors.analytics",
            ],
        },
    },
]

WSGI_APPLICATION = "local_intelligence_hub.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {"default": env.db(engine="django.contrib.gis.db.backends.postgis")}

# TODO: Re-enable this. It caused this issue:
# https://linear.app/commonknowledge/issue/MAP-1020/data-pipeline-is-completely-blocked-worker-is-reporting-connection-is#comment-e26ad8d4
# if env("DATABASE_CONNECTION_POOLER_HOSTPORT"):
#     # Replace the hostport in the DATABASE_URL with the connection pooler hostport
#     host, port = env("DATABASE_CONNECTION_POOLER_HOSTPORT").split(":")
#     DATABASES["default"]["HOST"] = host
#     DATABASES["default"]["PORT"] = port
#     # Disable server-side cursors
#     DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True
#     # Close connections after use
#     # DATABASES["default"]["CONN_MAX_AGE"] = 0
#     # Enable connection health checks
#     # DATABASES["default"]["CONN_HEALTH_CHECKS"] = True

# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# TODO: Do we want inactive users to be able to log in? If not, change to backends.ModelBackend
# See https://docs.djangoproject.com/en/5.0/ref/contrib/auth/#fields for more details
AUTHENTICATION_BACKENDS = ["django.contrib.auth.backends.AllowAllUsersModelBackend"]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


MEDIA_ROOT = BASE_DIR / ".media"
MEDIA_URL = "/media/"

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / ".static"

STATICFILES_FINDERS = (
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
    "compressor.finders.CompressorFinder",
)

STATICFILES_DIRS = [
    BASE_DIR / "build",
    BASE_DIR / "static",
    ("bootstrap", BASE_DIR / "vendor" / "bootstrap" / "scss"),
    ("bootstrap", BASE_DIR / "vendor" / "bootstrap" / "js"),
    ("chartjs", BASE_DIR / "vendor" / "chartjs" / "js"),
    ("jquery", BASE_DIR / "vendor" / "jquery" / "js"),
    ("leaflet", BASE_DIR / "vendor" / "leaflet" / "js"),
    ("papaparse", BASE_DIR / "vendor" / "papaparse" / "js"),
    ("popper", BASE_DIR / "vendor" / "popper" / "js"),
    ("vue", BASE_DIR / "vendor" / "vue" / "js"),
]


COMPRESS_PRECOMPILERS = (("text/x-scss", "django_libsass.SassCompiler"),)
COMPRESS_CSS_HASHING_METHOD = "content"


# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# django-bootstrap5 settings
# https://django-bootstrap5.readthedocs.io/en/latest/settings.html
BOOTSTRAP5 = {
    "set_placeholder": False,
    "server_side_validation": True,
    "field_renderers": {
        "default": "hub.renderers.CustomFieldRenderer",
    },
}

# Sending messages
EMAIL_HOST = env.str("EMAIL_HOST", "localhost")
EMAIL_PORT = env.str("EMAIL_PORT", 1025)
EMAIL_HOST_USER = env.str("EMAIL_HOST_USER", False)
EMAIL_HOST_PASSWORD = env.str("EMAIL_HOST_PASSWORD", False)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", False)
DEFAULT_FROM_EMAIL = env.str("DEFAULT_FROM_EMAIL", "webmaster@localhost")

POSTCODES_IO_URL = "https://postcodes.io"
POSTCODES_IO_BATCH_MAXIMUM = 100

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "common": {
            "format": "{levelname} {asctime} {name}.{funcName}:{lineno} # {message}",
            "style": "{",
            "validate": True,
        },
        "truncated": {
            "format": "{levelname} {asctime} {name}.{funcName}:{lineno} # {message:.240}",
            "style": "{",
            "validate": True,
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "common"},
        "truncated": {
            "class": "logging.StreamHandler",
            "formatter": "truncated",
        },
    },
    "loggers": {
        "procrastinate": {
            "handlers": ["truncated"],
            "level": "DEBUG",
        },
        # Silence endless waiting for job log on prod
        "procrastinate.worker.wait_for_job": {
            "handlers": ["console"],
            "level": "INFO" if ENVIRONMENT == "production" else "DEBUG",
            "propagate": False,
        },
        "django": {
            "handlers": ["console"],
            "level": DJANGO_LOG_LEVEL,
        },
        "hub": {
            "handlers": ["console"],
            "level": DJANGO_HUB_LOG_LEVEL,
        },
        "hub.parsons": {
            "handlers": ["truncated"],
            "level": DJANGO_HUB_LOG_LEVEL,
            "propagate": False,
        },
    },
}
if DEBUG:
    if LOG_QUERIES:
        LOGGING["loggers"]["django.db.backends"] = {
            "handlers": ["console"],
            "level": "DEBUG",
        }

    if HIDE_DEBUG_TOOLBAR is False:
        import socket

        hostname, _, ips = socket.gethostbyname_ex(socket.gethostname())
        INTERNAL_IPS = [ip[:-1] + "1" for ip in ips] + ["127.0.0.1", "10.0.2.2"]

        # debug toolbar has to come after django_hosts middleware
        MIDDLEWARE.insert(
            1, "strawberry_django.middlewares.debug_toolbar.DebugToolbarMiddleware"
        )

        INSTALLED_APPS += ("debug_toolbar",)

# CK Section

ASYNC_CLIENT_TIMEOUT_SECONDS = 30

IMPORT_UPDATE_ALL_BATCH_SIZE = env("IMPORT_UPDATE_ALL_BATCH_SIZE")
IMPORT_UPDATE_MANY_RETRY_COUNT = 3
ROW_COUNT_PER_WORKER = env("ROW_COUNT_PER_WORKER")
RENDER_API_TOKEN = env("RENDER_API_TOKEN")
RENDER_WORKER_SERVICE_ID = env("RENDER_WORKER_SERVICE_ID")
RENDER_MIN_WORKER_COUNT = env("RENDER_MIN_WORKER_COUNT")
RENDER_WORKER_SCALING_STRATEGY = env("RENDER_WORKER_SCALING_STRATEGY")
RENDER_MAX_WORKER_COUNT = env("RENDER_MAX_WORKER_COUNT")


def jwt_handler(token):
    from hub.graphql.types.public_queries import decode_jwt

    return decode_jwt(token)


# TODO: Decrease this when we go public
one_week = timedelta(days=7)
GQL_AUTH = GqlAuthSettings(
    EMAIL_TEMPLATE_VARIABLES={
        "frontend_base_url": FRONTEND_BASE_URL,
        "frontend_site_title": FRONTEND_SITE_TITLE,
    },
    JWT_EXPIRATION_DELTA=one_week,
    JWT_DECODE_HANDLER=jwt_handler,
    LOGIN_REQUIRE_CAPTCHA=False,
    REGISTER_REQUIRE_CAPTCHA=False,
    ALLOW_LOGIN_NOT_VERIFIED=True,
)
STRAWBERRY_DJANGO = {
    "TYPE_DESCRIPTION_FROM_MODEL_DOCSTRING": True,
    "FIELD_DESCRIPTION_FROM_HELP_TEXT": True,
    "MAP_AUTO_ID_AS_GLOBAL_ID": False,
    "DEFAULT_PK_FIELD_NAME": "id",
    "USE_DEPRECATED_FILTERS": False,
}

SCHEDULED_UPDATE_SECONDS_DELAY = env("SCHEDULED_UPDATE_SECONDS_DELAY")
SENTRY_TRACE_SAMPLE_RATE = env("SENTRY_TRACE_SAMPLE_RATE")

POSTHOG_API_KEY = env("POSTHOG_API_KEY")
POSTHOG_HOST = env("POSTHOG_HOST")
if POSTHOG_API_KEY is not False:
    posthog.project_api_key = POSTHOG_API_KEY
if POSTHOG_HOST is not False:
    posthog.host = POSTHOG_HOST
posthog_config_valid = POSTHOG_API_KEY is not False and POSTHOG_HOST is not False
posthog.disabled = not posthog_config_valid and not (ENVIRONMENT == "production")

# Configure Sentry and HSTS headers only if in production
SENTRY_DSN = env("SENTRY_DSN")
if ENVIRONMENT == "production":
    SECURE_HSTS_SECONDS = 600
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    if SENTRY_DSN is not False:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.strawberry import StrawberryIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            environment=ENVIRONMENT,
            integrations=[
                DjangoIntegration(),
                StrawberryIntegration(async_execution=True),
            ],
            # Optionally, you can adjust the logging level
            traces_sample_rate=1.0,  # Adjust sample rate as needed
        )


MINIO_STORAGE_ENDPOINT = env("MINIO_STORAGE_ENDPOINT")
MINIO_ACCESS_KEY = env("MINIO_STORAGE_ACCESS_KEY")
MINIO_SECRET_KEY = env("MINIO_STORAGE_SECRET_KEY")
MINIO_STORAGE_MEDIA_BUCKET_NAME = env("MINIO_STORAGE_MEDIA_BUCKET_NAME")
MINIO_STATIC_FILES_BUCKET = env("MINIO_STORAGE_STATIC_BUCKET_NAME")

if MINIO_STORAGE_ENDPOINT is not False:
    INSTALLED_APPS += [
        "django_minio_backend.apps.DjangoMinioBackendConfig",
    ]
    DEFAULT_FILE_STORAGE = "django_minio_backend.models.MinioBackend"
    # # STATICFILES_STORAGE = "minio_storage.storage.MinioStaticStorage"
    # MINIO_STORAGE_ACCESS_KEY = env("MINIO_STORAGE_ACCESS_KEY")
    # MINIO_STORAGE_SECRET_KEY = env("MINIO_STORAGE_SECRET_KEY")
    # MINIO_STORAGE_MEDIA_BUCKET_NAME = env("MINIO_STORAGE_MEDIA_BUCKET_NAME")
    # # MINIO_STORAGE_STATIC_BUCKET_NAME = env("MINIO_STORAGE_STATIC_BUCKET_NAME")
    # MINIO_STORAGE_AUTO_CREATE_MEDIA_BUCKET = env(
    #     "MINIO_STORAGE_AUTO_CREATE_MEDIA_BUCKET"
    # )
    # MINIO_STORAGE_AUTO_CREATE_STATIC_BUCKET = env("MINIO_STORAGE_AUTO_CREATE_STATIC_BUCKET")
    MINIO_ENDPOINT = MINIO_STORAGE_ENDPOINT
    # MINIO_EXTERNAL_ENDPOINT = "external-minio.your-company.co.uk"  # Default is same as MINIO_ENDPOINT
    # MINIO_EXTERNAL_ENDPOINT_USE_HTTPS = True  # Default is same as MINIO_USE_HTTPS
    # MINIO_REGION = 'us-east-1'  # Default is set to None
    MINIO_USE_HTTPS = True
    MINIO_URL_EXPIRY_HOURS = timedelta(
        days=1
    )  # Default is 7 days (longest) if not defined
    MINIO_CONSISTENCY_CHECK_ON_START = True
    MINIO_PRIVATE_BUCKETS = [
        MINIO_STORAGE_MEDIA_BUCKET_NAME,
    ]
    # MINIO_STORAGE_PUBLIC_MEDIA_BUCKET_NAME = env("MINIO_STORAGE_PUBLIC_MEDIA_BUCKET_NAME")
    MINIO_PUBLIC_BUCKETS = [
        # No public media as yet
        # MINIO_STORAGE_PUBLIC_MEDIA_BUCKET_NAME
    ]
    MINIO_POLICY_HOOKS: List[Tuple[str, dict]] = []
    MINIO_MEDIA_FILES_BUCKET = (
        MINIO_STORAGE_MEDIA_BUCKET_NAME  # replacement for MEDIA_ROOT
    )
    MINIO_BUCKET_CHECK_ON_SAVE = (
        True  # Default: True // Creates bucket if missing, then save
    )

CACHES = {
    "default": {
        # TODO: Set up Redis for production
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake",
    },
    # database cache for requests
    "db": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "cache_table",
        # 1 week
        "TIMEOUT": 60 * 60 * 24 * 7,
    },
}

WAGTAIL_SITE_NAME = "Mapped hub page editor"
WAGTAILADMIN_BASE_URL = BASE_URL
WAGTAILDOCS_EXTENSIONS = []
WAGTAILIMAGES_IMAGE_MODEL = "hub.HubImage"

PARSONS_LIMITED_DEPENDENCIES = True

DATA_UPLOAD_MAX_MEMORY_SIZE = env("DATA_UPLOAD_MAX_MEMORY_SIZE")
FILE_UPLOAD_MAX_MEMORY_SIZE = env("FILE_UPLOAD_MAX_MEMORY_SIZE")

SUPER_QUICK_IMPORT_ROW_COUNT_THRESHOLD = env("SUPER_QUICK_IMPORT_ROW_COUNT_THRESHOLD")
MEDIUM_PRIORITY_IMPORT_ROW_COUNT_THRESHOLD = env(
    "MEDIUM_PRIORITY_IMPORT_ROW_COUNT_THRESHOLD"
)
LARGE_IMPORT_ROW_COUNT_THRESHOLD = env("LARGE_IMPORT_ROW_COUNT_THRESHOLD")
RUNNING_JOBS_MAX_SECONDS = env("RUNNING_JOBS_MAX_SECONDS")
