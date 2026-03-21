import pytest
from rest_framework import status
from apps.notes.models import Note, NoteVersion


class TestNoteCRUD:
    """Test note CRUD operations."""
    
    def test_create_note(self, authenticated_client, workspace):
        """Test creating a note."""
        data = {
            'title': 'Test Note',
            'content': '<p>Test content</p>',
            'workspace_id': workspace.id,
        }
        response = authenticated_client.post('/api/v1/notes/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Test Note'
        assert Note.objects.filter(title='Test Note').exists()
    
    def test_list_notes(self, authenticated_client, user, workspace):
        """Test listing notes."""
        # Create 3 test notes
        for i in range(3):
            Note.objects.create(
                user=user,
                workspace=workspace,
                title=f'Note {i}',
                content='Content'
            )
        
        response = authenticated_client.get('/api/v1/notes/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 3
    
    def test_get_note_detail(self, authenticated_client, user, workspace):
        """Test retrieving note detail."""
        note = Note.objects.create(
            user=user,
            workspace=workspace,
            title='Detail Test',
            content='Content'
        )
        
        response = authenticated_client.get(f'/api/v1/notes/{note.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Detail Test'
    
    def test_update_note(self, authenticated_client, user, workspace):
        """Test updating a note (autosave)."""
        note = Note.objects.create(
            user=user,
            workspace=workspace,
            title='Original',
            content='Original content'
        )
        
        data = {'content': '<p>Updated content</p>'}
        response = authenticated_client.patch(f'/api/v1/notes/{note.id}/', data)
        assert response.status_code == status.HTTP_200_OK
        
        note.refresh_from_db()
        assert note.content == '<p>Updated content</p>'
    
    def test_delete_note(self, authenticated_client, user, workspace):
        """Test deleting a note (soft delete)."""
        note = Note.objects.create(
            user=user,
            workspace=workspace,
            title='To Delete',
            content='Content'
        )
        
        response = authenticated_client.delete(f'/api/v1/notes/{note.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        note.refresh_from_db()
        assert note.is_deleted is True
    
    def test_restore_soft_deleted_note(self, authenticated_client, user, workspace):
        """Test restoring a soft-deleted note."""
        note = Note.objects.create(
            user=user,
            workspace=workspace,
            title='To Delete',
            content='Content',
            is_deleted=True
        )
        
        response = authenticated_client.post(f'/api/v1/notes/{note.id}/restore/')
        assert response.status_code == status.HTTP_200_OK
        
        note.refresh_from_db()
        assert note.is_deleted is False
    
    def test_cannot_view_other_users_notes(self, api_client, user):
        """Test that users cannot view other users' notes."""
        from django.contrib.auth import get_user_model
        from rest_framework_simplejwt.tokens import RefreshToken
        
        User = get_user_model()
        
        # Create another user
        other_user = User.objects.create_user(
            email='other@example.com',
            username='other',
            password='pass'
        )
        
        workspace = None
        for ws in user.workspaces.all():
            workspace = ws
            break
        
        if not workspace:
            workspace = user.workspaces.create(name='Test')
        
        note = Note.objects.create(
            user=user,
            workspace=workspace,
            title='Secret Note',
            content='Secret'
        )
        
        # Try to access as other user
        refresh = RefreshToken.for_user(other_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.get(f'/api/v1/notes/{note.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestNoteVersioning:
    """Test note versioning functionality."""
    
    def test_note_has_version_count(self, authenticated_client, user, workspace):
        """Test that notes track version count."""
        note = Note.objects.create(
            user=user,
            workspace=workspace,
            title='Version Test',
            content='v1'
        )
        
        # Create a version
        NoteVersion.objects.create(
            note=note,
            content_snapshot='v1',
            editor=user,
            version_number=1
        )
        
        response = authenticated_client.get(f'/api/v1/notes/{note.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['version_count'] == 1
