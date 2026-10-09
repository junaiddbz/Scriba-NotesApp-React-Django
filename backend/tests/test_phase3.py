from datetime import timedelta

import pytest
from apps.auth.models import CustomUser
from apps.notes.models import Note, Workspace
from apps.sharing.models import (
    NoteShare,
    PermissionChoices,
    UserOAuthProvider,
    WorkspaceShare,
)
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestNoteSharing(TestCase):
    """Test note sharing functionality."""

    def setUp(self):
        self.client = APIClient()

        # Create users
        self.owner = CustomUser.objects.create_user(
            email="owner@example.com", username="owner", password="testpass123"
        )
        self.editor = CustomUser.objects.create_user(
            email="editor@example.com", username="editor", password="testpass123"
        )
        self.viewer = CustomUser.objects.create_user(
            email="viewer@example.com", username="viewer", password="testpass123"
        )

        # Create workspace and note
        self.workspace = Workspace.objects.create(
            name="Test Workspace", user=self.owner
        )
        self.note = Note.objects.create(
            title="Test Note", body="Content", user=self.owner
        )
        self.note.workspace = self.workspace
        self.note.save()

        self.client.force_authenticate(user=self.owner)

    def test_share_note_with_permission_levels(self):
        """Test sharing note with different permission levels."""
        # Share as editor
        response = self.client.post(
            "/api/v1/note-shares/",
            {
                "note": self.note.id,
                "shared_with": self.editor.id,
                "permission_level": PermissionChoices.EDITOR,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        # Verify share was created
        share = NoteShare.objects.get(note=self.note, shared_with=self.editor)
        assert share.permission_level == PermissionChoices.EDITOR
        assert share.shared_by == self.owner

    def test_cannot_share_with_yourself(self):
        """Test that user cannot share note with themselves."""
        response = self.client.post(
            "/api/v1/note-shares/",
            {
                "note": self.note.id,
                "shared_with": self.owner.id,
                "permission_level": PermissionChoices.EDITOR,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "yourself" in str(response.data).lower()

    def test_revoke_note_share(self):
        """Test revoking a note share."""
        # Create share
        share = NoteShare.objects.create(
            note=self.note,
            shared_by=self.owner,
            shared_with=self.editor,
            permission_level=PermissionChoices.EDITOR,
        )

        # Revoke share
        response = self.client.post(
            f"/api/v1/note-shares/{share.id}/revoke/", format="json"
        )

        assert response.status_code == status.HTTP_200_OK

        # Verify share is deactivated
        share.refresh_from_db()
        assert share.is_active is False

    def test_cannot_revoke_others_share(self):
        """Test that user cannot revoke shares they didn't create."""
        share = NoteShare.objects.create(
            note=self.note,
            shared_by=self.owner,
            shared_with=self.editor,
            permission_level=PermissionChoices.EDITOR,
        )

        # Try to revoke as the shared-with user
        self.client.force_authenticate(user=self.editor)
        response = self.client.post(
            f"/api/v1/note-shares/{share.id}/revoke/", format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_shared_with_me_endpoint(self):
        """Test getting notes shared with current user."""
        # Create share
        NoteShare.objects.create(
            note=self.note,
            shared_by=self.owner,
            shared_with=self.editor,
            permission_level=PermissionChoices.EDITOR,
        )

        self.client.force_authenticate(user=self.editor)
        response = self.client.get("/api/v1/note-shares/shared-with-me/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["note"] == self.note.id

    def test_shared_by_me_endpoint(self):
        """Test getting notes shared by current user."""
        # Create multiple shares
        NoteShare.objects.create(
            note=self.note,
            shared_by=self.owner,
            shared_with=self.editor,
            permission_level=PermissionChoices.EDITOR,
        )
        NoteShare.objects.create(
            note=self.note,
            shared_by=self.owner,
            shared_with=self.viewer,
            permission_level=PermissionChoices.VIEWER,
        )

        response = self.client.get("/api/v1/note-shares/shared-by-me/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_expired_share_not_valid(self):
        """Test that expired shares are marked as expired."""
        # Create expired share
        expired_time = timezone.now() - timedelta(hours=1)
        share = NoteShare.objects.create(
            note=self.note,
            shared_by=self.owner,
            shared_with=self.editor,
            permission_level=PermissionChoices.EDITOR,
            expires_at=expired_time,
        )

        assert share.is_expired is True

    def test_permission_checks(self):
        """Test permission level checks."""
        # Create shares with different permissions
        editor_share = NoteShare.objects.create(
            note=self.note,
            shared_by=self.owner,
            shared_with=self.editor,
            permission_level=PermissionChoices.EDITOR,
        )

        viewer_share = NoteShare.objects.create(
            note=self.note,
            shared_by=self.owner,
            shared_with=self.viewer,
            permission_level=PermissionChoices.VIEWER,
        )

        # Check editor permissions
        assert editor_share.can_edit() is True
        assert editor_share.can_admin() is False

        # Check viewer permissions
        assert viewer_share.can_edit() is False
        assert viewer_share.can_admin() is False


@pytest.mark.django_db
class TestWorkspaceSharing(TestCase):
    """Test workspace sharing functionality."""

    def setUp(self):
        self.client = APIClient()

        self.owner = CustomUser.objects.create_user(
            email="owner@example.com", username="owner", password="testpass123"
        )
        self.collaborator = CustomUser.objects.create_user(
            email="collab@example.com", username="collaborator", password="testpass123"
        )

        self.workspace = Workspace.objects.create(
            name="Test Workspace", user=self.owner
        )

        self.client.force_authenticate(user=self.owner)

    def test_share_workspace(self):
        """Test sharing entire workspace."""
        response = self.client.post(
            "/api/v1/workspace-shares/",
            {
                "workspace": self.workspace.id,
                "shared_with": self.collaborator.id,
                "permission_level": PermissionChoices.EDITOR,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        share = WorkspaceShare.objects.get(
            workspace=self.workspace, shared_with=self.collaborator
        )
        assert share.permission_level == PermissionChoices.EDITOR

    def test_cannot_share_workspace_you_dont_own(self):
        """Test that user cannot share workspace they don't own."""
        other_workspace = Workspace.objects.create(
            name="Other Workspace", user=self.collaborator
        )

        response = self.client.post(
            "/api/v1/workspace-shares/",
            {
                "workspace": other_workspace.id,
                "shared_with": self.collaborator.id,
                "permission_level": PermissionChoices.EDITOR,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestOAuthIntegration(TestCase):
    """Test OAuth provider integration."""

    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email="user@example.com", username="testuser", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)

    def test_list_oauth_connections(self):
        """Test listing OAuth provider connections."""
        # Create OAuth connection
        UserOAuthProvider.objects.create(
            user=self.user,
            provider="google",
            provider_user_id="google_123",
            provider_email="user@gmail.com",
            access_token="access_token_123",
        )

        response = self.client.get("/api/v1/oauth/list-connections/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["provider"] == "google"

    def test_disconnect_oauth_provider(self):
        """Test disconnecting OAuth provider."""
        oauth_provider = UserOAuthProvider.objects.create(
            user=self.user,
            provider="google",
            provider_user_id="google_123",
            provider_email="user@gmail.com",
            access_token="access_token_123",
        )

        response = self.client.post(
            "/api/v1/oauth/disconnect/", {"provider": "google"}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert not UserOAuthProvider.objects.filter(id=oauth_provider.id).exists()

    def test_disconnect_nonexistent_provider(self):
        """Test disconnecting provider that doesn't exist."""
        response = self.client.post(
            "/api/v1/oauth/disconnect/", {"provider": "github"}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_google_callback_validation(self):
        """Test Google OAuth callback expects authorization code."""
        response = self.client.post("/api/v1/oauth/google-callback/", {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

        response = self.client.post(
            "/api/v1/oauth/google-callback/", {"code": "auth_code_123"}, format="json"
        )

        # Should return pending implementation message
        assert response.status_code == status.HTTP_200_OK

    def test_github_callback_validation(self):
        """Test GitHub OAuth callback expects authorization code."""
        response = self.client.post("/api/v1/oauth/github-callback/", {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPhase3Integration(TestCase):
    """Integration tests for Phase 3 sharing features."""

    def setUp(self):
        self.client = APIClient()

        self.owner = CustomUser.objects.create_user(
            email="owner@example.com", username="owner", password="testpass123"
        )
        self.collaborator = CustomUser.objects.create_user(
            email="collab@example.com", username="collaborator", password="testpass123"
        )

        self.workspace = Workspace.objects.create(
            name="Project Workspace", user=self.owner
        )

        self.note = Note.objects.create(
            title="Project Notes", body="Initial content", user=self.owner
        )
        self.note.workspace = self.workspace
        self.note.save()

    def test_full_sharing_workflow(self):
        """Test complete sharing workflow."""
        self.client.force_authenticate(user=self.owner)

        # Step 1: Share workspace
        ws_response = self.client.post(
            "/api/v1/workspace-shares/",
            {
                "workspace": self.workspace.id,
                "shared_with": self.collaborator.id,
                "permission_level": PermissionChoices.EDITOR,
            },
            format="json",
        )
        assert ws_response.status_code == status.HTTP_201_CREATED

        # Step 2: Share specific note with higher privilege
        note_response = self.client.post(
            "/api/v1/note-shares/",
            {
                "note": self.note.id,
                "shared_with": self.collaborator.id,
                "permission_level": PermissionChoices.ADMIN,
            },
            format="json",
        )
        assert note_response.status_code == status.HTTP_201_CREATED

        # Step 3: Collaborator sees shared resources
        self.client.force_authenticate(user=self.collaborator)

        ws_list = self.client.get("/api/v1/workspace-shares/shared-with-me/")
        assert ws_list.status_code == status.HTTP_200_OK
        assert len(ws_list.data) == 1

        note_list = self.client.get("/api/v1/note-shares/shared-with-me/")
        assert note_list.status_code == status.HTTP_200_OK
        assert len(note_list.data) == 1

        # Step 4: Owner revokes access
        self.client.force_authenticate(user=self.owner)

        share_id = note_response.data["id"]
        revoke_response = self.client.post(
            f"/api/v1/note-shares/{share_id}/revoke/", format="json"
        )
        assert revoke_response.status_code == status.HTTP_200_OK

        # Step 5: Verify collaborator can no longer see note in their shares
        self.client.force_authenticate(user=self.collaborator)

        note_list = self.client.get("/api/v1/note-shares/shared-with-me/")
        assert note_list.status_code == status.HTTP_200_OK
        assert len(note_list.data) == 0
