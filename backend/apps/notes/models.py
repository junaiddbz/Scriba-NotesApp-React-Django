from django.db import models
from apps.auth.models import CustomUser


class Workspace(models.Model):
    """
    Hierarchical workspace/folder structure.
    parent_workspace_id allows nesting (recursive relationship).
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='workspaces')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    parent_workspace = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='children',
        blank=True,
        null=True,
        help_text='Parent workspace for hierarchical organization'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['user_id', 'parent_workspace_id']),
        ]
    
    def __str__(self):
        return self.name


class Note(models.Model):
    """
    Core Note model with autosave support.
    - user:owner of the note
    - workspace: which folder/collection
    - content: Rich text (HTML or JSON from TipTap)
    - is_deleted: Soft delete flag
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notes')
    workspace = models.ForeignKey(Workspace, on_delete=models.SET_NULL, related_name='notes', null=True, blank=True)

    title = models.CharField(max_length=255)
    body = models.TextField(blank=True, default='')
    tags = models.JSONField(default=list, blank=True)
    is_favorite = models.BooleanField(default=False, db_index=True)
    
    is_deleted = models.BooleanField(default=False, db_index=True)
    last_edited_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notes_edited'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    custom_sort_index = models.BigIntegerField(default=0)
    
    class Meta:
        ordering = ['-custom_sort_index', '-updated_at']
        indexes = [
            models.Index(fields=['user_id', 'workspace_id']),
            models.Index(fields=['user_id', 'is_deleted']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return self.title


class NoteVersion(models.Model):
    """
    Version history snapshots of notes.
    Triggered by autosave (Celery task).
    """
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='versions')
    content_snapshot = models.TextField()
    editor = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    change_description = models.CharField(max_length=500, blank=True)
    version_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-version_number']
        indexes = [
            models.Index(fields=['note_id', 'version_number']),
        ]
        unique_together = [['note', 'version_number']]
    
    def __str__(self):
        return f"v{self.version_number} of {self.note.title}"


class MediaAttachment(models.Model):
    """
    Media files attached to notes (images, files).
    Stored in S3 (presigned URLs).
    """
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='attachments')
    s3_url = models.URLField()
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50, default='image/jpeg')
    file_size = models.IntegerField(default=0)  # bytes
    uploader = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['note_id']),
        ]
    
    def __str__(self):
        return self.original_filename


class NoteLink(models.Model):
    """
    Bidirectional linking between notes (like Obsidian).
    """
    source_note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='outgoing_links')
    target_note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='incoming_links')
    link_type = models.CharField(max_length=50, default='references')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['source_note_id', 'target_note_id']),
        ]
        unique_together = [['source_note', 'target_note']]
    
    def __str__(self):
        return f"{self.source_note.title} -> {self.target_note.title}"


class WorkspaceActivity(models.Model):
    """
    Detailed audit log for workspace activities.
    """
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=100)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace_id', '-created_at']),
        ]

    def __str__(self):
        username = self.user.get_full_name() or self.user.email if self.user else "System"
        return f"{username} {self.action_type} in {self.workspace.name}"

    @staticmethod
    def log(workspace, user, action_type, details=None):
        if workspace is None:
            return None
        if not details:
            details = {}
        return WorkspaceActivity.objects.create(
            workspace=workspace,
            user=user,
            action_type=action_type,
            details=details
        )
