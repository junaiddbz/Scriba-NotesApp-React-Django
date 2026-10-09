from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import WorkspaceViewSet

app_name = "workspaces"

router = SimpleRouter()
router.register(r"", WorkspaceViewSet, basename="workspace")

urlpatterns = [
    path("", include(router.urls)),
]
