from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import NoteViewSet

app_name = "notes"

router = SimpleRouter()
router.register(r"", NoteViewSet, basename="note")

urlpatterns = [
    path("", include(router.urls)),
]
