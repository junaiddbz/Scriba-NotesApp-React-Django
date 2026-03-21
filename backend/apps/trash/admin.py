from django.contrib import admin
from .models import TrashBin


@admin.register(TrashBin)
class TrashBinAdmin(admin.ModelAdmin):
    """Admin interface for TrashBin."""
    list_display = ['note', 'user', 'deleted_at', 'expires_at']
    list_filter = ['deleted_at', 'expires_at', 'user']
    search_fields = ['note__title', 'user__email']
    readonly_fields = ['deleted_at', 'expires_at']
