from apps.notes.models import Note, Workspace
from apps.sharing.models import (
    NoteShare,
    PermissionChoices,
    UserOAuthProvider,
    WorkspaceShare,
)
from apps.sharing.serializers import (
    NoteShareListSerializer,
    NoteShareSerializer,
    UserOAuthProviderSerializer,
    WorkspaceShareListSerializer,
    WorkspaceShareSerializer,
)
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class NoteShareViewSet(viewsets.ModelViewSet):
    """
    ViewSet for sharing notes with other users.
    Supports: list, create, update (permission level), delete (revoke).
    """

    permission_classes = [IsAuthenticated]
    serializer_class = NoteShareSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["permission_level", "is_active"]
    search_fields = ["shared_with__username", "shared_with__email"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Get note shares where user is either the sharer, recipient, or an admin/owner of the note.
        """
        return NoteShare.objects.filter(
            Q(shared_by=self.request.user)
            | Q(shared_with=self.request.user)
            | Q(note__user=self.request.user)
            | Q(
                note__shares__shared_with=self.request.user,
                note__shares__permission_level=PermissionChoices.ADMIN,
                note__shares__is_active=True,
            )
        ).distinct()

    def get_serializer_class(self):
        """Use list serializer for list views."""
        if self.action == "list":
            return NoteShareListSerializer
        return NoteShareSerializer

    def perform_create(self, serializer):
        """Set current user as the share initiator."""
        note_id = self.request.data.get("note")

        # Verify user owns the note or is an admin
        note = Note.objects.filter(id=note_id).first()
        if not note:
            raise serializers.ValidationError("Note not found.")

        if note.user != self.request.user:
            # Check if user has admin permission
            share = NoteShare.objects.filter(
                note=note,
                shared_with=self.request.user,
                permission_level=PermissionChoices.ADMIN,
                is_active=True,
            ).first()
            if not share:
                raise serializers.ValidationError(
                    "You do not have permission to share this note."
                )

        serializer.save(shared_by=self.request.user)

    def _check_admin_permission(self, share, request):
        if share.note.user == request.user:
            return True, False  # is_admin, is_self
        is_self = share.shared_with == request.user
        user_share = NoteShare.objects.filter(
            note=share.note,
            shared_with=request.user,
            permission_level=PermissionChoices.ADMIN,
            is_active=True,
        ).first()
        if user_share:
            return True, is_self
        return False, is_self

    def update(self, request, *args, **kwargs):
        share = self.get_object()
        is_admin, is_self = self._check_admin_permission(share, request)
        if not is_admin:
            return Response(
                {"detail": "You do not have permission to modify this share."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if is_self and share.note.user != request.user:
            return Response(
                {"detail": "Admins cannot modify their own permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        share = self.get_object()
        is_admin, is_self = self._check_admin_permission(share, request)
        if not is_admin:
            return Response(
                {"detail": "You do not have permission to modify this share."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if is_self and share.note.user != request.user:
            return Response(
                {"detail": "Admins cannot modify their own permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return self.revoke(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="toggle-hide")
    def toggle_hide(self, request, pk=None):
        """
        Toggle the is_hidden status for the recipient.
        POST /api/v1/note-shares/{id}/toggle-hide/
        """
        share = self.get_object()
        if share.shared_with != request.user:
            return Response(
                {"detail": "You can only hide your own shares."},
                status=status.HTTP_403_FORBIDDEN,
            )
        share.is_hidden = not share.is_hidden
        share.save()
        return Response(
            {"is_hidden": share.is_hidden, "message": "Visibility updated."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        """
        Revoke a note share.
        POST /api/v1/note-shares/{id}/revoke/
        """
        share = self.get_object()
        is_admin, is_self = self._check_admin_permission(share, request)

        if not is_admin:
            return Response(
                {"detail": "You do not have permission to revoke this share."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if is_self and share.note.user != request.user:
            return Response(
                {"detail": "Admins cannot remove their own share."},
                status=status.HTTP_403_FORBIDDEN,
            )

        share.is_active = False
        share.save()

        return Response(
            {"message": "Share revoked successfully."}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"], url_path="shared-with-me")
    def shared_with_me(self, request):
        """
        Get all notes shared with the current user.
        GET /api/v1/note-shares/shared-with-me/
        """
        shares = NoteShare.objects.filter(
            shared_with=request.user, is_active=True, note__is_deleted=False
        ).select_related("note", "shared_by")

        serializer = NoteShareListSerializer(shares, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="shared-by-me")
    def shared_by_me(self, request):
        """
        Get all notes shared by the current user.
        GET /api/v1/note-shares/shared-by-me/
        """
        shares = NoteShare.objects.filter(
            shared_by=request.user, is_active=True, note__is_deleted=False
        ).select_related("note", "shared_with")

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
    filterset_fields = ["permission_level", "is_active"]
    search_fields = ["shared_with__username", "shared_with__email"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Get workspace shares where user is either the sharer, recipient, or an admin/owner of the workspace.  # noqa: E501
        """
        return WorkspaceShare.objects.filter(
            Q(shared_by=self.request.user)
            | Q(shared_with=self.request.user)
            | Q(workspace__user=self.request.user)
            | Q(
                workspace__shares__shared_with=self.request.user,
                workspace__shares__permission_level=PermissionChoices.ADMIN,
                workspace__shares__is_active=True,
            )
        ).distinct()

    def get_serializer_class(self):
        """Use list serializer for list views."""
        if self.action == "list":
            return WorkspaceShareListSerializer
        return WorkspaceShareSerializer

    def perform_create(self, serializer):
        """Set current user as the share initiator."""
        workspace_id = self.request.data.get("workspace")

        # Verify user owns the workspace
        try:
            Workspace.objects.get(id=workspace_id, user=self.request.user)
        except Workspace.DoesNotExist:
            raise serializers.ValidationError("You do not own this workspace.")

        serializer.save(shared_by=self.request.user)

    def _check_admin_permission(self, share, request):
        if share.workspace.user == request.user:
            return True, False  # is_admin, is_self
        is_self = share.shared_with == request.user
        user_share = WorkspaceShare.objects.filter(
            workspace=share.workspace,
            shared_with=request.user,
            permission_level=PermissionChoices.ADMIN,
            is_active=True,
        ).first()
        if user_share:
            return True, is_self
        return False, is_self

    def update(self, request, *args, **kwargs):
        share = self.get_object()
        is_admin, is_self = self._check_admin_permission(share, request)
        if not is_admin:
            return Response(
                {"detail": "You do not have permission to modify this share."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if is_self and share.workspace.user != request.user:
            return Response(
                {"detail": "Admins cannot modify their own permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        share = self.get_object()
        is_admin, is_self = self._check_admin_permission(share, request)
        if not is_admin:
            return Response(
                {"detail": "You do not have permission to modify this share."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if is_self and share.workspace.user != request.user:
            return Response(
                {"detail": "Admins cannot modify their own permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return self.revoke(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="toggle-hide")
    def toggle_hide(self, request, pk=None):
        """
        Toggle the is_hidden status for the recipient.
        POST /api/v1/note-shares/{id}/toggle-hide/
        """
        share = self.get_object()
        if share.shared_with != request.user:
            return Response(
                {"detail": "You can only hide your own shares."},
                status=status.HTTP_403_FORBIDDEN,
            )
        share.is_hidden = not share.is_hidden
        share.save()
        return Response(
            {"is_hidden": share.is_hidden, "message": "Visibility updated."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        """
        Revoke a workspace share.
        POST /api/v1/workspace-shares/{id}/revoke/
        """
        share = self.get_object()
        is_admin, is_self = self._check_admin_permission(share, request)

        if not is_admin:
            return Response(
                {"detail": "You do not have permission to revoke this share."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if is_self and share.workspace.user != request.user:
            return Response(
                {"detail": "Admins cannot remove their own share."},
                status=status.HTTP_403_FORBIDDEN,
            )

        share.is_active = False
        share.save()

        return Response(
            {"message": "Share revoked successfully."}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"], url_path="shared-with-me")
    def shared_with_me(self, request):
        """
        Get all workspaces shared with the current user.
        GET /api/v1/workspace-shares/shared-with-me/
        """
        shares = WorkspaceShare.objects.filter(
            shared_with=request.user, is_active=True
        ).select_related("workspace", "shared_by")

        serializer = WorkspaceShareListSerializer(shares, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="shared-by-me")
    def shared_by_me(self, request):
        """
        Get all workspaces shared by the current user.
        GET /api/v1/workspace-shares/shared-by-me/
        """
        shares = WorkspaceShare.objects.filter(
            shared_by=request.user, is_active=True
        ).select_related("workspace", "shared_with")

        serializer = WorkspaceShareListSerializer(shares, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OAuthProviderViewSet(viewsets.ViewSet):
    """
    ViewSet for managing OAuth provider connections (Google, GitHub).
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="list-connections")
    def list_connections(self, request):
        """
        Get all OAuth provider connections for current user.
        GET /api/v1/oauth/list-connections/
        """
        providers = UserOAuthProvider.objects.filter(user=request.user)
        serializer = UserOAuthProviderSerializer(providers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def disconnect(self, request):
        """
        Disconnect an OAuth provider.
        POST /api/v1/oauth/disconnect/

        Request:
        {
            "provider": "google"  or "github"
        }
        """
        provider = request.data.get("provider")

        if not provider:
            return Response(
                {"detail": "provider is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        oauth_connection = UserOAuthProvider.objects.filter(
            user=request.user, provider=provider
        ).first()

        if not oauth_connection:
            return Response(
                {"detail": f"No {provider} connection found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        oauth_connection.delete()

        return Response(
            {"message": f"{provider.capitalize()} connection removed."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="google-callback")
    def google_callback(self, request):
        """
        Handle Google OAuth callback.
        POST /api/v1/oauth/google-callback/

        Request:
        {
            "code": "authorization_code"
        }
        """
        code = request.data.get("code")

        if not code:
            return Response(
                {"detail": "Authorization code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # TODO: Exchange code for token with Google API
        # TODO: Get user info from Google
        # TODO: Create or update UserOAuthProvider record

        return Response(
            {"message": "Google authentication configured. (Implementation pending)"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="github-callback")
    def github_callback(self, request):
        """
        Handle GitHub OAuth callback.
        POST /api/v1/oauth/github-callback/

        Request:
        {
            "code": "authorization_code"
        }
        """
        code = request.data.get("code")

        if not code:
            return Response(
                {"detail": "Authorization code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # TODO: Exchange code for token with GitHub API
        # TODO: Get user info from GitHub
        # TODO: Create or update UserOAuthProvider record

        return Response(
            {"message": "GitHub authentication configured. (Implementation pending)"},
            status=status.HTTP_200_OK,
        )
