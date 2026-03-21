from rest_framework import serializers
from apps.notes.models import Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    """Serializer for Workspace model."""
    children_count = serializers.SerializerMethodField()
    notes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Workspace
        fields = ['id', 'name', 'description', 'parent_workspace',
                  'children_count', 'notes_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_children_count(self, obj):
        return obj.children.count()
    
    def get_notes_count(self, obj):
        return obj.notes.filter(is_deleted=False).count()


class WorkspaceTreeSerializer(serializers.ModelSerializer):
    """Serializer for nested workspace hierarchy."""
    children = serializers.SerializerMethodField()
    notes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Workspace
        fields = ['id', 'name', 'description', 'children', 'notes_count']
    
    def get_children(self, obj):
        children = obj.children.all()
        return WorkspaceTreeSerializer(children, many=True).data
    
    def get_notes_count(self, obj):
        return obj.notes.filter(is_deleted=False).count()
