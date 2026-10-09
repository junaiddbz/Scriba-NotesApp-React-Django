from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import TrashBin
from .serializers import TrashBinSerializer


class TrashViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for trash bin management.
    Allows restoring or permanently deleting soft-deleted notes.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = TrashBinSerializer

    def get_queryset(self):
        """Only show trash entries belonging to the authenticated user."""
        return TrashBin.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """
        Restore a note from trash.
        POST /api/v1/trash/{id}/restore/
        """
        trash_entry = self.get_object()
        note = trash_entry.note

        # Restore note
        note.is_deleted = False
        note.workspace = trash_entry.original_workspace
        note.save()

        # Remove from trash
        trash_entry.delete()

        return Response(
            {"message": f'Note "{note.title}" restored successfully.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def empty(self, request):
        """
        Empty entire trash for the authenticated user.
        POST /api/v1/trash/empty/
        """
        # Get all trash entries for the user
        trash_entries = self.get_queryset()
        deleted_count = 0

        # Permanently delete all notes in trash
        for trash_entry in trash_entries:
            note = trash_entry.note
            deleted_count += 1
            note.delete()

        return Response(
            {
                "message": f"Permanently deleted {deleted_count} notes from trash.",
                "deleted_count": deleted_count,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["delete"])
    def permanent_delete(self, request, pk=None):
        """
        Permanently delete a note (hard delete).
        DELETE /api/v1/trash/{id}/permanent_delete/
        """
        trash_entry = self.get_object()
        note = trash_entry.note
        note_title = note.title

        # Delete all attachments from S3 (if implemented)
        # for attachment in note.attachments.all():
        #     delete_from_s3(attachment.s3_url)

        # Hard delete note
        note.delete()

        return Response(
            {"message": f'Note "{note_title}" permanently deleted.'},
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/v1/trash/{id}/
        Permanently delete a note.
        """
        return self.permanent_delete(request, *args, **kwargs)
