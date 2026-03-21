from rest_framework import serializers
from apps.sharing.models import NoteShare, WorkspaceShare, PermissionChoices, UserOAuthProvider
from apps.auth.models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """Minimal user serializer for sharing info."""
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class NoteShareSerializer(serializers.ModelSerializer):
    """Serializer for sharing notes with other users."""
    shared_with = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all()
    )
    shared_with_data = UserSerializer(
        source='shared_with',
        read_only=True
    )
    shared_by_data = UserSerializer(
        source='shared_by',
        read_only=True
    )
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = NoteShare
        fields = [
            'id',
            'note',
            'shared_by',
            'shared_by_data',
            'shared_with',
            'shared_with_data',
            'permission_level',
            'created_at',
            'updated_at',
            'expires_at',
            'is_active',
            'is_expired'
        ]
        read_only_fields = ['id', 'shared_by', 'created_at', 'updated_at', 'is_expired']

    def get_is_expired(self, obj):
        return obj.is_expired

    def validate_shared_with(self, value):
        """Prevent user from sharing with themselves."""
        request = self.context.get('request')
        if request and value == request.user:
            raise serializers.ValidationError('Cannot share note with yourself.')
        return value


class NoteShareListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing note shares."""
    shared_with = UserSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = NoteShare
        fields = [
            'id',
            'shared_with',
            'permission_level',
            'created_at',
            'expires_at',
            'is_active',
            'is_expired'
        ]

    def get_is_expired(self, obj):
        return obj.is_expired


class WorkspaceShareSerializer(serializers.ModelSerializer):
    """Serializer for sharing workspaces with other users."""
    shared_with = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all()
    )
    shared_with_data = UserSerializer(
        source='shared_with',
        read_only=True
    )
    shared_by_data = UserSerializer(
        source='shared_by',
        read_only=True
    )
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceShare
        fields = [
            'id',
            'workspace',
            'shared_by',
            'shared_by_data',
            'shared_with',
            'shared_with_data',
            'permission_level',
            'created_at',
            'updated_at',
            'expires_at',
            'is_active',
            'is_expired'
        ]
        read_only_fields = ['id', 'shared_by', 'created_at', 'updated_at', 'is_expired']

    def get_is_expired(self, obj):
        return obj.is_expired

    def validate_shared_with(self, value):
        """Prevent user from sharing with themselves."""
        request = self.context.get('request')
        if request and value == request.user:
            raise serializers.ValidationError('Cannot share workspace with yourself.')
        return value


class WorkspaceShareListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing workspace shares."""
    shared_with = UserSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceShare
        fields = [
            'id',
            'shared_with',
            'permission_level',
            'created_at',
            'expires_at',
            'is_active',
            'is_expired'
        ]

    def get_is_expired(self, obj):
        return obj.is_expired


class UserOAuthProviderSerializer(serializers.ModelSerializer):
    """Serializer for OAuth provider connections."""
    class Meta:
        model = UserOAuthProvider
        fields = [
            'id',
            'provider',
            'provider_email',
            'connected_at',
            'last_login'
        ]
        read_only_fields = [
            'id',
            'provider',
            'provider_email',
            'connected_at',
            'last_login'
        ]
