from apps.sharing.models import NoteShare, PermissionChoices
from rest_framework.permissions import BasePermission


class IsNoteOwner(BasePermission):
    """
    Permission to ensure only the note owner or shared users can access/edit.
    """

    def has_object_permission(self, request, view, obj):
        if obj.user == request.user:
            return True

        # Check if the user has an active direct share
        share = NoteShare.objects.filter(
            note=obj, shared_with=request.user, is_active=True
        ).first()

        # Check if the user has an active workspace share
        from apps.sharing.models import WorkspaceShare

        workspace_share = None
        if obj.workspace:
            workspace_share = WorkspaceShare.objects.filter(
                workspace=obj.workspace, shared_with=request.user, is_active=True
            ).first()

        if not share and not workspace_share:
            return False

        # Determine the effective permission (workspace permission can override note permission or vice versa)  # noqa: E501
        effective_permission = PermissionChoices.VIEWER
        if (
            share
            and share.permission_level == PermissionChoices.ADMIN
            or (
                workspace_share
                and workspace_share.permission_level == PermissionChoices.ADMIN
            )
        ):
            effective_permission = PermissionChoices.ADMIN
        elif (
            share
            and share.permission_level == PermissionChoices.EDITOR
            or (
                workspace_share
                and workspace_share.permission_level == PermissionChoices.EDITOR
            )
        ):
            effective_permission = PermissionChoices.EDITOR

        # Read-only methods allowed for any valid share
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Update methods require editor or admin
        if request.method in ["PUT", "PATCH"]:
            return effective_permission in [
                PermissionChoices.EDITOR,
                PermissionChoices.ADMIN,
            ]

        # Delete methods are ONLY allowed for the owner.
        if request.method == "DELETE":
            return False

        return False


class IsWorkspaceOwner(BasePermission):
    """
    Permission to ensure only the workspace owner or shared users can access/edit.
    """

    def has_object_permission(self, request, view, obj):
        if obj.user == request.user:
            return True

        # Avoid circular import by inline import
        from apps.sharing.models import PermissionChoices, WorkspaceShare

        share = WorkspaceShare.objects.filter(
            workspace=obj, shared_with=request.user, is_active=True
        ).first()
        if not share:
            return False

        # Read-only methods allowed for any valid share
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Update methods require admin
        if request.method in ["PUT", "PATCH"]:
            return share.permission_level == PermissionChoices.ADMIN

        # Delete methods are ONLY allowed for the owner.
        if request.method == "DELETE":
            return False

        return False
