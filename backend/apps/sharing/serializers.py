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
    shared_with_email = serializers.EmailField(write_only=True, required=True)
    shared_with = serializers.PrimaryKeyRelatedField(read_only=True)
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
            'shared_with_email',
            'permission_level',
            'created_at',
            'updated_at',
            'expires_at',
            'is_active',
            'is_expired',
            'is_hidden'
        ]
        read_only_fields = ['id', 'shared_by', 'shared_with', 'created_at', 'updated_at', 'is_expired']

    def get_is_expired(self, obj):
        return obj.is_expired

    def validate(self, attrs):
        email = attrs.pop('shared_with_email', None)
        if email:
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError({'shared_with_email': 'User with this email not found.'})
                
            request = self.context.get('request')
            if request and user == request.user:
                raise serializers.ValidationError({'shared_with_email': 'Cannot share note with yourself.'})
                
            attrs['shared_with'] = user
            
        # Check if already shared
        note = attrs.get('note')
        if note and email:
            if NoteShare.objects.filter(note=note, shared_with=user, is_active=True).exists():
                raise serializers.ValidationError({'shared_with_email': 'This note is already shared with this user.'})
                
        return super().validate(attrs)


from apps.notes.models import Note

class NotePreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'body', 'updated_at']

class NoteShareListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing note shares."""
    shared_with = UserSerializer(read_only=True)
    shared_by = UserSerializer(read_only=True)
    note = NotePreviewSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = NoteShare
        fields = [
            'id',
            'note',
            'shared_by',
            'shared_with',
            'permission_level',
            'created_at',
            'expires_at',
            'is_active',
            'is_expired',
            'is_hidden'
        ]

    def get_is_expired(self, obj):
        return obj.is_expired


class WorkspaceShareSerializer(serializers.ModelSerializer):
    """Serializer for sharing workspaces with other users."""
    shared_with_email = serializers.EmailField(write_only=True, required=True)
    shared_with = serializers.PrimaryKeyRelatedField(read_only=True)
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
            'shared_with_email',
            'permission_level',
            'created_at',
            'updated_at',
            'expires_at',
            'is_active',
            'is_expired',
            'is_hidden'
        ]
        read_only_fields = ['id', 'shared_by', 'shared_with', 'created_at', 'updated_at', 'is_expired']

    def get_is_expired(self, obj):
        return obj.is_expired

    def validate(self, attrs):
        email = attrs.pop('shared_with_email', None)
        if email:
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError({'shared_with_email': 'User with this email not found.'})
                
            request = self.context.get('request')
            if request and user == request.user:
                raise serializers.ValidationError({'shared_with_email': 'Cannot share workspace with yourself.'})
                
            attrs['shared_with'] = user
            
        # Check if already shared
        workspace = attrs.get('workspace')
        if workspace and email:
            if WorkspaceShare.objects.filter(workspace=workspace, shared_with=user, is_active=True).exists():
                raise serializers.ValidationError({'shared_with_email': 'This workspace is already shared with this user.'})
                
        return super().validate(attrs)


class WorkspaceShareListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing workspace shares."""
    shared_with = UserSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceShare
        fields = [
            'id',
            'workspace',
            'shared_with',
            'permission_level',
            'created_at',
            'expires_at',
            'is_active',
            'is_expired',
            'is_hidden'
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
