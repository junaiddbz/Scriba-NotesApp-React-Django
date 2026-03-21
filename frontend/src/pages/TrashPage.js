import React, { useState, useEffect } from 'react';
import {
  FiTrash2,
  FiRotateCcw,
  FiSearch,
  FiCalendar,
  FiUser,
  FiArrowLeft,
  FiAlertTriangle,
  FiFilter,
  FiClock,
  FiFileText,
  FiFolder
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDistanceToNow, format } from 'date-fns';
import Header from '../components/Header';
import { useTrashStore } from '../stores/trashStore';

const TrashPage = () => {
  const navigate = useNavigate();
  const {
    deletedNotes,
    isLoading,
    error,
    fetchDeletedNotes,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash
  } = useTrashStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deleted_at'); // deleted_at, title, author
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);

  // Load deleted notes on mount
  useEffect(() => {
    fetchDeletedNotes();
  }, [fetchDeletedNotes]);

  // Filter and sort deleted notes
  const filteredAndSortedNotes = (Array.isArray(deletedNotes) ? deletedNotes : [])
    .filter((trashItem) =>
      trashItem.note?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trashItem.note?.body?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'title':
          aValue = a.note?.title || '';
          bValue = b.note?.title || '';
          break;
        case 'author':
          aValue = a.note?.created_by_name || '';
          bValue = b.note?.created_by_name || '';
          break;
        case 'deleted_at':
        default:
          aValue = new Date(a.deleted_at || a.note?.updated_at);
          bValue = new Date(b.deleted_at || b.note?.updated_at);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleRestoreNote = async (noteId) => {
    try {
      await restoreNote(noteId);
      toast.success('Note restored successfully');
      setSelectedNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore note');
    }
  };

  const handlePermanentDelete = async (noteId) => {
    if (!window.confirm('Are you sure? This will permanently delete the note and cannot be undone.')) {
      return;
    }

    try {
      await permanentlyDeleteNote(noteId);
      toast.success('Note permanently deleted');
      setSelectedNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    } catch (error) {
      console.error('Permanent delete error:', error);
      toast.error('Failed to permanently delete note');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedNotes.size === 0) return;

    try {
      const promises = Array.from(selectedNotes).map(noteId => restoreNote(noteId));
      await Promise.all(promises);
      toast.success(`${selectedNotes.size} notes restored successfully`);
      setSelectedNotes(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Bulk restore error:', error);
      toast.error('Failed to restore some notes');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotes.size === 0) return;

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedNotes.size} notes? This cannot be undone.`)) {
      return;
    }

    try {
      const promises = Array.from(selectedNotes).map(noteId => permanentlyDeleteNote(noteId));
      await Promise.all(promises);
      toast.success(`${selectedNotes.size} notes permanently deleted`);
      setSelectedNotes(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some notes');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash();
      toast.success('Trash emptied successfully');
      setShowEmptyTrashModal(false);
      setSelectedNotes(new Set());
    } catch (error) {
      console.error('Empty trash error:', error);
      toast.error('Failed to empty trash');
    }
  };

  const handleSelectNote = (noteId, checked) => {
    const newSet = new Set(selectedNotes);
    if (checked) {
      newSet.add(noteId);
    } else {
      newSet.delete(noteId);
    }
    setSelectedNotes(newSet);
    setShowBulkActions(newSet.size > 0);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(filteredAndSortedNotes.map(note => note.id));
      setSelectedNotes(allIds);
      setShowBulkActions(allIds.size > 0);
    } else {
      setSelectedNotes(new Set());
      setShowBulkActions(false);
    }
  };

  const getTitleFromBody = (body) => {
    if (!body) return 'Untitled Note';
    const firstLine = body.split('\n')[0];
    return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.06),transparent_32%),#0f172a'
      }}
    >
      <Header currentView="trash" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/notes')}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FiTrash2 />
              Trash
            </h1>
            <p className="text-white/70 mt-1">
              {filteredAndSortedNotes.length} deleted {filteredAndSortedNotes.length === 1 ? 'note' : 'notes'}
              {selectedNotes.size > 0 && ` • ${selectedNotes.size} selected`}
            </p>
          </div>

          {filteredAndSortedNotes.length > 0 && (
            <button
              onClick={() => setShowEmptyTrashModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-500/50 text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <FiTrash2 size={18} />
              Empty Trash
            </button>
          )}
        </div>

        {/* Controls */}
        {filteredAndSortedNotes.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search deleted notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-white/10 rounded-full bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-transparent"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex gap-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-4 py-2.5 border border-white/10 rounded-full bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/70"
              >
                <option value="deleted_at-desc" className="bg-slate-900 text-white">Recently Deleted</option>
                <option value="deleted_at-asc" className="bg-slate-900 text-white">Oldest First</option>
                <option value="title-asc" className="bg-slate-900 text-white">Title A-Z</option>
                <option value="title-desc" className="bg-slate-900 text-white">Title Z-A</option>
                <option value="author-asc" className="bg-slate-900 text-white">Author A-Z</option>
              </select>

              {/* Select All */}
              <label className="flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-full text-white/70 hover:bg-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedNotes.size === filteredAndSortedNotes.length && filteredAndSortedNotes.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-white/20 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                />
                Select All
              </label>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl shadow-lg">
            <span className="text-sm text-white/70">
              {selectedNotes.size} notes selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkRestore}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 hover:bg-green-500 text-white text-sm transition-colors"
              >
                <FiRotateCcw size={14} />
                Restore All
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm transition-colors"
              >
                <FiTrash2 size={14} />
                Delete Forever
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-2xl">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">🗑️</div>
              <p className="text-white/70">Loading deleted notes...</p>
            </div>
          </div>
        ) : filteredAndSortedNotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🗑️</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No matching notes found' : 'Trash is empty'}
            </h3>
            <p className="text-white/70 mb-6">
              {searchQuery
                ? `No deleted notes match "${searchQuery}"`
                : 'Deleted notes will appear here. You can restore them or delete them permanently.'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/notes')}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-medium shadow-lg shadow-orange-500/20 transition-all"
              >
                Back to Notes
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedNotes.map((note) => (
              <TrashItem
                key={note.id}
                note={note}
                isSelected={selectedNotes.has(note.id)}
                onSelect={(checked) => handleSelectNote(note.id, checked)}
                onRestore={() => handleRestoreNote(note.id)}
                onPermanentDelete={() => handlePermanentDelete(note.id)}
                getTitleFromBody={getTitleFromBody}
              />
            ))}
          </div>
        )}

        {/* Empty Trash Modal */}
        {showEmptyTrashModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white/5 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 border border-red-500/30">
              <div className="flex items-center gap-3 mb-4">
                <FiAlertTriangle className="text-red-400" size={24} />
                <h3 className="text-lg font-semibold text-white">Empty Trash</h3>
              </div>

              <p className="text-white/70 mb-6">
                Are you sure you want to permanently delete all notes in the trash?
                This action cannot be undone and will delete <strong className="text-white">{filteredAndSortedNotes.length}</strong> notes.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmptyTrashModal(false)}
                  className="flex-1 px-4 py-2.5 border border-white/10 text-white/80 rounded-full hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmptyTrash}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-70 text-white rounded-full transition-colors"
                >
                  {isLoading ? 'Emptying...' : 'Empty Trash'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Trash Item Component
const TrashItem = ({ note, isSelected, onSelect, onRestore, onPermanentDelete, getTitleFromBody }) => {
  const noteData = note.note || note; // Handle both TrashBin and Note objects
  const title = noteData.title || getTitleFromBody(noteData.body);
  const preview = noteData.body ? noteData.body.substring(0, 120) : 'No content';

  return (
    <div className={`flex items-center gap-4 p-4 bg-white/5 border rounded-2xl transition-all ${
      isSelected ? 'border-orange-400/60 bg-white/10' : 'border-white/10 hover:border-white/20'
    }`}>
      {/* Checkbox */}
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded border-white/20 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
        />
      </label>

      {/* Note Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-white truncate">{title}</h3>
            <p className="text-sm text-white/70 line-clamp-2 mt-1">{preview}</p>

            <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
              <div className="flex items-center gap-1">
                <FiClock size={12} />
                <span>
                  Deleted {(note.deleted_at || noteData.updated_at) ? formatDistanceToNow(new Date(note.deleted_at || noteData.updated_at), { addSuffix: true }) : 'Unknown'}
                </span>
              </div>
              {noteData.created_by_name && (
                <div className="flex items-center gap-1">
                  <FiUser size={12} />
                  <span>{noteData.created_by_name}</span>
                </div>
              )}
              {noteData.workspace_name && (
                <div className="flex items-center gap-1">
                  <FiFolder size={12} />
                  <span>{noteData.workspace_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onRestore}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-500 text-white text-sm transition-colors"
              title="Restore note"
              aria-label="Restore note"
            >
              <FiRotateCcw size={14} />
              <span className="hidden sm:inline">Restore</span>
            </button>
            <button
              onClick={onPermanentDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm transition-colors"
              title="Delete permanently"
              aria-label="Delete permanently"
            >
              <FiTrash2 size={14} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrashPage;