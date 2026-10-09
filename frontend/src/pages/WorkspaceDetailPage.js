import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFolder, FiFileText, FiPlus, FiInfo, FiShare2, FiUsers, FiUser, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import ListItem from '../components/ListItem';
import ShareModal from '../components/ShareModal';
import { useWorkspacesStore } from '../stores/workspacesStore';
import { useNotesStore } from '../stores/notesStore';
import { useSharingStore } from '../stores/sharingStore';
import { useAuthStore } from '../stores/authStore';

const WorkspaceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserEmail = useAuthStore(state => state.user?.email);

  const {
    currentWorkspace,
    isLoading,
    error,
    fetchWorkspaceById,
    setCurrentWorkspace,
    updateWorkspace,
    deleteWorkspace
  } = useWorkspacesStore();

  const { notes, fetchNotes, isLoading: isNotesLoading, deleteNote, updateNote } = useNotesStore();
  const [sharingNoteId, setSharingNoteId] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleDeleteWorkspace = async () => {
    if (window.confirm(`Are you sure you want to delete this workspace and all its notes? This action cannot be undone.`)) {
      try {
        await deleteWorkspace(id);
        toast.success('Workspace deleted');
        navigate('/workspaces');
      } catch (e) {
        toast.error('Failed to delete workspace');
      }
    }
  };

  const handleDeleteNote = async (note) => {
    if (window.confirm(`Are you sure you want to delete "${note.title || 'this note'}"?`)) {
      try {
        await deleteNote(note.id);
      } catch (e) {}
    }
  };

  const handleShareNote = (note) => {
    setSharingNoteId(note.id);
  };

  const handleToggleFavorite = async (note) => {
    try {
      await updateNote(note.id, { is_favorite: !note.is_favorite });
    } catch (e) {
      console.error('Failed to toggle favorite', e);
    }
  };

  const { updateWorkspacePermission, removeWorkspaceShare } = useSharingStore();
  const [sharingWorkspaceId, setSharingWorkspaceId] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [activities, setActivities] = useState([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);

  const getPermissionBadgeColor = (permission) => {
    switch (permission?.toLowerCase()) {
      case 'viewer': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'editor': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const { fetchActivities } = useWorkspacesStore();

  useEffect(() => {
    if (showInfoPanel && id) {
      const loadActivities = async () => {
        setIsActivitiesLoading(true);
        try {
          const data = await fetchActivities(id);
          setActivities(data);
        } catch (e) {
          console.error('Failed to load activities', e);
        } finally {
          setIsActivitiesLoading(false);
        }
      };
      loadActivities();
    }
  }, [showInfoPanel, id, fetchActivities]);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchWorkspaceById(id);
        await fetchNotes({ workspace: id });
      } catch (err) {
        console.error('Failed to load workspace detail', err);
      }
    };
    load();

    return () => setCurrentWorkspace(null);
  }, [id, fetchWorkspaceById, fetchNotes, setCurrentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      setEditName(currentWorkspace.name || '');
      setEditDesc(currentWorkspace.description || '');
    }
  }, [currentWorkspace]);

  const handleEditSave = async () => {
    try {
      await updateWorkspace(id, { name: editName, description: editDesc });
      setIsEditing(false);
      toast.success('Workspace updated successfully');
    } catch (e) {
      toast.error('Failed to update workspace');
    }
  };

  const handleEditCancel = () => {
    setEditName(currentWorkspace?.name || '');
    setEditDesc(currentWorkspace?.description || '');
    setIsEditing(false);
  };

  const workspaceName = currentWorkspace?.name || 'Workspace';
  const workspaceDesc = currentWorkspace?.description || 'No description provided.';
  const workspaceId = Number(id);
  const notesInWorkspace = (Array.isArray(notes) ? notes : []).filter((note) => {
    const noteWorkspaceId = note.workspace?.id ?? note.workspace_id ?? note.workspace;
    return Number(noteWorkspaceId) === workspaceId;
  });
  const workspaceColor = currentWorkspace?.color || '#E67E22';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.05),transparent_32%),#0f172a] text-white">
      <Header currentView="workspaces" />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/workspaces')}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <FiArrowLeft size={18} /> Back to Workspaces
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${showInfoPanel ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
              title="Workspace Information & Members"
            >
              <FiUsers size={18} />
              <span className="text-sm font-medium">Members</span>
            </button>

            <button
              onClick={() => setSharingWorkspaceId(id)}
              disabled={currentWorkspace?.user_permission !== 'owner' && currentWorkspace?.user_permission !== 'admin'}
              className={`p-2 rounded-full border transition-colors ${
                (currentWorkspace?.user_permission === 'owner' || currentWorkspace?.user_permission === 'admin')
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                  : 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
              }`}
              title={(currentWorkspace?.user_permission === 'owner' || currentWorkspace?.user_permission === 'admin') ? "Share Workspace" : "Only the creator or admins can share this workspace"}
            >
              <FiShare2 size={20} />
            </button>
            
            {currentWorkspace?.user_permission === 'owner' && (
              <button
                onClick={handleDeleteWorkspace}
                className="p-2 rounded-full bg-red-500/10 border border-red-400/30 hover:bg-red-500/20 text-red-200 transition-colors ml-1"
                title="Delete Workspace"
              >
                <FiTrash2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Workspace Header */}
        <div
          className="rounded-xl p-6 mb-8 transition-all"
          style={{
            background: `linear-gradient(145deg, ${workspaceColor} -20%, #1f2937 50%)`,
            borderColor: workspaceColor,
            borderWidth: '1px',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-8">
              <div className="flex items-center gap-3 mb-2 w-full">
                <FiFolder className="text-white/80 shrink-0" size={24} />
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-3xl font-bold bg-white/10 border border-white/20 rounded px-3 py-1 outline-none focus:border-orange-500 w-full"
                    autoFocus
                    placeholder="Workspace name"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-white truncate">{workspaceName}</h1>
                )}
                
                {!isEditing && currentWorkspace?.user_permission && currentWorkspace.user_permission !== 'owner' && (
                  <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full border shrink-0 ${getPermissionBadgeColor(currentWorkspace.user_permission)}`}>
                    {currentWorkspace.user_permission}
                  </span>
                )}

                {!isEditing && (currentWorkspace?.user_permission === 'owner' || currentWorkspace?.user_permission === 'admin') && (
                  <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-colors shrink-0" title="Edit Workspace Details">
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="mt-3 animate-fade-in">
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="text-white text-sm bg-white/10 border border-white/20 rounded px-3 py-2 outline-none focus:border-orange-500 w-full resize-none min-h-[80px]"
                    placeholder="Workspace description (optional)"
                  />
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleEditSave} disabled={!editName.trim()} className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
                      <FiCheck size={16}/> Save Changes
                    </button>
                    <button onClick={handleEditCancel} className="px-4 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
                      <FiX size={16}/> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-white/70 text-sm max-w-2xl mt-1">{workspaceDesc}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">
                Created: {currentWorkspace ? format(new Date(currentWorkspace.created_at), 'MMM d, yyyy') : '...'}
              </p>
              <p className="text-sm text-white/60">
                Notes: {notesInWorkspace.length}
              </p>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        {showInfoPanel && currentWorkspace && (
          <div className="mb-8 p-6 bg-white/5 border border-white/10 shadow-2xl rounded-2xl backdrop-blur-md animate-fade-in">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiInfo className="text-orange-400" /> Workspace Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Creator & Permissions */}
              <div>
                <h4 className="text-sm text-white/50 uppercase tracking-wider mb-3">Access & Permissions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                        <FiUser />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{currentWorkspace.owner_name || currentWorkspace.owner_email.split('@')[0]}</p>
                        <p className="text-xs text-white/50">{currentWorkspace.owner_email} • Owner</p>
                      </div>
                    </div>
                    <FaCrown className="text-orange-400" />
                  </div>
                  
                  {currentWorkspace.active_shares?.map((share, idx) => (
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
                        {(currentWorkspace.user_permission === 'owner' || currentWorkspace.user_permission === 'admin') ? (
                          <select
                            value={share.permission}
                            disabled={share.email === currentUserEmail}
                            onChange={async (e) => {
                              try {
                                await updateWorkspacePermission(share.id, e.target.value);
                                await fetchWorkspaceById(id);
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

                        {(currentWorkspace.user_permission === 'owner' || currentWorkspace.user_permission === 'admin') && (
                          <button
                            disabled={share.email === currentUserEmail}
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to remove access for ${share.email}?`)) {
                                try {
                                  await removeWorkspaceShare(share.id);
                                  await fetchWorkspaceById(id);
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
                  {(!currentWorkspace.active_shares || currentWorkspace.active_shares.length === 0) && (
                    <p className="text-sm text-white/50 italic px-2">This workspace is not shared with anyone else.</p>
                  )}
                </div>
              </div>
              
              {/* Activity Log */}
              <div>
                <h4 className="text-sm text-white/50 uppercase tracking-wider mb-3">Activity Log</h4>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {isActivitiesLoading ? (
                    <div className="animate-pulse flex gap-3"><div className="w-8 h-8 bg-white/10 rounded-full"/><div className="flex-1 bg-white/10 h-8 rounded"/></div>
                  ) : activities.length > 0 ? (
                    activities.map((act) => (
                      <div key={act.id} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 text-xs font-bold">
                          {act.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium text-white/90">{act.user_name}</span>{' '}
                            <span className="text-white/70">{act.action_type.toLowerCase()}</span>
                            {act.details?.title && <span className="font-medium text-orange-200"> "{act.details.title}"</span>}
                            {act.details?.new && <span className="text-white/60 text-xs block mt-1">To: "{act.details.new}"</span>}
                          </p>
                          <p className="text-xs text-white/40 mt-1">
                            {format(new Date(act.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/50 italic px-2">No recent activity.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiFileText className="text-gray-400" size={18} />
              <h2 className="text-xl font-semibold">Notes</h2>
            </div>
            <button
              onClick={() => navigate('/note/new', { state: { workspaceId: id } })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <FiPlus size={16} /> New Note
            </button>
          </div>

          {(isLoading || isNotesLoading) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-gray-800 rounded-lg animate-pulse h-32" />
              ))}
            </div>
          )}

          {!isLoading && !isNotesLoading && notesInWorkspace.length === 0 && (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
              <FiFileText size={40} className="mx-auto text-gray-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-300">No notes yet</h3>
              <p className="text-sm text-gray-500">Create the first note in this workspace.</p>
            </div>
          )}

          {!isLoading && !isNotesLoading && notesInWorkspace.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notesInWorkspace.map((note) => (
                <ListItem 
                  key={note.id} 
                  note={note} 
                  onDelete={handleDeleteNote}
                  onShare={handleShareNote}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="text-red-400 mt-4 text-sm bg-red-900/20 border border-red-500/30 p-3 rounded-lg">{error}</div>
          )}
        </div>
      </main>

      {/* Share Modal for Note */}
      {sharingNoteId && (
        <ShareModal noteId={sharingNoteId} onClose={() => setSharingNoteId(null)} />
      )}

      {/* Share Modal for Workspace */}
      {sharingWorkspaceId && (
        <ShareModal workspaceId={sharingWorkspaceId} onClose={() => setSharingWorkspaceId(null)} />
      )}
    </div>
  );
};

export default WorkspaceDetailPage;
