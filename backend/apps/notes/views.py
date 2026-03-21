from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Note, NoteVersion, MediaAttachment, NoteLink, Workspace
from .serializers import (
    NoteListSerializer, NoteDetailSerializer, NoteCreateUpdateSerializer,
    NoteVersionSerializer, MediaAttachmentSerializer, NoteLinkSerializer
)
from .permissions import IsNoteOwner
from .filters import NoteFilter
from shared.s3_service import S3Service
from config.tasks import create_note_version_snapshot
from apps.trash.models import TrashBin


class NoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Note CRUD operations.
    Supports autosave (PATCH), versioning, and searching.
    """
    permission_classes = [IsAuthenticated, IsNoteOwner]
    filterset_class = NoteFilter
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'body']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        """Only show notes belonging to the authenticated user."""
        return Note.objects.filter(user=self.request.user, is_deleted=False)
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail views."""
        if self.action == 'list':
            return NoteListSerializer
        elif self.action in ['create', 'partial_update', 'update']:
            return NoteCreateUpdateSerializer
        return NoteDetailSerializer
    
    def perform_create(self, serializer):
        """Set the current user as the note owner."""
        serializer.save(user=self.request.user, last_edited_by=self.request.user)
    
    def perform_update(self, serializer):
        """Track who last edited the note and trigger version snapshot."""
        note = serializer.save(last_edited_by=self.request.user)
        
        # Create version snapshot synchronously (no Celery broker needed)
        try:
            create_note_version_snapshot(note_id=note.id, change_description='Note updated')
        except Exception as e:
            # Log the error but don't fail the update request
            print(f'Error creating version snapshot: {str(e)}')

    
    def perform_destroy(self, instance):
        """Soft delete: set is_deleted=True and create TrashBin entry."""
        instance.is_deleted = True
        instance.save()
        
        # Create trash bin entry so note appears in trash
        TrashBin.create_from_note(instance, self.request.user)
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restore a soft-deleted note.
        POST /api/v1/notes/{id}/restore/
        """
        note = self.get_object()
        if not note.is_deleted:
            return Response(
                {'detail': 'Note is not deleted.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        note.is_deleted = False
        note.save()
        return Response(
            {'message': 'Note restored successfully.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """
        Get version history for a note.
        GET /api/v1/notes/{id}/versions/
        """
        note = self.get_object()
        versions = note.versions.all()
        serializer = NoteVersionSerializer(versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='versions/(?P<version_id>[0-9]+)/restore')
    def restore_version(self, request, pk=None, version_id=None):
        """
        Restore a note to a specific previous version.
        POST /api/v1/notes/{id}/versions/{version_id}/restore/
        """
        note = self.get_object()
        try:
            version = note.versions.get(id=version_id)
        except NoteVersion.DoesNotExist:
            return Response(
                {'detail': 'Version not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create new version from old version
        note.content = version.content_snapshot
        note.last_edited_by = request.user
        note.save()
        
        # Create new version record
        new_version_number = note.versions.count() + 1
        NoteVersion.objects.create(
            note=note,
            content_snapshot=version.content_snapshot,
            editor=request.user,
            change_description=f'Restored from v{version.version_number}',
            version_number=new_version_number
        )
        
        return Response(
            {'message': f'Note restored to version {version.version_number}.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get', 'post'])
    def attachments(self, request, pk=None):
        """
        Get or upload attachments (images, files).
        GET /api/v1/notes/{id}/attachments/
        POST /api/v1/notes/{id}/attachments/  (with presigned URL)
        """
        note = self.get_object()
        
        if request.method == 'GET':
            attachments = note.attachments.all()
            serializer = MediaAttachmentSerializer(attachments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        if request.method == 'POST':
            # TODO: Generate presigned S3 URL
            serializer = MediaAttachmentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(note=note, uploader=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get', 'post'])
    def links(self, request, pk=None):
        """
        Get bidirectional links (backlinks) or create new links.
        GET /api/v1/notes/{id}/links/  (Get all linked notes)
        POST /api/v1/notes/{id}/links/ (Create link to another note)
        """
        note = self.get_object()
        
        if request.method == 'GET':
            # Get both outgoing and incoming links
            outgoing = note.outgoing_links.all()
            incoming = note.incoming_links.all()
            
            outgoing_serializer = NoteLinkSerializer(outgoing, many=True)
            incoming_serializer = NoteLinkSerializer(incoming, many=True)
            
            return Response({
                'outgoing': outgoing_serializer.data,
                'incoming': incoming_serializer.data,
            }, status=status.HTTP_200_OK)
        
        if request.method == 'POST':
            target_note_id = request.data.get('target_note_id')
            link_type = request.data.get('link_type', 'references')
            
            if not target_note_id:
                return Response(
                    {'detail': 'target_note_id is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                target_note = Note.objects.get(id=target_note_id, user=request.user)
            except Note.DoesNotExist:
                return Response(
                    {'detail': 'Target note not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if note.id == target_note.id:
                return Response(
                    {'detail': 'Cannot link a note to itself.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            link, created = NoteLink.objects.get_or_create(
                source_note=note,
                target_note=target_note,
                defaults={'link_type': link_type}
            )
            
            serializer = NoteLinkSerializer(link)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
    
    @action(detail=True, methods=['post'])
    def presigned_url(self, request, pk=None):
        """
        Generate presigned S3 URL for direct browser upload.
        POST /api/v1/notes/{id}/presigned-url/
        
        Request body:
        {
            "file_name": "image.png",
            "file_type": "image/png"
        }
        
        Response:
        {
            "upload_url": "https://s3.amazonaws.com/...",
            "s3_key": "uploads/timestamp/image.png",
            "max_file_size": 10485760
        }
        """
        note = self.get_object()
        
        file_name = request.data.get('file_name')
        file_type = request.data.get('file_type')
        
        if not file_name or not file_type:
            return Response(
                {'detail': 'file_name and file_type are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            s3_service = S3Service()
            presigned_data = s3_service.generate_presigned_upload_url(
                file_name=file_name,
                file_type=file_type
            )
            
            # Store S3 key in MediaAttachment for later retrieval
            attachment = MediaAttachment.objects.create(
                note=note,
                uploader=request.user,
                s3_key=presigned_data['s3_key'],
                file_name=file_name
            )
            
            return Response({
                'upload_url': presigned_data['url'],
                's3_key': presigned_data['s3_key'],
                'max_file_size': 10 * 1024 * 1024,  # 10MB
                'attachment_id': attachment.id
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'detail': f'Failed to generate presigned URL: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'], url_path='links/(?P<target_note_id>[0-9]+)')
    def delete_link(self, request, pk=None, target_note_id=None):
        """
        Delete a link between notes.
        DELETE /api/v1/notes/{id}/links/{target_note_id}/
        """
        note = self.get_object()
        try:
            link = NoteLink.objects.get(source_note=note, target_note_id=target_note_id)
            link.delete()
            return Response(
                {'message': 'Link deleted successfully.'},
                status=status.HTTP_200_OK
            )
        except NoteLink.DoesNotExist:
            return Response(
                {'detail': 'Link not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
