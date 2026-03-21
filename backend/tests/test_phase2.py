import pytest
from django.test import TestCase
from django.utils import timezone
from django.core.mail import outbox
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from celery.result import EagerResult
from datetime import timedelta

from apps.auth.models import CustomUser, PasswordResetToken
from apps.notes.models import Note, NoteVersion, MediaAttachment, Workspace
from config.tasks import (
    send_password_reset_email,
    send_email_verification,
    create_note_version_snapshot,
    cleanup_expired_trash,
    cleanup_expired_password_reset_tokens
)


@pytest.mark.django_db
class TestEmailTasks(TestCase):
    """Test Celery email tasks."""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
    
    @patch('config.tasks.send_mail')
    def test_send_password_reset_email(self, mock_send_mail):
        """Test password reset email task."""
        reset_token = 'test_token_12345'
        
        # Call the task
        result = send_password_reset_email.apply(
            args=[self.user.id, reset_token],
            throw=True
        )
        
        # Verify email was sent
        assert result.successful() or isinstance(result, EagerResult)
        mock_send_mail.assert_called_once()
        
        call_args = mock_send_mail.call_args
        assert 'Password Reset' in call_args[0][0]  # subject
        assert self.user.email in call_args[1]['recipient_list']
    
    @patch('config.tasks.send_mail')
    def test_send_email_verification(self, mock_send_mail):
        """Test email verification task."""
        
        # Call the task
        result = send_email_verification.apply(
            args=[self.user.id],
            throw=True
        )
        
        # Verify email was sent
        assert result.successful() or isinstance(result, EagerResult)
        mock_send_mail.assert_called_once()
        
        call_args = mock_send_mail.call_args
        assert 'Verify' in call_args[0][0]  # subject
        assert self.user.email in call_args[1]['recipient_list']


