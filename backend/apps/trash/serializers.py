from rest_framework import serializers
from apps.notes.models import Note
from .models import TrashBin


class DeletedNoteSerializer(serializers.ModelSerializer):
    """Serializer for deleted notes in trash."""

    created_by_name = serializers.CharField(
        source="user.get_full_name", read_only=True, allow_null=True
    )
    workspace_name = serializers.CharField(
        source="workspace.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Note
        fields = [
            "id",
            "title",
            "body",
            "workspace_name",
            "created_by_name",
            "created_at",
            "updated_at",
        ]


class TrashBinSerializer(serializers.ModelSerializer):
    """Serializer for trash entries with nested note info."""

    note = DeletedNoteSerializer(read_only=True)
    note_id = serializers.IntegerField(source="note.id", read_only=True)
    note_title = serializers.CharField(source="note.title", read_only=True)

    class Meta:
        model = TrashBin
        fields = ["id", "note_id", "note_title", "note", "deleted_at", "expires_at"]
        read_only_fields = ["id", "deleted_at", "expires_at"]
