from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import TrashViewSet

app_name = "trash"

router = SimpleRouter()
router.register(r"", TrashViewSet, basename="trash")

urlpatterns = [
    path("", include(router.urls)),
]
