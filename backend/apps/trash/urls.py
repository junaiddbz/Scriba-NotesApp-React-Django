from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import TrashViewSet

app_name = 'trash'

router = SimpleRouter()
router.register(r'', TrashViewSet, basename='trash')

urlpatterns = [
    path('', include(router.urls)),
]
