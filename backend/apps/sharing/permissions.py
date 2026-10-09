from apps.sharing.models import NoteShare, WorkspaceShare
from rest_framework.permissions import BasePermission


class IsNoteOwnerOrSharedWith(BasePermission):
    """
    Permission to check if user owns the note or has it shared with them.
    """

    def has_object_permission(self, request, view, obj):
        # Owner always has access
        if obj.user == request.user:
            return True

        # Check if note is shared with user
        share = NoteShare.objects.filter(
            note=obj, shared_with=request.user, is_active=True
        ).first()

        return bool(share and not share.is_expired)


class CanEditNote(BasePermission):
    """
    Permission to check if user can edit a note.
    """

    def has_object_permission(self, request, view, obj):
        # Owner can always edit
        if obj.user == request.user:
            return True

        # Check if user has editor/admin permission
        share = NoteShare.objects.filter(
            note=obj, shared_with=request.user, is_active=True
        ).first()

        return bool(share and not share.is_expired and share.can_edit())


class CanAdminNote(BasePermission):
    """
    Permission to check if user has admin access to a note.
    """

    def has_object_permission(self, request, view, obj):
        # Owner is admin by default
        if obj.user == request.user:
            return True

        # Check if user has admin permission
        share = NoteShare.objects.filter(
            note=obj, shared_with=request.user, is_active=True
        ).first()

        return bool(share and not share.is_expired and share.can_admin())


class IsWorkspaceOwnerOrSharedWith(BasePermission):
    """
    Permission to check if user owns the workspace or has it shared with them.
    """

    def has_object_permission(self, request, view, obj):
        # Owner always has access
        if obj.user == request.user:
            return True

        # Check if workspace is shared with user
        share = WorkspaceShare.objects.filter(
            workspace=obj, shared_with=request.user, is_active=True
        ).first()

        return bool(share and not share.is_expired)


class CanEditWorkspace(BasePermission):
    """
    Permission to check if user can edit a workspace.
    """

    def has_object_permission(self, request, view, obj):
        # Owner can always edit
        if obj.user == request.user:
            return True

        # Check if user has editor/admin permission
        share = WorkspaceShare.objects.filter(
            workspace=obj, shared_with=request.user, is_active=True
        ).first()

        return bool(share and not share.is_expired and share.can_edit())


class CanAdminWorkspace(BasePermission):
    """
    Permission to check if user has admin access to a workspace.
    """

    def has_object_permission(self, request, view, obj):
        # Owner is admin by default
        if obj.user == request.user:
            return True

        # Check if user has admin permission
        share = WorkspaceShare.objects.filter(
            workspace=obj, shared_with=request.user, is_active=True
        ).first()

        return bool(share and not share.is_expired and share.can_admin())
