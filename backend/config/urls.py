from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # API Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # API v1
    path("api/v1/auth/", include("apps.auth.urls", namespace="auth")),
    path("api/v1/notes/", include("apps.notes.urls", namespace="notes")),
    path("api/v1/workspaces/", include("apps.workspaces.urls", namespace="workspaces")),
    path("api/v1/trash/", include("apps.trash.urls", namespace="trash")),
    path("api/v1/", include("apps.sharing.urls", namespace="sharing")),
    # Health check
    path(
        "api/health/",
        lambda request: __import__("django.http").JsonResponse({"status": "ok"}),
        name="health",
    ),
]

# Debug toolbar
if settings.DEBUG:
    urlpatterns += [
        path("__debug__/", include("debug_toolbar.urls")),
    ]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
