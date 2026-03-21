from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.sharing.views import NoteShareViewSet, WorkspaceShareViewSet, OAuthProviderViewSet

app_name = 'sharing'

router = DefaultRouter()
router.register(r'note-shares', NoteShareViewSet, basename='note-share')
router.register(r'workspace-shares', WorkspaceShareViewSet, basename='workspace-share')
router.register(r'oauth', OAuthProviderViewSet, basename='oauth')

urlpatterns = [
    path('', include(router.urls)),
]
