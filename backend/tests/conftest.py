import os  # noqa: E402

import django  # noqa: E402

# Configure Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import pytest  # noqa: E402
from apps.notes.models import Workspace  # noqa: E402
from django.contrib.auth import get_user_model  # noqa: E402
from rest_framework.test import APIClient  # noqa: E402

User = get_user_model()


@pytest.fixture
def api_client():
    """Fixture for API client."""
    return APIClient()


@pytest.fixture
def user(db):
    """Fixture for creating a test user."""
    return User.objects.create_user(
        email="test@example.com",
        username="testuser",
        password="testpass123",
        first_name="Test",
        last_name="User",
    )


@pytest.fixture
def authenticated_client(api_client, user):
    """Fixture for authenticated API client."""
    from rest_framework_simplejwt.tokens import RefreshToken  # noqa: E402

    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client


@pytest.fixture
def workspace(db, user):
    """Fixture for creating a test workspace."""
    return Workspace.objects.create(
        user=user, name="Test Workspace", description="A test workspace"
    )
