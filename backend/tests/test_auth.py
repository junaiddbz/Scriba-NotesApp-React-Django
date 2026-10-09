import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestAuthentication:
    """Test authentication endpoints."""

    def test_user_registration(self, api_client):
        """Test user registration."""
        data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "SecurePass123!",
            "password_confirm": "SecurePass123!",
        }
        response = api_client.post("/api/v1/auth/register/", data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["user"]["email"] == "newuser@example.com"
        assert User.objects.filter(email="newuser@example.com").exists()

    def test_registration_password_mismatch(self, api_client):
        """Test registration with mismatched passwords."""
        data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "SecurePass123!",
            "password_confirm": "DifferentPass123!",
        }
        response = api_client.post("/api/v1/auth/register/", data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_user_login(self, api_client, user):
        """Test user login."""
        data = {
            "username": "test@example.com",
            "password": "testpass123",
        }
        response = api_client.post("/api/v1/auth/token/", data)
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["email"] == "test@example.com"

    def test_login_invalid_credentials(self, api_client, user):
        """Test login with invalid credentials."""
        data = {
            "username": "test@example.com",
            "password": "wrongpassword",
        }
        response = api_client.post("/api/v1/auth/token/", data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user(self, authenticated_client, user):
        """Test getting current user profile."""
        response = authenticated_client.get("/api/v1/auth/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email

    def test_change_password(self, authenticated_client, user):
        """Test changing password."""
        data = {
            "old_password": "testpass123",
            "new_password": "NewPass123!",
            "new_password_confirm": "NewPass123!",
        }
        response = authenticated_client.post("/api/v1/auth/change-password/", data)
        assert response.status_code == status.HTTP_200_OK

        # Verify password was changed
        user.refresh_from_db()
        assert user.check_password("NewPass123!")
