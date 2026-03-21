from rest_framework.permissions import BasePermission
from apps.sharing.models import NoteShare, WorkspaceShare, PermissionChoices


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
            note=obj,
            shared_with=request.user,
            is_active=True
        ).first()
        
        if share and not share.is_expired:
            return True
        
        return False


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
            note=obj,
            shared_with=request.user,
            is_active=True
        ).first()
        
        if share and not share.is_expired and share.can_edit():
            return True
        
        return False


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
            note=obj,
            shared_with=request.user,
            is_active=True
        ).first()
        
        if share and not share.is_expired and share.can_admin():
            return True
        
        return False


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
            workspace=obj,
            shared_with=request.user,
            is_active=True
        ).first()
        
        if share and not share.is_expired:
            return True
        
        return False


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
            workspace=obj,
            shared_with=request.user,
            is_active=True
        ).first()
        
        if share and not share.is_expired and share.can_edit():
            return True
        
        return False


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
            workspace=obj,
            shared_with=request.user,
            is_active=True
        ).first()
        
        if share and not share.is_expired and share.can_admin():
            return True
        
        return False
