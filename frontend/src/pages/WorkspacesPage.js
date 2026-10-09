import React, { useState, useEffect } from 'react';
import {
  FiFolderPlus,
  FiEdit3,
  FiTrash2,
  FiUsers,
  FiFileText,
  FiSearch,
  FiMoreVertical,
  FiFolder,
  FiSettings,
  FiPlus,
  FiX,
  FiCheck,
  FiShare2
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import Header from '../components/Header';
import { useWorkspacesStore } from '../stores/workspacesStore';
import { useAuthStore } from '../stores/authStore';

const WorkspacesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    workspaces,
    isLoading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace
  } = useWorkspacesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#f68657', // Orange default
    is_public: false
  });

  // Load workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Filter workspaces based on search
  const filteredWorkspaces = (Array.isArray(workspaces) ? workspaces : []).filter((workspace) =>
    workspace.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    try {
      await createWorkspace(formData);
      toast.success('Workspace created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', color: '#f68657', is_public: false });
    } catch (error) {
      console.error('Create workspace error:', error);
      toast.error('Failed to create workspace');
    }
  };

  const handleEditWorkspace = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    try {
      await updateWorkspace(selectedWorkspace.id, formData);
      toast.success('Workspace updated successfully');
      setShowEditModal(false);
      setSelectedWorkspace(null);
      setFormData({ name: '', description: '', color: '#f68657', is_public: false });
    } catch (error) {
      console.error('Update workspace error:', error);
      toast.error('Failed to update workspace');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspace) return;

    try {
      await deleteWorkspace(selectedWorkspace.id);
      toast.success('Workspace deleted successfully');
      setShowDeleteModal(false);
      setSelectedWorkspace(null);
    } catch (error) {
      console.error('Delete workspace error:', error);
      toast.error('Failed to delete workspace');
    }
  };

  const openEditModal = (workspace) => {
    setSelectedWorkspace(workspace);
    setFormData({
      name: workspace.name || '',
      description: workspace.description || '',
      color: workspace.color || '#f68657',
      is_public: workspace.is_public || false
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (workspace) => {
    setSelectedWorkspace(workspace);
    setShowDeleteModal(true);
  };

  const resetModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedWorkspace(null);
    setFormData({ name: '', description: '', color: '#f68657', is_public: false });
  };

  const colorOptions = [
    '#f68657', // Orange
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.05),transparent_32%),#0f172a] text-white">
      <Header currentView="workspaces" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-white/40 uppercase tracking-[0.2em] mb-1">Overview</p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Workspaces</h1>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs uppercase tracking-widest">
                Collections
              </span>
            </div>
            <p className="text-white/70 mt-2">
              {filteredWorkspaces.length} {filteredWorkspaces.length === 1 ? 'workspace' : 'workspaces'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-full border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-transparent transition-all"
              />
            </div>

            {/* Create Workspace Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-medium shadow-lg shadow-orange-500/20 transition-all"
            >
              <FiFolderPlus size={18} />
              New Workspace
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-2xl">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Workspaces Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">🔄</div>
              <p className="text-white/70">Loading workspaces...</p>
            </div>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
            </h3>
            <p className="text-white/70 mb-6">
              {searchQuery
                ? `No workspaces match "${searchQuery}"`
                : 'Create your first workspace to organize your notes'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-medium shadow-lg shadow-orange-500/20 transition-all"
              >
                Create First Workspace
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onEdit={() => openEditModal(workspace)}
                onDelete={() => openDeleteModal(workspace)}
                onClick={() => navigate(`/workspace/${workspace.id}`)}
              />
            ))}
          </div>
        )}

        {/* Create Workspace Modal */}
        {showCreateModal && (
          <WorkspaceModal
            title="Create New Workspace"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreateWorkspace}
            onCancel={resetModals}
            colorOptions={colorOptions}
            isLoading={isLoading}
          />
        )}

        {/* Edit Workspace Modal */}
        {showEditModal && (
          <WorkspaceModal
            title="Edit Workspace"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditWorkspace}
            onCancel={resetModals}
            colorOptions={colorOptions}
            isLoading={isLoading}
            isEdit
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white/5 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 border border-red-500/30">
              <div className="flex items-center gap-3 mb-4">
                <FiTrash2 className="text-red-400" size={24} />
                <h3 className="text-lg font-semibold text-white">Delete Workspace</h3>
              </div>

              <p className="text-white/70 mb-6">
                Are you sure you want to delete <strong className="text-white">{selectedWorkspace?.name}</strong>?
                This will permanently delete the workspace and all its notes. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-white/10 text-white/80 rounded-full hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWorkspace}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-70 text-white rounded-full transition-colors"
                >
                  {isLoading ? 'Deleting...' : 'Delete Workspace'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Workspace Card Component
const WorkspaceCard = ({ workspace, onEdit, onDelete, onClick }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleCardClick = (e) => {
    // Don't trigger card click if clicking on menu or menu items
    if (e.target.closest('.workspace-menu')) {
      return;
    }
    onClick();
  };

  return (
    <div
      className="flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-400/40 hover:bg-white/10 transition-all cursor-pointer group shadow-lg backdrop-blur-lg"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
            style={{ backgroundColor: workspace.color || '#f68657' }}
          >
            <FiFolder className="text-white" size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white truncate">{workspace.name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white/70">
                {workspace.is_public ? 'Public' : 'Private'}
              </p>
              {workspace.user_permission && workspace.user_permission !== 'owner' && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                  <FiShare2 size={10} /> Shared with you
                </span>
              )}
            </div>
          </div>
        </div>

        {workspace.user_permission && workspace.user_permission !== 'viewer' && (
          <div className="relative workspace-menu">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FiMoreVertical size={16} className="text-white/70" />
            </button>

            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 w-40 bg-slate-900/95 rounded-2xl shadow-2xl z-20 border border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                      setShowMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 flex items-center gap-2 ${workspace.user_permission === 'owner' ? 'rounded-t-2xl' : 'rounded-2xl'}`}
                  >
                    <FiEdit3 size={14} /> Edit
                  </button>
                  {workspace.user_permission === 'owner' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-white/10 flex items-center gap-2 rounded-b-2xl"
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {workspace.description && (
        <p className="text-white/70 text-sm mb-4 line-clamp-2">
          {workspace.description}
        </p>
      )}

      {/* Stats */}
      <div className="mt-auto pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-sm text-white/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <FiFileText size={14} />
            <span className="whitespace-nowrap">
              {workspace.notes_count || 0} {(workspace.notes_count || 0) === 1 ? 'note' : 'notes'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiUsers size={14} />
            <span className="whitespace-nowrap">
              {workspace.members_count || 1} {(workspace.members_count || 1) === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>
        <span className="whitespace-nowrap text-xs bg-white/5 px-2 py-1 rounded-md">
          {workspace.updated_at ? formatDistanceToNow(new Date(workspace.updated_at), { addSuffix: true }) : 'Unknown'}
        </span>
      </div>
    </div>
  );
};

// Workspace Modal Component
const WorkspaceModal = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  colorOptions,
  isLoading,
  isEdit = false
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white/5 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 border border-white/10 backdrop-blur-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <FiX size={20} className="text-white/60" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Workspace Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter workspace name"
              className="w-full px-4 py-2.5 border border-white/10 rounded-2xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter workspace description (optional)"
              rows="3"
              className="w-full px-4 py-2.5 border border-white/10 rounded-2xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-transparent resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Workspace Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? 'border-white scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {formData.color === color && (
                    <FiCheck size={16} className="text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                className="w-4 h-4 rounded border-white/20 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0"
              />
              <div>
                <span className="text-sm font-medium text-white/80">Public workspace</span>
                <p className="text-xs text-white/50">Allow others to discover and join this workspace</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-white/10 text-white/80 rounded-full hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 px-4 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-70 text-white transition-all"
            >
              {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspacesPage;