import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("notes_app")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Celery Beat Schedule for periodic tasks
app.conf.beat_schedule = {
    # Cleanup expired trash entries daily at 2 AM
    "cleanup-expired-trash": {
        "task": "config.tasks.cleanup_expired_trash",
        "schedule": crontab(hour=2, minute=0),
    },
    # Cleanup expired password reset tokens daily at 3 AM
    "cleanup-expired-reset-tokens": {
        "task": "config.tasks.cleanup_expired_password_reset_tokens",
        "schedule": crontab(hour=3, minute=0),
    },
}


@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery."""
    print(f"Request: {self.request!r}")
