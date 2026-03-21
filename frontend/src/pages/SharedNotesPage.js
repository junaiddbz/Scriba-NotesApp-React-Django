import React, { useState, useEffect } from 'react';
import { FaCrown } from 'react-icons/fa';
import {
  FiShare2,
  FiUsers,
  FiSearch,
  FiFilter,
  FiEdit3,
  FiEye,
  FiTrash2,
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiMail,
  FiSettings,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import Header from '../components/Header';
import { useSharingStore } from '../stores/sharingStore';

const SharedNotesPage = () => {
  const navigate = useNavigate();
  const {
    sharedWithMe,
    myShares,
    isLoading,
    error,
    fetchSharedWithMe,
    fetchMyShares,
    updatePermission,
    removeShare
  } = useSharingStore();

  const [activeTab, setActiveTab] = useState('shared-with-me'); // 'shared-with-me' or 'my-shares'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'viewer', 'editor', 'admin'
  const [selectedShare, setSelectedShare] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Load data on mount and tab change
  useEffect(() => {
    if (activeTab === 'shared-with-me') {
      fetchSharedWithMe();
    } else {
      fetchMyShares();
    }
  }, [activeTab, fetchSharedWithMe, fetchMyShares]);

  const currentData = activeTab === 'shared-with-me' ? sharedWithMe : myShares;

  // Filter data based on search and filter
  const filteredData = (Array.isArray(currentData) ? currentData : []).filter((item) => {
    const matchesSearch =
      item.note?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.note?.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shared_with_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterBy === 'all' ||
      item.permission_level?.toLowerCase() === filterBy.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const handlePermissionChange = async (shareId, newPermission) => {
    try {
      await updatePermission(shareId, newPermission);
      toast.success('Permission updated successfully');
      setShowPermissionModal(false);
      setSelectedShare(null);
    } catch (error) {
      console.error('Permission update error:', error);
      toast.error('Failed to update permission');
    }
  };

  const handleRemoveShare = async (shareId, shareType) => {
    const confirmMessage = shareType === 'my-share'
      ? 'Are you sure you want to stop sharing this note?'
      : 'Are you sure you want to remove access to this note?';

    if (!window.confirm(confirmMessage)) return;

    try {
      await removeShare(shareId, shareType === 'my-share' ? 'my-shares' : 'shared-with-me');
      toast.success('Share removed successfully');
    } catch (error) {
      console.error('Remove share error:', error);
      toast.error('Failed to remove share');
    }
  };

  const openPermissionModal = (share) => {
    setSelectedShare(share);
    setShowPermissionModal(true);
  };

  const getPermissionIcon = (permission) => {
    switch (permission?.toLowerCase()) {
      case 'viewer': return <FiEye className="text-blue-400" size={16} />;
      case 'editor': return <FiEdit3 className="text-green-400" size={16} />;
      case 'admin': return <FaCrown className="text-orange-400" size={16} />;
      default: return <FiEye className="text-gray-400" size={16} />;
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission?.toLowerCase()) {
      case 'viewer': return 'text-blue-400';
      case 'editor': return 'text-green-400';
      case 'admin': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.06),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.05),transparent_32%),#0f172a] text-white">
      <Header currentView="shared" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/notes')}
            className="p-2 rounded-full border border-gray-700/70 bg-gray-800/70 hover:border-orange-500/60 hover:bg-orange-500/10 transition-colors text-gray-200"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <p className="text-sm text-gray-400 uppercase tracking-[0.2em] mb-1">Overview</p>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FiShare2 />
              Shared Notes
            </h1>
            <p className="text-gray-400 mt-1">
              Manage notes shared with you and notes you've shared with others
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-gray-800/70 rounded-full border border-gray-700/70 p-1">
            <button
              onClick={() => setActiveTab('shared-with-me')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeTab === 'shared-with-me'
                  ? 'bg-orange-500/90 text-white shadow'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FiUsers size={18} />
              Shared With Me ({Array.isArray(sharedWithMe) ? sharedWithMe.length : 0})
            </button>
            <button
              onClick={() => setActiveTab('my-shares')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeTab === 'my-shares'
                  ? 'bg-orange-500/90 text-white shadow'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FiShare2 size={18} />
              My Shares ({Array.isArray(myShares) ? myShares.length : 0})
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search shared notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-gray-700/70 bg-gray-800/70 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 rounded-full border border-gray-700/70 bg-gray-800/70 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all" className="bg-slate-900 text-white">All Permissions</option>
              <option value="viewer" className="bg-slate-900 text-white">Viewer</option>
              <option value="editor" className="bg-slate-900 text-white">Editor</option>
              <option value="admin" className="bg-slate-900 text-white">Admin</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">🔄</div>
              <p className="text-gray-400">Loading shared notes...</p>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery || filterBy !== 'all'
                ? 'No matching shared notes found'
                : activeTab === 'shared-with-me'
                  ? 'No notes shared with you'
                  : 'No notes shared by you'
              }
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || filterBy !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : activeTab === 'shared-with-me'
                  ? 'When others share notes with you, they will appear here'
                  : 'Share notes with others to collaborate and see them listed here'
              }
            </p>
            <button
              onClick={() => navigate('/notes')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium transition-colors shadow"
            >
              {activeTab === 'my-shares' ? 'Share a Note' : 'View All Notes'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((share) => (
              <SharedNoteItem
                key={share.id}
                share={share}
                type={activeTab}
                onPermissionChange={() => openPermissionModal(share)}
                onRemove={() => handleRemoveShare(share.id, activeTab)}
                onViewNote={() => navigate(`/note/${share.note?.id}`)}
                getPermissionIcon={getPermissionIcon}
                getPermissionColor={getPermissionColor}
              />
            ))}
          </div>
        )}

        {/* Permission Modal */}
        {showPermissionModal && selectedShare && (
          <PermissionModal
            share={selectedShare}
            onUpdatePermission={handlePermissionChange}
            onClose={() => {
              setShowPermissionModal(false);
              setSelectedShare(null);
            }}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

// Shared Note Item Component
const SharedNoteItem = ({
  share,
  type,
  onPermissionChange,
  onRemove,
  onViewNote,
  getPermissionIcon,
  getPermissionColor
}) => {
  const note = share.note || {};
  const title = note.title || (note.body ? note.body.split('\n')[0] : 'Untitled Note');
  const preview = note.body ? note.body.substring(0, 120) : 'No content';

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800/70 border border-gray-700/70 rounded-xl hover:border-orange-500/40 hover:bg-gray-800 transition-all shadow-sm">
      {/* Note Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onViewNote}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-white truncate">{title}</h3>
            <p className="text-sm text-gray-400 line-clamp-2 mt-1">{preview}</p>

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {type === 'shared-with-me' ? (
                <div className="flex items-center gap-1">
                  <FiUser size={12} />
                  <span>Shared by {share.shared_by_name || share.shared_by_email}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <FiMail size={12} />
                  <span>Shared with {share.shared_with_email}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <FiCalendar size={12} />
                <span>
                  {share.created_at ? formatDistanceToNow(new Date(share.created_at), { addSuffix: true }) : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Permission Badge */}
          <div className={`flex items-center gap-2 px-3 py-1 bg-gray-700/80 rounded-full ${getPermissionColor(share.permission_level)}`}>
            {getPermissionIcon(share.permission_level)}
            <span className="text-sm font-medium capitalize">
              {share.permission_level || 'viewer'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {type === 'my-shares' && (
          <button
            onClick={onPermissionChange}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Change permission"
            aria-label="Change permission"
          >
            <FiSettings size={16} />
          </button>
        )}

        <button
          onClick={onRemove}
          className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
          title={type === 'my-shares' ? 'Stop sharing' : 'Remove access'}
          aria-label={type === 'my-shares' ? 'Stop sharing' : 'Remove access'}
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// Permission Modal Component
const PermissionModal = ({ share, onUpdatePermission, onClose, isLoading }) => {
  const [selectedPermission, setSelectedPermission] = useState(share.permission_level || 'VIEWER');

  const permissions = [
    {
      value: 'VIEWER',
      label: 'Viewer',
      description: 'Can view the note but cannot edit',
      icon: <FiEye className="text-blue-400" size={20} />
    },
    {
      value: 'EDITOR',
      label: 'Editor',
      description: 'Can view and edit the note content',
      icon: <FiEdit3 className="text-green-400" size={20} />
    },
    {
      value: 'ADMIN',
      label: 'Admin',
      description: 'Full access including sharing and deletion',
      icon: <FaCrown className="text-orange-400" size={20} />
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdatePermission(share.id, selectedPermission);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 border border-gray-700/70">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Change Permission</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <FiX size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">
            Changing permission for <strong className="text-white">{share.shared_with_email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Note: <span className="text-gray-300">{share.note?.title || 'Untitled Note'}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Permission Options */}
          <div className="space-y-3">
            {permissions.map((permission) => (
              <label
                key={permission.value}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedPermission === permission.value
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="permission"
                  value={permission.value}
                  checked={selectedPermission === permission.value}
                  onChange={(e) => setSelectedPermission(e.target.value)}
                  className="sr-only"
                />

                <div className="flex items-center gap-3">
                  {permission.icon}
                  <div>
                    <div className="font-medium text-white">{permission.label}</div>
                    <div className="text-xs text-gray-400">{permission.description}</div>
                  </div>
                </div>

                {selectedPermission === permission.value && (
                  <FiCheck className="text-orange-400 ml-auto" size={16} />
                )}
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-700 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedPermission === share.permission_level}
              className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white rounded-lg transition-colors"
            >
              {isLoading ? 'Updating...' : 'Update Permission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SharedNotesPage;