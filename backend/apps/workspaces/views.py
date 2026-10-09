from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.notes.models import Note, Workspace
from apps.notes.permissions import IsWorkspaceOwner

from .serializers import WorkspaceSerializer, WorkspaceTreeSerializer


class WorkspaceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Workspace CRUD operations.
    Supports hierarchical folder structure.
    """

    permission_classes = [IsAuthenticated, IsWorkspaceOwner]
    serializer_class = WorkspaceSerializer

    def get_queryset(self):
        """Only show workspaces belonging to the authenticated user or shared with them."""
        return Workspace.objects.filter(
            Q(user=self.request.user)
            | Q(shares__shared_with=self.request.user, shares__is_active=True)
        ).distinct()

    def perform_create(self, serializer):
        """Set the current user as the workspace owner."""
        workspace = serializer.save(user=self.request.user)
        from apps.notes.models import WorkspaceActivity

        WorkspaceActivity.log(workspace, self.request.user, "Created workspace")

    def perform_update(self, serializer):
        old_workspace = self.get_object()
        old_name = old_workspace.name
        old_desc = old_workspace.description

        workspace = serializer.save()
        from apps.notes.models import WorkspaceActivity

        if old_name != workspace.name:
            WorkspaceActivity.log(
                workspace,
                self.request.user,
                "Changed workspace name",
                {"old": old_name, "new": workspace.name},
            )
        if old_desc != workspace.description:
            WorkspaceActivity.log(
                workspace,
                self.request.user,
                "Changed workspace description",
                {"old": old_desc, "new": workspace.description},
            )

    def perform_destroy(self, instance):
        """
        Delete workspace and soft-delete all notes in it (cascade).
        """
        # Soft delete all notes in this workspace and its children
        self._soft_delete_workspace_notes(instance)
        instance.delete()

    def _soft_delete_workspace_notes(self, workspace):
        """Recursively soft-delete notes in workspace and its children."""
        # Soft delete notes in this workspace
        Note.objects.filter(workspace=workspace, is_deleted=False).update(
            is_deleted=True
        )

        # Recursively delete child workspaces
        for child in workspace.children.all():
            self._soft_delete_workspace_notes(child)

    @action(detail=False, methods=["get"])
    def tree(self, request):
        """
        Get hierarchical tree of all workspaces for the user.
        GET /api/v1/workspaces/tree/
        """
        # Get only root workspaces (no parent)
        root_workspaces = Workspace.objects.filter(
            Q(user=request.user)
            | Q(shares__shared_with=request.user, shares__is_active=True),
            parent_workspace__isnull=True,
        ).distinct()
        serializer = WorkspaceTreeSerializer(root_workspaces, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def activities(self, request, pk=None):
        """
        Get recent activities for this workspace.
        GET /api/v1/workspaces/{id}/activities/
        """
        workspace = self.get_object()
        activities = workspace.activities.all()[:50]
        from .serializers import WorkspaceActivitySerializer

        serializer = WorkspaceActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def move(self, request, pk=None):
        """
        Move workspace to a different parent.
        POST /api/v1/workspaces/{id}/move/
        Body: {parent_workspace_id: null or id}
        """
        workspace = self.get_object()
        parent_id = request.data.get("parent_workspace_id")

        if parent_id is None:
            workspace.parent_workspace = None
        else:
            try:
                parent = Workspace.objects.get(id=parent_id, user=request.user)

                # Check for circular reference
                if self._is_descendant(workspace, parent):
                    return Response(
                        {"detail": "Cannot move workspace to its own child."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                workspace.parent_workspace = parent
            except Workspace.DoesNotExist:
                return Response(
                    {"detail": "Parent workspace not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        workspace.save()
        serializer = self.get_serializer(workspace)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _is_descendant(self, parent, child):
        """Check if child is a descendant of parent (prevent circular references)."""
        current = child.parent_workspace
        while current:
            if current.id == parent.id:
                return True
            current = current.parent_workspace
        return False
