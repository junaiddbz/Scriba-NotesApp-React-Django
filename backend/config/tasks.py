import logging

from apps.auth.models import CustomUser, PasswordResetToken
from apps.notes.models import Note, NoteVersion
from apps.trash.models import TrashBin
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def send_password_reset_email(user_id, reset_token):
    """
    Send password reset email to user.

    Args:
        user_id: CustomUser id
        reset_token: Plain reset token (before hashing)
    """
    try:
        user = CustomUser.objects.get(id=user_id)

        # Build reset link (adjust FRONTEND_URL as needed)
        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"

        # Prepare email context
        context = {
            "user_name": user.get_full_name(),
            "reset_link": reset_link,
            "expiry_minutes": 15,
        }

        # Render email template
        subject = "Reset Your Password - Scriba"
        html_message = render_to_string("emails/password_reset.html", context)
        plain_message = f"""
        Hi {user.get_full_name()},

        Click here to reset your password: {reset_link}

        This link expires in 15 minutes.

        If you didn't request this, ignore this email.

        Best regards,
        Elite Notes Team
        """

        # Send email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Password reset email sent to {user.email}")
        return {"status": "success", "email": user.email}

    except CustomUser.DoesNotExist:
        logger.error(f"User {user_id} not found for password reset email")
        return {"status": "error", "reason": "user_not_found"}
    except Exception as e:
        logger.error(f"Error sending password reset email: {e!s}")
        return {"status": "error", "reason": str(e)}


@shared_task
def send_email_verification(user_id, verification_link):
    """
    Send email verification link to user.

    Args:
        user_id: CustomUser id
        verification_link: Verification link
    """
    try:
        user = CustomUser.objects.get(id=user_id)

        context = {
            "user_name": user.get_full_name(),
            "verification_link": verification_link,
        }

        subject = "Verify Your Email - Scriba"
        html_message = render_to_string("emails/email_verification.html", context)
        plain_message = f"""
        Hi {user.get_full_name()},

        Click here to verify your email: {verification_link}

        Best regards,
        Elite Notes Team
        """

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Verification email sent to {user.email}")
        return {"status": "success", "email": user.email}

    except Exception as e:
        logger.error(f"Error sending verification email: {e!s}")
        return {"status": "error", "reason": str(e)}


@shared_task
def create_note_version_snapshot(note_id, change_description=""):
    """
    Create a version snapshot of a note (triggered on autosave).

    Args:
        note_id: Note id
        change_description: Optional description of changes
    """
    try:
        note = Note.objects.get(id=note_id)

        # Get next version number
        last_version = note.versions.order_by("-version_number").first()
        next_version_number = (last_version.version_number + 1) if last_version else 1

        # Create version snapshot
        NoteVersion.objects.create(
            note=note,
            content_snapshot=note.body,
            editor=note.last_edited_by,
            change_description=change_description or "Autosaved",
            version_number=next_version_number,
        )

        logger.info(f"Version {next_version_number} created for note {note.id}")
        return {"status": "success", "version": next_version_number}

    except Note.DoesNotExist:
        logger.error(f"Note {note_id} not found for version creation")
        return {"status": "error", "reason": "note_not_found"}
    except Exception as e:
        logger.error(f"Error creating note version: {e!s}")
        return {"status": "error", "reason": str(e)}


@shared_task
def cleanup_expired_trash():
    """
    Delete expired trash entries (30 days after deletion).
    This runs daily via Celery Beat.
    """
    try:
        now = timezone.now()
        expired_trash = TrashBin.objects.filter(expires_at__lt=now)
        count = expired_trash.count()

        if count > 0:
            # Delete attachments from S3 first (if implemented)
            for trash_entry in expired_trash:
                for attachment in trash_entry.note.attachments.all():
                    # TODO: Delete from S3
                    pass

            # Delete notes
            note_ids = [t.note_id for t in expired_trash]
            Note.objects.filter(id__in=note_ids).delete()

            # Delete trash entries
            expired_trash.delete()

            logger.info(f"Deleted {count} expired trash entries")

        return {"status": "success", "deleted": count}

    except Exception as e:
        logger.error(f"Error cleaning up trash: {e!s}")
        return {"status": "error", "reason": str(e)}


@shared_task
def cleanup_expired_password_reset_tokens():
    """
    Delete expired password reset tokens.
    This runs daily via Celery Beat.
    """
    try:
        now = timezone.now()
        expired_tokens = PasswordResetToken.objects.filter(expires_at__lt=now)
        count = expired_tokens.count()

        if count > 0:
            expired_tokens.delete()
            logger.info(f"Deleted {count} expired password reset tokens")

        return {"status": "success", "deleted": count}

    except Exception as e:
        logger.error(f"Error cleaning up password reset tokens: {e!s}")
        return {"status": "error", "reason": str(e)}
