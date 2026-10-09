from rest_framework import serializers
from .models import Note, NoteVersion, MediaAttachment, NoteLink, Workspace


class NoteListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing notes."""

    user_permission = serializers.SerializerMethodField()
    share_id = serializers.SerializerMethodField()
    is_hidden = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = [
            "id",
            "title",
            "body",
            "created_at",
            "updated_at",
            "workspace_id",
            "is_favorite",
            "user_permission",
            "share_id",
            "is_hidden",
        ]

    def _get_user_share(self, obj):
        request = self.context.get("request")
        if not request or not request.user:
            return None
        if getattr(obj, "user_id", None) == request.user.id or obj.user == request.user:
            return None
        # Avoid circular import by inline import
        from apps.sharing.models import NoteShare

        return NoteShare.objects.filter(
            note=obj, shared_with=request.user, is_active=True
        ).first()

    def get_user_permission(self, obj):
        request = self.context.get("request")
        if not request or not request.user:
            return "viewer"

        if obj.user == request.user:
            return "owner"

        from apps.sharing.models import NoteShare, WorkspaceShare, PermissionChoices

        # Check direct share
        share = NoteShare.objects.filter(
            note=obj, shared_with=request.user, is_active=True
        ).first()

        # Check workspace share
        workspace_share = None
        if obj.workspace:
            workspace_share = WorkspaceShare.objects.filter(
                workspace=obj.workspace, shared_with=request.user, is_active=True
            ).first()

        if not share and not workspace_share:
            return "viewer"

        # Determine highest permission level
        if (share and share.permission_level == PermissionChoices.ADMIN) or (
            workspace_share
            and workspace_share.permission_level == PermissionChoices.ADMIN
        ):
            return PermissionChoices.ADMIN

        if (share and share.permission_level == PermissionChoices.EDITOR) or (
            workspace_share
            and workspace_share.permission_level == PermissionChoices.EDITOR
        ):
            return PermissionChoices.EDITOR

        return PermissionChoices.VIEWER

    def get_share_id(self, obj):
        share = self._get_user_share(obj)
        return share.id if share else None

    def get_is_hidden(self, obj):
        share = self._get_user_share(obj)
        return share.is_hidden if share else False


class NoteDetailSerializer(serializers.ModelSerializer):
    """Full serializer for note detail view."""

    last_edited_by_name = serializers.SerializerMethodField()
    version_count = serializers.SerializerMethodField()
    backlinks = serializers.SerializerMethodField()
    user_permission = serializers.SerializerMethodField()
    workspace_name = serializers.CharField(source="workspace.name", read_only=True)

    owner_email = serializers.CharField(source="user.email", read_only=True)
    owner_name = serializers.SerializerMethodField()
    active_shares = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = [
            "id",
            "title",
            "body",
            "tags",
            "workspace_id",
            "workspace_name",
            "is_favorite",
            "user",
            "owner_email",
            "owner_name",
            "last_edited_by",
            "last_edited_by_name",
            "created_at",
            "updated_at",
            "version_count",
            "backlinks",
            "user_permission",
            "active_shares",
        ]

    def get_owner_name(self, obj):
        return obj.user.get_full_name()

    def get_last_edited_by_name(self, obj):
        if obj.last_edited_by:
            return obj.last_edited_by.get_full_name() or obj.last_edited_by.email
        return None

    def get_version_count(self, obj):
        return obj.versions.count()

    def get_backlinks(self, obj):
        incoming_links = obj.incoming_links.values_list("source_note_id", flat=True)
        return list(incoming_links)

    def get_active_shares(self, obj):
        # All members can see who has access, but only owner/admin can modify
        from apps.sharing.models import NoteShare

        shares = NoteShare.objects.filter(note=obj, is_active=True).select_related(
            "shared_with"
        )
        return [
            {
                "id": share.id,
                "email": share.shared_with.email,
                "name": share.shared_with.get_full_name(),
                "permission": share.permission_level,
            }
            for share in shares
        ]

    def get_user_permission(self, obj):
        request = self.context.get("request")
        if not request or not request.user:
            return "viewer"

        if obj.user == request.user:
            return "owner"

        from apps.sharing.models import NoteShare, WorkspaceShare, PermissionChoices

        # Check direct share
        share = NoteShare.objects.filter(
            note=obj, shared_with=request.user, is_active=True
        ).first()

        # Check workspace share
        workspace_share = None
        if obj.workspace:
            workspace_share = WorkspaceShare.objects.filter(
                workspace=obj.workspace, shared_with=request.user, is_active=True
            ).first()

        if not share and not workspace_share:
            return "viewer"

        # Determine highest permission level
        if (share and share.permission_level == PermissionChoices.ADMIN) or (
            workspace_share
            and workspace_share.permission_level == PermissionChoices.ADMIN
        ):
            return PermissionChoices.ADMIN

        if (share and share.permission_level == PermissionChoices.EDITOR) or (
            workspace_share
            and workspace_share.permission_level == PermissionChoices.EDITOR
        ):
            return PermissionChoices.EDITOR

        return PermissionChoices.VIEWER


class NoteCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating notes (autosave)."""

    workspace_id = serializers.PrimaryKeyRelatedField(
        queryset=Workspace.objects.all(),
        source="workspace",
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Note
        fields = [
            "id",
            "title",
            "body",
            "workspace_id",
            "tags",
            "is_favorite",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_title(self, value):
        # Title is optional - if provided, it cannot be just whitespace
        if value and not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value


class NoteVersionSerializer(serializers.ModelSerializer):
    """Serializer for note version history."""

    editor_email = serializers.CharField(source="editor.email", read_only=True)

    class Meta:
        model = NoteVersion
        fields = [
            "id",
            "version_number",
            "content_snapshot",
            "editor_email",
            "change_description",
            "created_at",
        ]
        read_only_fields = ["id", "version_number", "created_at"]


class MediaAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for media attachments."""

    class Meta:
        model = MediaAttachment
        fields = [
            "id",
            "s3_url",
            "original_filename",
            "file_type",
            "file_size",
            "uploaded_at",
        ]
        read_only_fields = ["id", "s3_url", "uploaded_at"]


class NoteLinkSerializer(serializers.ModelSerializer):
    """Serializer for bidirectional note links."""

    target_note_title = serializers.CharField(
        source="target_note.title", read_only=True
    )
    source_note_title = serializers.CharField(
        source="source_note.title", read_only=True
    )

    class Meta:
        model = NoteLink
        fields = [
            "id",
            "source_note",
            "source_note_title",
            "target_note",
            "target_note_title",
            "link_type",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PresignedURLSerializer(serializers.Serializer):
    """Serializer for generating S3 presigned upload URLs."""

    filename = serializers.CharField(max_length=255)
    file_type = serializers.CharField(max_length=50)

    def validate_file_type(self, value):
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if value not in allowed_types:
            raise serializers.ValidationError(f"File type {value} is not allowed.")
        return value