@pytest.mark.django_db
class TestPresignedURLEndpoint(TestCase):
    """Test S3 presigned URL endpoint."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.workspace = Workspace.objects.create(
            name='Test Workspace',
            owner=self.user
        )
        self.note = Note.objects.create(
            title='Test Note',
            content='Content',
            user=self.user
        )
        self.note.workspaces.add(self.workspace)
        
        self.client.force_authenticate(user=self.user)
    
    @patch('shared.s3_service.S3Service.generate_presigned_upload_url')
    def test_presigned_url_endpoint(self, mock_presigned):
        """Test GET presigned URL endpoint."""
        # Mock S3 response
        mock_presigned.return_value = {
            'url': 'https://s3.amazonaws.com/bucket/upload',
            's3_key': 'uploads/timestamp/image.png'
        }
        
        response = self.client.post(
            f'/api/v1/notes/{self.note.id}/presigned-url/',
            {
                'file_name': 'image.png',
                'file_type': 'image/png'
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'upload_url' in response.data
        assert 's3_key' in response.data
        assert response.data['max_file_size'] == 10 * 1024 * 1024
    
    def test_presigned_url_missing_params(self):
        """Test presigned URL endpoint with missing parameters."""
        response = self.client.post(
            f'/api/v1/notes/{self.note.id}/presigned-url/',
            {'file_name': 'image.png'},  # Missing file_type
            format='json'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'file_type' in str(response.data)
    
    def test_presigned_url_creates_attachment(self):
        """Test that presigned URL endpoint creates MediaAttachment."""
        with patch('shared.s3_service.S3Service.generate_presigned_upload_url') as mock_presigned:
            mock_presigned.return_value = {
                'url': 'https://s3.amazonaws.com/bucket/upload',
                's3_key': 'uploads/timestamp/image.png'
            }
            
            response = self.client.post(
                f'/api/v1/notes/{self.note.id}/presigned-url/',
                {
                    'file_name': 'image.png',
                    'file_type': 'image/png'
                },
                format='json'
            )
            
            assert response.status_code == status.HTTP_200_OK
            
            # Verify attachment was created
            attachment = MediaAttachment.objects.get(
                note=self.note,
                s3_key='uploads/timestamp/image.png'
            )
            assert attachment.uploader == self.user
            assert 'attachment_id' in response.data


@pytest.mark.django_db
class TestVersionSnapshots(TestCase):
    """Test automatic version snapshots on note updates."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.workspace = Workspace.objects.create(
            name='Test Workspace',
            owner=self.user
        )
        self.note = Note.objects.create(
            title='Test Note',
            content='Original content',
            user=self.user
        )
        self.note.workspaces.add(self.workspace)
        
        self.client.force_authenticate(user=self.user)
    
    @patch('config.tasks.create_note_version_snapshot.delay')
    def test_version_snapshot_triggered_on_update(self, mock_task):
        """Test that note updates trigger version snapshot task."""
        response = self.client.patch(
            f'/api/v1/notes/{self.note.id}/',
            {'content': 'Updated content'},
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify Celery task was called
        mock_task.assert_called_once()
        call_args = mock_task.call_args
        assert call_args[1]['note_id'] == self.note.id
        assert call_args[1]['editor_id'] == self.user.id
    
    @patch('config.tasks.create_note_version_snapshot.delay')
    def test_version_snapshot_task_creates_version(self, mock_delay):
        """Test that version snapshot task creates version record."""
        # Instead of mocking, directly call the task
        from config.tasks import create_note_version_snapshot
        
        # Update note
        self.note.content = 'Updated content'
        self.note.last_edited_by = self.user
        self.note.save()
        
        # Call the task directly (Celery ALWAYS_EAGER in tests)
        result = create_note_version_snapshot.apply(
            args=[self.note.id, self.user.id],
            throw=True
        )
        
        assert result.successful() or isinstance(result, EagerResult)
        
        # Verify version was created
        versions = self.note.versions.all()
        assert versions.count() > 0


@pytest.mark.django_db
class TestPasswordResetEmailIntegration(TestCase):
    """Test password reset email integration."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
    
    @patch('config.tasks.send_password_reset_email.delay')
    def test_forgot_password_triggers_email_task(self, mock_task):
        """Test that forgot password endpoint triggers email task."""
        response = self.client.post(
            '/api/v1/auth/forgot-password/',
            {'email': self.user.email},
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify Celery task was called
        mock_task.assert_called_once()
        call_args = mock_task.call_args
        assert call_args[0][0] == self.user.id  # user_id
        assert isinstance(call_args[0][1], str)  # reset_token
    
    def test_forgot_password_creates_reset_token(self):
        """Test that forgot password creates reset token record."""
        response = self.client.post(
            '/api/v1/auth/forgot-password/',
            {'email': self.user.email},
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify reset token was created
        reset_token = PasswordResetToken.objects.filter(user=self.user).first()
        assert reset_token is not None
        assert not reset_token.is_used
        assert reset_token.expires_at > timezone.now()


@pytest.mark.django_db
class TestEmailVerificationIntegration(TestCase):
    """Test email verification integration."""
    
    def setUp(self):
        self.client = APIClient()
    
    @patch('config.tasks.send_email_verification.delay')
    def test_register_triggers_email_verification(self, mock_task):
        """Test that registration triggers email verification task."""
        response = self.client.post(
            '/api/v1/auth/register/',
            {
                'email': 'newuser@example.com',
                'username': 'newuser',
                'password': 'securepass123',
                'password_confirm': 'securepass123'
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify Celery task was called
        mock_task.assert_called_once()
        call_args = mock_task.call_args
        # User ID should be passed as argument
        assert isinstance(call_args[0][0], int)


@pytest.mark.django_db
class TestCleanupTasks(TestCase):
    """Test cleanup Celery tasks."""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
    
    def test_cleanup_expired_password_reset_tokens(self):
        """Test cleanup of expired password reset tokens."""
        # Create expired token
        expired_token = PasswordResetToken.objects.create(
            user=self.user,
            token_hash='expired_hash',
            expires_at=timezone.now() - timedelta(days=1)
        )
        
        # Create valid token
        valid_token = PasswordResetToken.objects.create(
            user=self.user,
            token_hash='valid_hash',
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        # Run cleanup task
        result = cleanup_expired_password_reset_tokens.apply(throw=True)
        assert result.successful() or isinstance(result, EagerResult)
        
        # Verify expired token was deleted
        assert not PasswordResetToken.objects.filter(id=expired_token.id).exists()
        # Verify valid token still exists
        assert PasswordResetToken.objects.filter(id=valid_token.id).exists()
    
    def test_cleanup_expired_trash(self):
        """Test cleanup of expired trash items."""
        workspace = Workspace.objects.create(
            name='Test Workspace',
            owner=self.user
        )
        
        # Create old deleted note (30+ days ago)
        old_note = Note.objects.create(
            title='Old Note',
            content='Content',
            user=self.user,
            is_deleted=True,
            deleted_at=timezone.now() - timedelta(days=31)
        )
        old_note.workspaces.add(workspace)
        
        # Create recent deleted note (10 days ago)
        recent_note = Note.objects.create(
            title='Recent Note',
            content='Content',
            user=self.user,
            is_deleted=True,
            deleted_at=timezone.now() - timedelta(days=10)
        )
        recent_note.workspaces.add(workspace)
        
        # Run cleanup task
        result = cleanup_expired_trash.apply(throw=True)
        assert result.successful() or isinstance(result, EagerResult)
        
        # Verify old note was permanently deleted
        assert not Note.objects.filter(id=old_note.id).exists()
        # Verify recent note still exists
        assert Note.objects.filter(id=recent_note.id).exists()


@pytest.mark.django_db
class TestPhase2Integration(TestCase):
    """Integration tests for Phase 2 features."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.workspace = Workspace.objects.create(
            name='Test Workspace',
            owner=self.user
        )
        self.client.force_authenticate(user=self.user)
    
    @patch('shared.s3_service.S3Service.generate_presigned_upload_url')
    @patch('config.tasks.create_note_version_snapshot.delay')
    def test_full_workflow_with_attachments(self, mock_version_task, mock_presigned):
        """Test full workflow: create note, get presigned URL, update note."""
        # Step 1: Create note
        note_response = self.client.post(
            '/api/v1/notes/',
            {
                'title': 'Integration Test Note',
                'content': 'Initial content',
                'workspaces': [self.workspace.id]
            },
            format='json'
        )
        
        assert note_response.status_code == status.HTTP_201_CREATED
        note_id = note_response.data['id']
        
        # Step 2: Get presigned URL for attachment
        mock_presigned.return_value = {
            'url': 'https://s3.amazonaws.com/bucket/upload',
            's3_key': 'uploads/timestamp/document.pdf'
        }
        
        presigned_response = self.client.post(
            f'/api/v1/notes/{note_id}/presigned-url/',
            {
                'file_name': 'document.pdf',
                'file_type': 'application/pdf'
            },
            format='json'
        )
        
        assert presigned_response.status_code == status.HTTP_200_OK
        
        # Step 3: Update note (triggers version snapshot)
        update_response = self.client.patch(
            f'/api/v1/notes/{note_id}/',
            {'content': 'Updated content with attachment'},
            format='json'
        )
        
        assert update_response.status_code == status.HTTP_200_OK
        mock_version_task.assert_called_once()
