from rest_framework import status

from apps.notes.models import Note, Workspace


class TestWorkspaceCRUD:
    """Test workspace CRUD operations."""

    def test_create_workspace(self, authenticated_client, user):
        """Test creating a workspace."""
        data = {"name": "My Workspace", "description": "A test workspace"}
        response = authenticated_client.post("/api/v1/workspaces/", data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "My Workspace"
        assert Workspace.objects.filter(name="My Workspace").exists()

    def test_list_workspaces(self, authenticated_client, user):
        """Test listing workspaces."""
        # Create 3 workspaces
        for i in range(3):
            Workspace.objects.create(user=user, name=f"Workspace {i}")

        response = authenticated_client.get("/api/v1/workspaces/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3

    def test_get_workspace_detail(self, authenticated_client, user):
        """Test retrieving workspace detail."""
        workspace = Workspace.objects.create(user=user, name="Test WS")

        response = authenticated_client.get(f"/api/v1/workspaces/{workspace.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test WS"

    def test_update_workspace(self, authenticated_client, user):
        """Test updating a workspace."""
        workspace = Workspace.objects.create(user=user, name="Original")

        data = {"name": "Updated", "description": "New description"}
        response = authenticated_client.patch(
            f"/api/v1/workspaces/{workspace.id}/", data
        )
        assert response.status_code == status.HTTP_200_OK

        workspace.refresh_from_db()
        assert workspace.name == "Updated"

    def test_delete_workspace(self, authenticated_client, user):
        """Test deleting a workspace (soft deletes notes)."""
        workspace = Workspace.objects.create(user=user, name="To Delete")

        # Create a note in the workspace
        note = Note.objects.create(
            user=user, workspace=workspace, title="Note in WS", body="Content"
        )

        response = authenticated_client.delete(f"/api/v1/workspaces/{workspace.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify note is soft-deleted
        note.refresh_from_db()
        assert note.is_deleted is True


class TestWorkspaceHierarchy:
    """Test nested workspace hierarchy."""

    def test_create_nested_workspace(self, authenticated_client, user):
        """Test creating a nested workspace."""
        parent = Workspace.objects.create(user=user, name="Parent")

        data = {"name": "Child", "parent_workspace": parent.id}
        response = authenticated_client.post("/api/v1/workspaces/", data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["parent_workspace"] == parent.id

    def test_move_workspace(self, authenticated_client, user):
        """Test moving a workspace to different parent."""
        parent1 = Workspace.objects.create(user=user, name="Parent 1")
        parent2 = Workspace.objects.create(user=user, name="Parent 2")
        child = Workspace.objects.create(
            user=user, name="Child", parent_workspace=parent1
        )

        data = {"parent_workspace_id": parent2.id}
        response = authenticated_client.post(
            f"/api/v1/workspaces/{child.id}/move/", data
        )
        assert response.status_code == status.HTTP_200_OK

        child.refresh_from_db()
        assert child.parent_workspace.id == parent2.id

    def test_get_workspace_tree(self, authenticated_client, user):
        """Test getting hierarchical workspace tree."""
        root = Workspace.objects.create(user=user, name="Root")
        child = Workspace.objects.create(user=user, name="Child", parent_workspace=root)
        Workspace.objects.create(user=user, name="Grandchild", parent_workspace=child)

        response = authenticated_client.get("/api/v1/workspaces/tree/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

    def test_circular_reference_prevention(self, authenticated_client, user):
        """Test that circular references are prevented."""
        parent = Workspace.objects.create(user=user, name="Parent")
        child = Workspace.objects.create(
            user=user, name="Child", parent_workspace=parent
        )

        # Try to make parent a child of its own child (circular reference)
        data = {"parent_workspace_id": child.id}
        response = authenticated_client.post(
            f"/api/v1/workspaces/{parent.id}/move/", data
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
