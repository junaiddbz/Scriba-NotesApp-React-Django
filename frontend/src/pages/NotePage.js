import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiTrash2,
  FiShare2,
  FiSave,
  FiClock,
  FiUsers,
  FiDownload,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import { useNotesStore } from '../stores/notesStore';
import { useSharingStore } from '../stores/sharingStore';
import { formatDistanceToNow } from 'date-fns';

const NotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { currentNote, fetchNoteById, createNote, updateNote, deleteNote, isLoading } =
    useNotesStore();
  const { shareNote } = useSharingStore();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch note if not creating new
  useEffect(() => {
    if (id !== 'new') {
      fetchNoteById(id);
    }
  }, [id, fetchNoteById]);

  // Update local state when note is fetched
  useEffect(() => {
    if (currentNote && id !== 'new') {
      setTitle(currentNote.title || '');
      setContent(currentNote.body || '');
      setHasChanges(false);
    }
  }, [currentNote, id]);

  const handleContentChange = (value) => {
    setContent(value);
    setHasChanges(true);
  };

  const handleTitleChange = (value) => {
    setTitle(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);

    try {
      const noteData = { 
        body: content.trim() || '',
        title: title.trim() || 'Untitled Note'
      };

      if (id === 'new') {
        const newNote = await createNote(noteData);
        navigate(`/note/${newNote.id}`);
      } else {
        await updateNote(id, noteData);
      }

      setHasChanges(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(id);
      navigate('/notes');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete note.');
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Discard them?')) {
        navigate('/notes');
      }
    } else {
      navigate('/notes');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.05),transparent_32%),#0f172a] text-white">
      <Header currentView="note" />

      {/* Editor */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 sticky top-20 z-30 backdrop-blur-md bg-white/5 border border-white/10 shadow-2xl rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Back to notes"
              aria-label="Back to notes"
            >
              <FiArrowLeft size={20} />
            </button>

            <div className="flex-1">
              {currentNote && currentNote.updated_at && (
                <p className="text-xs text-white/60">
                  Last updated {formatDistanceToNow(new Date(currentNote.updated_at), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:from-orange-400 disabled:to-orange-400 text-white rounded-full transition-colors shadow-lg"
              >
                <FiSave size={18} /> {isSaving ? 'Saving...' : 'Save'}
              </button>
            )}

            {id !== 'new' && (
              <>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white"
                  title="Share note"
                  aria-label="Share note"
                >
                  <FiShare2 size={20} />
                </button>

                <button
                  onClick={handleDelete}
                  className="p-2 rounded-full bg-red-500/10 border border-red-400/30 hover:bg-red-500/20 text-red-200 transition-colors"
                  title="Delete note"
                  aria-label="Delete note"
                >
                  <FiTrash2 size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {isLoading && id !== 'new' ? (
          <div className="text-center py-16">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>Loading note...</p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            {/* Title Display/Edit */}
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Note title (optional)"
              className="w-full px-6 py-4 text-2xl font-bold border-b border-white/10 bg-transparent text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:ring-inset"
            />

            {/* Content Editor */}
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start typing..."
              className="w-full min-h-[22rem] px-6 py-4 bg-transparent text-white placeholder-white/50 border-none focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal
            noteId={id}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </div>
    </div>
  );
};

// Share Modal Component
const ShareModal = ({ noteId, onClose }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('VIEWER');
  const [isSharing, setIsSharing] = useState(false);
  const { shareNote } = useSharingStore();

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSharing(true);
    try {
      await shareNote(noteId, {
        shared_with_email: email,
        permission_level: permission,
      });

      setEmail('');
      setPermission('VIEWER');
      toast.success('Note shared successfully!');
    } catch (error) {
      toast.error('Failed to share note');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center px-4">
      <div className="bg-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6">
          Share Note
        </h2>

        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-orange-400/60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Permission Level
            </label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-orange-400/60"
            >
              <option value="VIEWER" className="bg-slate-900 text-white">Viewer (Read Only)</option>
              <option value="EDITOR" className="bg-slate-900 text-white">Editor (Can Edit)</option>
              <option value="ADMIN" className="bg-slate-900 text-white">Admin (Full Control)</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSharing}
              className="flex-1 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:from-orange-400 disabled:to-orange-400 text-white transition-colors shadow-lg"
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotePage;