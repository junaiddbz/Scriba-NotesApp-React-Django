from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.utils import timezone

from apps.sharing.models import NoteShare, WorkspaceShare, UserOAuthProvider, PermissionChoices
from apps.sharing.serializers import (
    NoteShareSerializer,
    NoteShareListSerializer,
    WorkspaceShareSerializer,
    WorkspaceShareListSerializer,
    UserOAuthProviderSerializer
)
from apps.sharing.permissions import CanAdminNote, CanAdminWorkspace
from apps.notes.models import Note, Workspace
from apps.notes.permissions import IsNoteOwner, IsWorkspaceOwner


class NoteShareViewSet(viewsets.ModelViewSet):
    """
    ViewSet for sharing notes with other users.
    Supports: list, create, update (permission level), delete (revoke).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = NoteShareSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['permission_level', 'is_active']
    search_fields = ['shared_with__username', 'shared_with__email']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get note shares where user is either the sharer or recipient.
        """
        return NoteShare.objects.filter(
            Q(shared_by=self.request.user) | Q(shared_with=self.request.user)
        )
    
    def get_serializer_class(self):
        """Use list serializer for list views."""
        if self.action == 'list':
            return NoteShareListSerializer
        return NoteShareSerializer
    
    def perform_create(self, serializer):
        """Set current user as the share initiator."""
        note_id = self.request.data.get('note')
        
        # Verify user owns the note
        try:
            note = Note.objects.get(id=note_id, user=self.request.user)
        except Note.DoesNotExist:
            raise serializers.ValidationError('You do not own this note.')
        
        serializer.save(shared_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """
        Revoke a note share.
        POST /api/v1/note-shares/{id}/revoke/
        """
        share = self.get_object()
        
        # Only the share initiator can revoke
        if share.shared_by != request.user:
            return Response(
                {'detail': 'Only the share initiator can revoke this share.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        share.is_active = False
        share.save()
        
        return Response(
            {'message': 'Share revoked successfully.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def shared_with_me(self, request):
        """
        Get all notes shared with the current user.
        GET /api/v1/note-shares/shared-with-me/
        """
        shares = NoteShare.objects.filter(
            shared_with=request.user,
            is_active=True
        ).select_related('note', 'shared_by')
        
        serializer = NoteShareListSerializer(shares, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def shared_by_me(self, request):
        """
        Get all notes shared by the current user.
        GET /api/v1/note-shares/shared-by-me/
        """
        shares = NoteShare.objects.filter(
            shared_by=request.user,
            is_active=True
        ).select_related('note', 'shared_with')
        
        serializer = NoteShareListSerializer(shares, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceShareViewSet(viewsets.ModelViewSet):
    """
    ViewSet for sharing workspaces with other users.
    Permissions inherit to all nested notes.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceShareSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['permission_level', 'is_active']
    search_fields = ['shared_with__username', 'shared_with__email']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get workspace shares where user is either the sharer or recipient.
        """
        return WorkspaceShare.objects.filter(
            Q(shared_by=self.request.user) | Q(shared_with=self.request.user)
        )
    
    def get_serializer_class(self):
        """Use list serializer for list views."""
        if self.action == 'list':
            return WorkspaceShareListSerializer
        return WorkspaceShareSerializer
    
    def perform_create(self, serializer):
        """Set current user as the share initiator."""
        workspace_id = self.request.data.get('workspace')
        
        # Verify user owns the workspace
        try:
            workspace = Workspace.objects.get(id=workspace_id, owner=self.request.user)
        except Workspace.DoesNotExist:
            raise serializers.ValidationError('You do not own this workspace.')
        
        serializer.save(shared_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """
        Revoke a workspace share.
        POST /api/v1/workspace-shares/{id}/revoke/
        """
        share = self.get_object()
        
        # Only the share initiator can revoke
        if share.shared_by != request.user:
            return Response(
                {'detail': 'Only the share initiator can revoke this share.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        share.is_active = False
        share.save()
        
        return Response(
            {'message': 'Share revoked successfully.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def shared_with_me(self, request):
        """
        Get all workspaces shared with the current user.
        GET /api/v1/workspace-shares/shared-with-me/
        """
        shares = WorkspaceShare.objects.filter(
            shared_with=request.user,
            is_active=True
        ).select_related('workspace', 'shared_by')
        
        serializer = WorkspaceShareListSerializer(shares, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def shared_by_me(self, request):
        """
        Get all workspaces shared by the current user.
        GET /api/v1/workspace-shares/shared-by-me/
        """
        shares = WorkspaceShare.objects.filter(
            shared_by=request.user,
            is_active=True
        ).select_related('workspace', 'shared_with')
        
        serializer = WorkspaceShareListSerializer(shares, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OAuthProviderViewSet(viewsets.ViewSet):
    """
    ViewSet for managing OAuth provider connections (Google, GitHub).
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def list_connections(self, request):
        """
        Get all OAuth provider connections for current user.
        GET /api/v1/oauth/list-connections/
        """
        providers = UserOAuthProvider.objects.filter(user=request.user)
        serializer = UserOAuthProviderSerializer(providers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def disconnect(self, request):
        """
        Disconnect an OAuth provider.
        POST /api/v1/oauth/disconnect/
        
        Request:
        {
            "provider": "google"  or "github"
        }
        """
        provider = request.data.get('provider')
        
        if not provider:
            return Response(
                {'detail': 'provider is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        oauth_connection = UserOAuthProvider.objects.filter(
            user=request.user,
            provider=provider
        ).first()
        
        if not oauth_connection:
            return Response(
                {'detail': f'No {provider} connection found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        oauth_connection.delete()
        
        return Response(
            {'message': f'{provider.capitalize()} connection removed.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'])
    def google_callback(self, request):
        """
        Handle Google OAuth callback.
        POST /api/v1/oauth/google-callback/
        
        Request:
        {
            "code": "authorization_code"
        }
        """
        code = request.data.get('code')
        
        if not code:
            return Response(
                {'detail': 'Authorization code is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Exchange code for token with Google API
        # TODO: Get user info from Google
        # TODO: Create or update UserOAuthProvider record
        
        return Response(
            {'message': 'Google authentication configured. (Implementation pending)'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'])
    def github_callback(self, request):
        """
        Handle GitHub OAuth callback.
        POST /api/v1/oauth/github-callback/
        
        Request:
        {
            "code": "authorization_code"
        }
        """
        code = request.data.get('code')
        
        if not code:
            return Response(
                {'detail': 'Authorization code is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Exchange code for token with GitHub API
        # TODO: Get user info from GitHub
        # TODO: Create or update UserOAuthProvider record
        
        return Response(
            {'message': 'GitHub authentication configured. (Implementation pending)'},
            status=status.HTTP_200_OK
        )
