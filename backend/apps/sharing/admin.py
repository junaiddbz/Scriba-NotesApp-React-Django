from django.contrib import admin

from apps.sharing.models import (
    CollaborativeEdit,
    NoteShare,
    UserOAuthProvider,
    WorkspaceShare,
)


@admin.register(NoteShare)
class NoteShareAdmin(admin.ModelAdmin):
    list_display = [
        "note",
        "shared_by",
        "shared_with",
        "permission_level",
        "is_active",
        "is_expired",
        "created_at",
    ]
    list_filter = ["permission_level", "is_active", "created_at"]
    search_fields = ["note__title", "shared_with__username", "shared_by__username"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        (
            "Share Information",
            {"fields": ("note", "shared_by", "shared_with", "permission_level")},
        ),
        ("Status", {"fields": ("is_active", "expires_at")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(WorkspaceShare)
class WorkspaceShareAdmin(admin.ModelAdmin):
    list_display = [
        "workspace",
        "shared_by",
        "shared_with",
        "permission_level",
        "is_active",
        "is_expired",
        "created_at",
    ]
    list_filter = ["permission_level", "is_active", "created_at"]
    search_fields = ["workspace__name", "shared_with__username", "shared_by__username"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        (
            "Share Information",
            {"fields": ("workspace", "shared_by", "shared_with", "permission_level")},
        ),
        ("Status", {"fields": ("is_active", "expires_at")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(CollaborativeEdit)
class CollaborativeEditAdmin(admin.ModelAdmin):
    list_display = [
        "note",
        "editor",
        "operation_type",
        "conflict_resolved",
        "created_at",
    ]
    list_filter = ["operation_type", "conflict_resolved", "created_at"]
    search_fields = ["note__title", "editor__username"]
    readonly_fields = ["created_at", "content_before", "content_after"]
    fieldsets = (
        (
            "Edit Information",
            {"fields": ("note", "editor", "operation_type", "position")},
        ),
        (
            "Content",
            {"fields": ("content_before", "content_after"), "classes": ("collapse",)},
        ),
        ("Status", {"fields": ("conflict_resolved",)}),
        ("Timestamp", {"fields": ("created_at",), "classes": ("collapse",)}),
    )


@admin.register(UserOAuthProvider)
class UserOAuthProviderAdmin(admin.ModelAdmin):
    list_display = ["user", "provider", "provider_email", "connected_at", "last_login"]
    list_filter = ["provider", "connected_at"]
    search_fields = ["user__username", "provider_email"]
    readonly_fields = ["connected_at", "last_login", "access_token", "refresh_token"]
    fieldsets = (
        ("User & Provider", {"fields": ("user", "provider")}),
        ("OAuth Information", {"fields": ("provider_user_id", "provider_email")}),
        (
            "Tokens",
            {
                "fields": ("access_token", "refresh_token", "token_expires_at"),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {"fields": ("connected_at", "last_login"), "classes": ("collapse",)},
        ),
    )
