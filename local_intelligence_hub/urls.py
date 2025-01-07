"""local_intelligence_hub URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.urls import include, path, re_path
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import RedirectView

from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls

from hub.graphql.context import CustomSchemaView
from hub.graphql.schema import schema
from hub.sitemap import hub_sitemap
from hub.views import accounts, area, core, explore, landingpages, vector_tiles
from hub.views.mapped import ExternalDataSourceCreateWebhook, ExternalDataSourceWebhook

handler404 = core.NotFoundPageView.as_view()

urlpatterns = [
    path("", core.HomePageView.as_view(), name="home"),
    path("async-healthcheck", core.async_healthcheck),
    path("explore/", explore.ExploreView.as_view(), name="explore"),
    path(
        "explore/datasets.json",
        explore.ExploreDatasetsJSON.as_view(),
        name="explore_datasets_json",
    ),
    path(
        "exploregeometry.json",
        explore.ExploreGeometryJSON.as_view(),
        name="exploregeometry_json",
    ),
    path(
        "exploregeometry/<str:area_type>.json",
        explore.ExploreGeometryCachedJSON.as_view(),
        name="exploregeometry_cached_json",
    ),
    path("explore.json", explore.ExploreJSON.as_view(), name="explore_json"),
    path("explore.csv", explore.ExploreCSV.as_view(), name="explore_csv"),
    path("area/<str:area_type>/<str:name>", area.AreaView.as_view(), name="area"),
    path(
        "data_set/<int:data_set>/favourite",
        area.FavouriteDataSetView.as_view(),
        name="favourite_dataset",
    ),
    path(
        "data_set/<int:data_set>/unfavourite",
        area.UnFavouriteDataSetView.as_view(),
        name="unfavourite_dataset",
    ),
    path("sources/", core.SourcesView.as_view(), name="sources"),
    path(
        "future-constituencies/",
        core.FutureConstituenciesView.as_view(),
        name="future_constituencies",
    ),
    path("privacy/", core.PrivacyView.as_view(), name="privacy"),
    path("terms/", core.TermsView.as_view(), name="terms"),
    path("about/", core.AboutView.as_view(), name="about"),
    path("contact/", core.ContactView.as_view(), name="contact"),
    path("tools/", core.ToolsView.as_view(), name="tools"),
    path("location/", area.AreaSearchView.as_view(), name="area_search"),
    path("go/", include(landingpages.urlpatterns)),
    path("style/", core.StyleView.as_view(), name="style"),
    path(
        "mailing-list/", core.MailChimpSignupView.as_view(), name="mailing_list_signup"
    ),
    path(
        "mailing-list-success/",
        core.MailChimpSuccessView.as_view(),
        name="mailing_list_sucess",
    ),
    path("status/", core.StatusView.as_view(), name="status"),
    path("me/", accounts.MyAccountView.as_view(), name="my_account"),
    path("signup/", accounts.SignupView.as_view(), name="signup"),
    path(
        "confirmation_sent/",
        accounts.ConfirmationSentView.as_view(),
        name="confirmation_sent",
    ),
    path(
        "bad_token/",
        accounts.BadTokenView.as_view(),
        name="bad_token",
    ),
    path("activate_accounts/", RedirectView.as_view(url="/accounts/", permanent=False)),
    path(
        "accounts/",
        accounts.AccountsView.as_view(),
        name="accounts",
    ),
    path(
        "accounts.csv",
        accounts.AccountsCSV.as_view(),
        name="accounts_csv",
    ),
    re_path(
        "activate/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,40})/",
        accounts.ConfirmEmailView.as_view(),
        name="confirm_email",
    ),
    path("admin/", admin.site.urls),  # pragma: no cover
    path("accounts/login/", accounts.LIHLoginView.as_view(), name="login"),
    path("accounts/", include("django.contrib.auth.urls")),
    path(
        "sitemap.xml",
        sitemap,
        {"sitemaps": hub_sitemap},
        name="django.contrib.sitemaps.views.sitemap",
    ),
    path("graphql", CustomSchemaView.as_view(schema=schema), name="graphql"),
    path(
        f"{ExternalDataSourceWebhook.base_path}/<str:external_data_source_id>",
        csrf_exempt(ExternalDataSourceWebhook.as_view()),
        name="external_data_source_webhook",
    ),
    path(
        "webhook/create/<str:external_data_source_id>",
        csrf_exempt(ExternalDataSourceCreateWebhook.as_view()),
        name="external_data_source_create_webhook",
    ),
    path(
        "tiles/external-data-source/<str:pk>/<int:z>/<int:x>/<int:y>",
        vector_tiles.ExternalDataSourceTileView.as_view(),
        name="external_data_source_point_tile",
    ),
    path(
        "tiles/external-data-source/<str:pk>/tiles.json",
        vector_tiles.ExternalDataSourcePointTileJSONView.as_view(),
        name="external_data_source_point_tilejson",
    ),
    path(
        "tiles/external-data-source/<str:hostname>/<str:pk>/<int:z>/<int:x>/<int:y>",
        vector_tiles.ExternalDataSourceTileView.as_view(),
        name="external_data_source_point_tile",
    ),
    path(
        "tiles/external-data-source/<str:hostname>/<str:pk>/tiles.json",
        vector_tiles.ExternalDataSourcePointTileJSONView.as_view(),
        name="external_data_source_point_tilejson",
    ),
    path(
        "tiles/external-data-source/<str:pk>/geojson",
        vector_tiles.ExternalDataSourcePointGeoJSONView.as_view(),
        name="external_data_source_point_tilejson",
    ),
    path("cms/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),
    # For multi-tenancy wagtail page router logic
    path("", include(wagtail_urls)),
]

if settings.DEBUG:  # pragma: no cover
    if settings.HIDE_DEBUG_TOOLBAR is False:
        import debug_toolbar

        urlpatterns += [
            path("__debug__/", include(debug_toolbar.urls)),
        ]

    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
