from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.notes.models import Note, Workspace

User = get_user_model()


class PermissionChoices(models.TextChoices):
    """Permission levels for shared resources."""
    VIEWER = 'viewer', 'View Only'
    EDITOR = 'editor', 'Can Edit'
    ADMIN = 'admin', 'Full Admin Access'


class NoteShare(models.Model):
    """
    Model for sharing notes with other users.
    Allows granular permission control per note.
    """
    note = models.ForeignKey(
        Note,
        on_delete=models.CASCADE,
        related_name='shares'
    )
    shared_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notes_shared_by_me'
    )
    shared_with = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='shared_with_me'
    )
    permission_level = models.CharField(
        max_length=20,
        choices=PermissionChoices.choices,
        default=PermissionChoices.VIEWER
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Automatic revocation date for time-limited shares'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Soft delete - user can deactivate without losing history'
    )
    is_hidden = models.BooleanField(
        default=False,
        help_text='Whether the shared user has hidden this note from their main view'
    )

    class Meta:
        unique_together = ('note', 'shared_with')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shared_with', 'is_active']),
            models.Index(fields=['note', 'is_active']),
        ]

    def __str__(self):
        return f'{self.note.title} shared with {self.shared_with.username} ({self.permission_level})'

    @property
    def is_expired(self):
        """Check if share has expired due to time limit."""
        if self.expires_at and timezone.now() > self.expires_at:
            return True
        return False

    def can_edit(self):
        """Check if shared user has edit permission."""
        return self.permission_level in [PermissionChoices.EDITOR, PermissionChoices.ADMIN]

    def can_admin(self):
        """Check if shared user has admin permission."""
        return self.permission_level == PermissionChoices.ADMIN


class WorkspaceShare(models.Model):
    """
    Model for sharing entire workspaces with other users.
    Permissions inherit to all nested notes.
    """
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='shares'
    )
    shared_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='workspaces_shared_by_me'
    )
    shared_with = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='workspaces_shared_with_me'
    )
    permission_level = models.CharField(
        max_length=20,
        choices=PermissionChoices.choices,
        default=PermissionChoices.VIEWER
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Automatic revocation date for time-limited shares'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Soft delete - user can deactivate without losing history'
    )
    is_hidden = models.BooleanField(
        default=False,
        help_text='Whether the shared user has hidden this workspace from their main view'
    )

    class Meta:
        unique_together = ('workspace', 'shared_with')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shared_with', 'is_active']),
            models.Index(fields=['workspace', 'is_active']),
        ]

    def __str__(self):
        return f'{self.workspace.name} workspace shared with {self.shared_with.username} ({self.permission_level})'

    @property
    def is_expired(self):
        """Check if share has expired due to time limit."""
        if self.expires_at and timezone.now() > self.expires_at:
            return True
        return False

    def can_edit(self):
        """Check if shared user has edit permission."""
        return self.permission_level in [PermissionChoices.EDITOR, PermissionChoices.ADMIN]

    def can_admin(self):
        """Check if shared user has admin permission."""
        return self.permission_level == PermissionChoices.ADMIN


class CollaborativeEdit(models.Model):
    """
    Model for tracking collaborative editing and conflict resolution.
    Stores edit operations for real-time collaboration and merging.
    """
    note = models.ForeignKey(
        Note,
        on_delete=models.CASCADE,
        related_name='edits'
    )
    editor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='edits'
    )
    operation_type = models.CharField(
        max_length=20,
        choices=[
            ('insert', 'Insert text'),
            ('delete', 'Delete text'),
            ('replace', 'Replace text'),
            ('format', 'Change formatting'),
        ]
    )
    position = models.IntegerField(
        help_text='Character position in note content'
    )
    content_before = models.TextField(
        help_text='Content before the operation'
    )
    content_after = models.TextField(
        help_text='Content after the operation'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    conflict_resolved = models.BooleanField(
        default=False,
        help_text='Whether this edit has been flagged as conflicting and resolved'
    )

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['note', 'created_at']),
        ]

    def __str__(self):
        return f'{self.editor.username} - {self.operation_type} on {self.note.title}'


class UserOAuthProvider(models.Model):
    """
    Model for storing OAuth provider credentials and user mappings.
    Allows users to login via Google, GitHub, or other OAuth providers.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='oauth_providers'
    )
    provider = models.CharField(
        max_length=50,
        choices=[
            ('google', 'Google'),
            ('github', 'GitHub'),
        ]
    )
    provider_user_id = models.CharField(
        max_length=255,
        help_text='Unique identifier from OAuth provider'
    )
    provider_email = models.EmailField(
        help_text='Email from OAuth provider'
    )
    access_token = models.TextField(
        help_text='OAuth access token for API calls (encrypted in production)'
    )
    refresh_token = models.TextField(
        null=True,
        blank=True,
        help_text='OAuth refresh token (encrypted in production)'
    )
    token_expires_at = models.DateTimeField(
        null=True,
        blank=True
    )
    connected_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('provider', 'provider_user_id')
        ordering = ['-connected_at']

    def __str__(self):
        return f'{self.user.username} - {self.provider}'
