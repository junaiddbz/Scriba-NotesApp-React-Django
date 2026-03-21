import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFolder, FiFileText, FiPlus } from 'react-icons/fi';
import { format } from 'date-fns';
import Header from '../components/Header';
import { useWorkspacesStore } from '../stores/workspacesStore';
import { useNotesStore } from '../stores/notesStore';

const WorkspaceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    currentWorkspace,
    isLoading,
    error,
    fetchWorkspaceById,
    setCurrentWorkspace,
  } = useWorkspacesStore();

  const { notes, fetchNotes, isLoading: isNotesLoading } = useNotesStore();

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

  const workspaceName = currentWorkspace?.name || 'Workspace';
  const workspaceDesc = currentWorkspace?.description || 'No description provided.';
  const workspaceId = Number(id);
  const notesInWorkspace = (Array.isArray(notes) ? notes : []).filter((note) => {
    const noteWorkspaceId = note.workspace?.id ?? note.workspace_id ?? note.workspace;
    return Number(noteWorkspaceId) === workspaceId;
  });
  const workspaceColor = currentWorkspace?.color || '#E67E22';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/workspaces')}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <FiArrowLeft size={18} /> Back to Workspaces
        </button>

        {/* Workspace Header */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: `linear-gradient(145deg, ${workspaceColor} -20%, #1f2937 50%)`,
            borderColor: workspaceColor,
            borderWidth: '1px',
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FiFolder className="text-white/80" size={24} />
                <h1 className="text-3xl font-bold text-white">{workspaceName}</h1>
              </div>
              <p className="text-white/70 text-sm max-w-2xl">{workspaceDesc}</p>
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
                <div
                  key={note.id}
                  className="p-5 bg-gray-800 rounded-lg border border-gray-700 hover:border-orange-500/60 cursor-pointer transition-all hover:bg-gray-700/50"
                  onClick={() => navigate(`/note/${note.id}`)}
                >
                  <h3 className="text-lg font-semibold text-white truncate mb-1">{note.title || 'Untitled Note'}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 h-10">{note.body || 'No content'}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Updated {format(new Date(note.updated_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-red-400 mt-4 text-sm bg-red-900/20 border border-red-500/30 p-3 rounded-lg">{error}</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkspaceDetailPage;
