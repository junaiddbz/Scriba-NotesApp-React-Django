from rest_framework.permissions import BasePermission


class IsNoteOwner(BasePermission):
    """
    Permission to ensure only the note owner can edit/delete their notes.
    """
    
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsWorkspaceOwner(BasePermission):
    """
    Permission to ensure only the workspace owner can edit/delete.
    """
    
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
