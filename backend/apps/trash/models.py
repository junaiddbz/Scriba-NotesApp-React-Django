from datetime import timedelta

from django.db import models
from django.utils import timezone

from apps.auth.models import CustomUser
from apps.notes.models import Note


class TrashBin(models.Model):
    """
    Soft-deleted notes sit here for 30 days before permanent deletion.
    """

    note = models.OneToOneField(
        Note, on_delete=models.CASCADE, related_name="trash_entry"
    )
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="trash")
    original_workspace = models.ForeignKey(
        "notes.Workspace",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="trash_entries",
    )
    deleted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # deleted_at + 30 days

    class Meta:
        ordering = ["-deleted_at"]
        indexes = [
            models.Index(fields=["user_id", "deleted_at"]),
            models.Index(fields=["expires_at"]),
        ]

    def save(self, *args, **kwargs):
        """Set expiration date to 30 days from now if not already set."""
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Trash: {self.note.title}"

    @classmethod
    def create_from_note(cls, note, user):
        """Create a trash entry for a note."""
        return cls.objects.create(
            note=note, user=user, original_workspace=note.workspace
        )
