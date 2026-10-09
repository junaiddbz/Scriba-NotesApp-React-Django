from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Includes email verification and OAuth integration.
    """

    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)
    profile_pic_url = models.URLField(blank=True, null=True)

    # OAuth Integration
    oauth_provider = models.CharField(
        max_length=50,
        choices=[("google", "Google"), ("github", "GitHub")],
        blank=True,
        null=True,
        help_text="OAuth provider if user logged in via social auth",
    )
    oauth_id = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["oauth_provider", "oauth_id"]),
        ]

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Return the user's full name."""
        return super().get_full_name() or self.email


class PasswordResetToken(models.Model):
    """
    One-time password reset tokens with 15-minute expiration.
    """

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="reset_tokens"
    )
    token_hash = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["token_hash"]),
            models.Index(fields=["user_id", "is_used"]),
        ]

    def __str__(self):
        return f"Reset token for {self.user.email}"

    def is_expired(self):
        """Check if token has expired."""
        from django.utils import timezone

        return timezone.now() > self.expires_at
