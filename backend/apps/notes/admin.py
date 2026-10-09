from django.contrib import admin
from .models import Note, Workspace, NoteVersion, MediaAttachment, NoteLink


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    """Admin interface for Workspace."""

    list_display = ["name", "user", "parent_workspace", "created_at"]
    list_filter = ["created_at", "user"]
    search_fields = ["name", "user__email"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    """Admin interface for Note."""

    list_display = ["title", "user", "workspace", "is_deleted", "updated_at"]
    list_filter = ["is_deleted", "created_at", "updated_at", "workspace"]
    search_fields = ["title", "content", "user__email"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Note Content", {"fields": ("title", "content", "tags")}),
        ("Organization", {"fields": ("user", "workspace")}),
        ("Status", {"fields": ("is_deleted", "last_edited_by")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(NoteVersion)
class NoteVersionAdmin(admin.ModelAdmin):
    """Admin interface for NoteVersion."""

    list_display = ["note", "version_number", "editor", "created_at"]
    list_filter = ["created_at", "note"]
    search_fields = ["note__title", "editor__email"]
    readonly_fields = ["created_at"]


@admin.register(MediaAttachment)
class MediaAttachmentAdmin(admin.ModelAdmin):
    """Admin interface for MediaAttachment."""

    list_display = [
        "original_filename",
        "note",
        "file_type",
        "file_size",
        "uploaded_at",
    ]
    list_filter = ["file_type", "uploaded_at"]
    search_fields = ["original_filename", "note__title"]
    readonly_fields = ["uploaded_at"]


@admin.register(NoteLink)
class NoteLinkAdmin(admin.ModelAdmin):
    """Admin interface for NoteLink."""

    list_display = ["source_note", "target_note", "link_type", "created_at"]
    list_filter = ["link_type", "created_at"]
    search_fields = ["source_note__title", "target_note__title"]
    readonly_fields = ["created_at"]
