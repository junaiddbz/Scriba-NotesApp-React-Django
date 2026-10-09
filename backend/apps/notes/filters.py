import django_filters
from django.db.models import Q
from .models import Note


class NoteFilter(django_filters.FilterSet):
    """
    FilterSet for Note model.
    Supports filtering by workspace and tags.
    Note: For search functionality, use DRF's SearchFilter instead.
    """
    workspace = django_filters.NumberFilter(field_name='workspace_id')
    workspace__isnull = django_filters.BooleanFilter(field_name='workspace_id', lookup_expr='isnull')
    tags = django_filters.CharFilter(method='filter_tags')
    
    class Meta:
        model = Note
        fields = ['workspace', 'workspace__isnull']
    
    def filter_tags(self, queryset, name, value):
        """Filter by tags (comma-separated)."""
        if not value:
            return queryset
        
        tags = value.split(',')
        # Filter notes that have any of the tags
        for tag in tags:
            queryset = queryset.filter(tags__contains=[tag.strip()])
        return queryset
