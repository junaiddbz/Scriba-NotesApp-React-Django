import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiTrash2,
  FiShare2,
  FiSave,
  FiClock,
  FiUsers,
  FiUser,
  FiDownload,
  FiInfo,
  FiFolder
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import { useNotesStore } from '../stores/notesStore';
import { formatDistanceToNow } from 'date-fns';
import ShareModal from '../components/ShareModal';
import { useSharingStore } from '../stores/sharingStore';
import { useAuthStore } from '../stores/authStore';

const NotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserEmail = useAuthStore(state => state.user?.email);

  const { currentNote, fetchNoteById, createNote, updateNote, deleteNote, isLoading } =
    useNotesStore();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(id !== 'new');
  
  // Info Panel State
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [versions, setVersions] = useState([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Fetch note if not creating new
  useEffect(() => {
    if (id !== 'new') {
      setIsInitialLoading(true);
      fetchNoteById(id).finally(() => setIsInitialLoading(false));
    } else {
      setIsInitialLoading(false);
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

  // Autosave effect
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(async () => {
      // Don't save if it's a new note and it's completely empty
      if (id === 'new' && !content.trim() && !title.trim()) {
        return;
      }

      setIsSaving(true);
      try {
        const noteData = { 
          body: content.trim() || '',
          title: title.trim() || (content.trim() ? 'Untitled Note' : '')
        };

        if (id === 'new' && location.state?.workspaceId) {
          noteData.workspace_id = parseInt(location.state.workspaceId, 10);
        }

        if (id === 'new') {
          const newNote = await createNote(noteData);
          setHasChanges(false);
          navigate(`/note/${newNote.id}`, { replace: true, state: location.state });
        } else {
          // Fallback title for existing notes
          noteData.title = noteData.title || 'Untitled Note';
          await updateNote(id, noteData);
          setHasChanges(false);
        }
      } catch (error) {
        console.error('Autosave error:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [content, title, hasChanges, id, location.state, createNote, updateNote, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(id);
      const destination = location.state?.workspaceId ? `/workspace/${location.state.workspaceId}` : '/notes';
      navigate(destination);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete note.');
    }
  };

  const handleBack = async () => {
    let destination = '/notes';
    if (currentNote?.workspace_id) {
      destination = `/workspace/${currentNote.workspace_id}`;
    } else if (location.state?.workspaceId) {
      destination = `/workspace/${location.state.workspaceId}`;
    } else if (location.state?.fromShared) {
      destination = '/shared';
    }
    
    // If it's a new note and it's empty, don't save it on exit
    if (id === 'new' && !content.trim() && !title.trim()) {
      navigate(destination);
      return;
    }

    if (hasChanges) {
      try {
        const noteData = { 
          body: content.trim() || '',
          title: title.trim() || 'Untitled Note'
        };
        if (id === 'new' && location.state?.workspaceId) {
          noteData.workspace_id = parseInt(location.state.workspaceId, 10);
        }
        if (id === 'new') {
          await createNote(noteData);
        } else {
          await updateNote(id, noteData);
        }
      } catch (e) {
        console.error('Save on exit error:', e);
      }
    }
    navigate(destination);
  };

  const getPermissionBadgeColor = (permission) => {
    switch (permission?.toLowerCase()) {
      case 'viewer': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'editor': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const toggleInfoPanel = async () => {
    const newState = !showInfoPanel;
    setShowInfoPanel(newState);
    if (newState && id !== 'new') {
      setIsLoadingVersions(true);
      try {
        const data = await useNotesStore.getState().getVersions(id);
        setVersions(data);
      } catch (e) {
        console.error('Failed to load versions', e);
      } finally {
        setIsLoadingVersions(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.05),transparent_32%),#0f172a] text-white">
      <Header currentView={location.state?.fromShared ? 'shared' : (currentNote?.workspace_id || location.state?.workspaceId) ? 'workspaces' : 'note'} />

      {/* Editor */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 sticky top-20 z-30 backdrop-blur-md bg-white/5 border border-white/10 shadow-2xl rounded-2xl p-4 transition-all">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Back to notes"
              aria-label="Back to notes"
            >
              <FiArrowLeft size={20} />
            </button>

            <div className="flex-1 flex items-center gap-3">
              {currentNote && currentNote.user_permission && currentNote.user_permission !== 'owner' && (
                <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full border ${getPermissionBadgeColor(currentNote.user_permission)}`}>
                  {currentNote.user_permission}
                </span>
              )}
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
            <div className="text-sm text-white/50 mr-2 flex items-center gap-2">
              {isSaving ? (
                <><div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div> Saving...</>
              ) : hasChanges ? (
                'Unsaved changes'
              ) : (
                <><FiSave size={14} /> Saved</>
              )}
            </div>

            {id !== 'new' && (
              <>
                <button
                  onClick={toggleInfoPanel}
                  className={`p-2 rounded-full border transition-colors text-white ${showInfoPanel ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  title="Note Details & History"
                  aria-label="Note Details & History"
                >
                  <FiInfo size={20} />
                </button>

                {!currentNote?.workspace_id && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    disabled={currentNote?.user_permission !== 'owner' && currentNote?.user_permission !== 'admin'}
                    className={`p-2 rounded-full border transition-colors ${
                      (currentNote?.user_permission === 'owner' || currentNote?.user_permission === 'admin')
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                        : 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                    }`}
                    title={(currentNote?.user_permission === 'owner' || currentNote?.user_permission === 'admin') ? "Share note" : "Only the creator or admins can share this note"}
                    aria-label="Share note"
                  >
                    <FiShare2 size={20} />
                  </button>
                )}

                {currentNote?.user_permission === 'owner' && (
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-full bg-red-500/10 border border-red-400/30 hover:bg-red-500/20 text-red-200 transition-colors"
                    title="Delete note"
                    aria-label="Delete note"
                  >
                    <FiTrash2 size={20} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {isInitialLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>Loading note...</p>
          </div>
        ) : (
          <>
            <div className="bg-white/5 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
              {/* Title Display/Edit */}
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={currentNote?.user_permission === 'viewer' ? "Read-only note" : "Note title (optional)"}
                readOnly={currentNote?.user_permission === 'viewer'}
                className="w-full px-6 py-4 text-2xl font-bold border-b border-white/10 bg-transparent text-white placeholder-white/50 focus:outline-none focus:ring-0 focus:border-white/10"
              />

              {/* Content Editor */}
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={currentNote?.user_permission === 'viewer' ? "This note is read-only." : "Start typing..."}
                readOnly={currentNote?.user_permission === 'viewer'}
                className="w-full min-h-[22rem] px-6 py-4 bg-transparent text-white placeholder-white/50 border-none focus:outline-none focus:ring-0 resize-none"
              />
            </div>

            {/* Info Panel */}
            {showInfoPanel && currentNote && (
              <div className="mt-6 p-6 bg-white/5 border border-white/10 shadow-2xl rounded-2xl backdrop-blur-md animate-fade-in">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FiInfo className="text-orange-400" /> Note Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Creator & Permissions */}
                  <div>
                    <h4 className="text-sm text-white/50 uppercase tracking-wider mb-3">Details & Access</h4>
                    <div className="space-y-3">
                      {currentNote.workspace_id && (
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate(`/workspace/${currentNote.workspace_id}`)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                              <FiFolder />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{currentNote.workspace_name || 'Unknown Workspace'}</p>
                              <p className="text-xs text-white/50">Workspace</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                            <FiUser />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{currentNote.owner_name || currentNote.owner_email.split('@')[0]}</p>
                            <p className="text-xs text-white/50">{currentNote.owner_email} • Owner</p>
                          </div>
                        </div>
                        <FaCrown className="text-orange-400" />
                      </div>
                      
                      {currentNote.active_shares?.map((share, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                              <FiUsers />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{share.name || share.email.split('@')[0]}</p>
                              <p className="text-xs text-white/50">{share.email} • <span className="capitalize">{share.permission}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(currentNote.user_permission === 'owner' || currentNote.user_permission === 'admin') ? (
                              <select
                                value={share.permission}
                                disabled={share.email === currentUserEmail}
                                onChange={async (e) => {
                                  try {
                                    await useSharingStore.getState().updatePermission(share.id, e.target.value);
                                    await fetchNoteById(id);
                                    toast.success('Permission updated');
                                  } catch (err) {
                                    toast.error('Failed to update permission');
                                  }
                                }}
                                className={`text-xs px-2 py-1 rounded-full border bg-slate-900 outline-none focus:ring-1 focus:ring-orange-500 ${share.email === currentUserEmail ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${getPermissionBadgeColor(share.permission)}`}
                              >
                                <option value="viewer" className="bg-slate-900">Viewer</option>
                                <option value="editor" className="bg-slate-900">Editor</option>
                                <option value="admin" className="bg-slate-900">Admin</option>
                              </select>
                            ) : (
                              <span className={`text-xs px-2 py-1 rounded-full border ${getPermissionBadgeColor(share.permission)}`}>
                                {share.permission}
                              </span>
                            )}

                            {(currentNote.user_permission === 'owner' || currentNote.user_permission === 'admin') && (
                              <button
                                disabled={share.email === currentUserEmail}
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to remove access for ${share.email}?`)) {
                                    try {
                                      await useSharingStore.getState().removeShare(share.id);
                                      await fetchNoteById(id);
                                      toast.success('Access removed');
                                    } catch (err) {
                                      toast.error('Failed to remove access');
                                    }
                                  }
                                }}
                                className={`p-1.5 rounded-lg transition-colors ml-1 ${share.email === currentUserEmail ? 'text-gray-600 opacity-50 cursor-not-allowed' : 'text-red-400 hover:bg-red-500/20'}`}
                                title={share.email === currentUserEmail ? "You cannot remove yourself" : "Remove access"}
                              >
                                <FiTrash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!currentNote.active_shares || currentNote.active_shares.length === 0) && !currentNote.workspace_id && (
                        <p className="text-sm text-white/50 italic px-2">This note is not shared with anyone else.</p>
                      )}
                      {currentNote.workspace_id && (
                        <p className="text-sm text-white/50 italic px-2">Access is managed at the workspace level.</p>
                      )}
                    </div>
                  </div>

                  {/* Version History */}
                  <div>
                    <h4 className="text-sm text-white/50 uppercase tracking-wider mb-3">Edit History</h4>
                    {isLoadingVersions ? (
                      <div className="flex items-center gap-2 text-white/50 py-4">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        Loading history...
                      </div>
                    ) : versions.length === 0 ? (
                      <p className="text-sm text-white/50 italic px-2">No edit history available yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {versions.map((ver, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="mt-1 text-white/40"><FiClock size={14} /></div>
                            <div>
                              <p className="text-sm font-medium">{ver.change_description || 'Note updated'}</p>
                              <p className="text-xs text-white/50">
                                By {ver.editor_email || 'Unknown'} • {formatDistanceToNow(new Date(ver.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
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

export default NotePage;