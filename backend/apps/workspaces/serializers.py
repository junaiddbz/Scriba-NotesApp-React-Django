from apps.notes.models import Workspace
from rest_framework import serializers


class WorkspaceSerializer(serializers.ModelSerializer):
    """Serializer for Workspace model."""

    children_count = serializers.SerializerMethodField()
    notes_count = serializers.SerializerMethodField()
    owner_email = serializers.CharField(source="user.email", read_only=True)
    owner_name = serializers.SerializerMethodField()
    user_permission = serializers.SerializerMethodField()
    active_shares = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "description",
            "parent_workspace",
            "owner_email",
            "owner_name",
            "children_count",
            "notes_count",
            "user_permission",
            "active_shares",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_owner_name(self, obj):
        return obj.user.get_full_name()

    def get_children_count(self, obj):
        return obj.children.count()

    def get_notes_count(self, obj):
        return obj.notes.filter(is_deleted=False).count()

    def get_user_permission(self, obj):
        request = self.context.get("request")
        if not request or not request.user:
            return "viewer"

        if obj.user == request.user:
            return "owner"

        from apps.sharing.models import WorkspaceShare

        share = WorkspaceShare.objects.filter(
            workspace=obj, shared_with=request.user, is_active=True
        ).first()
        if share:
            return share.permission_level

        return "viewer"

    def get_active_shares(self, obj):
        # All members can see who has access, but only owner/admin can modify (handled in views/permissions)  # noqa: E501
        from apps.sharing.models import WorkspaceShare

        shares = WorkspaceShare.objects.filter(
            workspace=obj, is_active=True
        ).select_related("shared_with")
        return [
            {
                "id": share.id,
                "email": share.shared_with.email,
                "name": share.shared_with.get_full_name(),
                "permission": share.permission_level,
            }
            for share in shares
        ]


class WorkspaceTreeSerializer(serializers.ModelSerializer):
    """Serializer for nested workspace hierarchy."""

    children = serializers.SerializerMethodField()
    notes_count = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ["id", "name", "description", "children", "notes_count"]

    def get_children(self, obj):
        children = obj.children.all()
        return WorkspaceTreeSerializer(children, many=True).data

    def get_notes_count(self, obj):
        return obj.notes.filter(is_deleted=False).count()


class WorkspaceActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        from apps.notes.models import WorkspaceActivity

        model = WorkspaceActivity
        fields = ["id", "user_name", "action_type", "details", "created_at"]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email if obj.user else "System"
