from rest_framework import serializers
from .models import Note, NoteVersion, MediaAttachment, NoteLink


class NoteListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing notes."""
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'body', 'created_at', 'updated_at', 'workspace_id']


class NoteDetailSerializer(serializers.ModelSerializer):
    """Full serializer for note detail view."""
    last_edited_by_name = serializers.SerializerMethodField()
    version_count = serializers.SerializerMethodField()
    backlinks = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = [
            'id', 'title', 'body', 'tags', 'workspace_id',
            'last_edited_by', 'last_edited_by_name',
            'created_at', 'updated_at',
            'version_count', 'backlinks'
        ]
    
    def get_last_edited_by_name(self, obj):
        if obj.last_edited_by:
            return obj.last_edited_by.get_full_name()
        return None
    
    def get_version_count(self, obj):
        return obj.versions.count()
    
    def get_backlinks(self, obj):
        incoming_links = obj.incoming_links.values_list('source_note_id', flat=True)
        return list(incoming_links)


class NoteCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating notes (autosave)."""
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'body', 'workspace_id', 'tags', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_title(self, value):
        # Title is optional - if provided, it cannot be just whitespace
        if value and not value.strip():
            raise serializers.ValidationError('Title cannot be empty.')
        return value


class NoteVersionSerializer(serializers.ModelSerializer):
    """Serializer for note version history."""
    editor_email = serializers.CharField(source='editor.email', read_only=True)
    
    class Meta:
        model = NoteVersion
        fields = ['id', 'version_number', 'content_snapshot', 'editor_email',
                  'change_description', 'created_at']
        read_only_fields = ['id', 'version_number', 'created_at']


class MediaAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for media attachments."""
    
    class Meta:
        model = MediaAttachment
        fields = ['id', 's3_url', 'original_filename', 'file_type', 'file_size', 'uploaded_at']
        read_only_fields = ['id', 's3_url', 'uploaded_at']


class NoteLinkSerializer(serializers.ModelSerializer):
    """Serializer for bidirectional note links."""
    target_note_title = serializers.CharField(source='target_note.title', read_only=True)
    source_note_title = serializers.CharField(source='source_note.title', read_only=True)
    
    class Meta:
        model = NoteLink
        fields = ['id', 'source_note', 'source_note_title',
                  'target_note', 'target_note_title', 'link_type', 'created_at']
        read_only_fields = ['id', 'created_at']


class PresignedURLSerializer(serializers.Serializer):
    """Serializer for generating S3 presigned upload URLs."""
    filename = serializers.CharField(max_length=255)
    file_type = serializers.CharField(max_length=50)
    
    def validate_file_type(self, value):
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if value not in allowed_types:
            raise serializers.ValidationError(f'File type {value} is not allowed.')
        return value
