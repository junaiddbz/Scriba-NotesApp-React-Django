import React, { useState, useEffect, useCallback } from 'react';
import { FiTrash2, FiShare2, FiFilter, FiSearch, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Header from '../components/Header';
import ListItem from '../components/ListItem';
import AddButton from '../components/AddButton';
import SearchModal from '../components/SearchModal';
import ShareModal from '../components/ShareModal';
import { useNotesStore } from '../stores/notesStore';
import { useSharingStore } from '../stores/sharingStore';
import { useAuthStore } from '../stores/authStore';

// Sortable wrapper for ListItem
const SortableNoteItem = ({ id, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? 'relative' : 'static',
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-manipulation">
      {/* We stop propagation on pointer down inside the ListItem buttons by passing it cleanly, 
          but dnd-kit automatically ignores interactive elements like buttons. */}
      <ListItem {...props} />
    </div>
  );
};

const arraySwap = (array, oldIndex, newIndex) => {
  const newArray = [...array];
  const temp = newArray[oldIndex];
  newArray[oldIndex] = newArray[newIndex];
  newArray[newIndex] = temp;
  return newArray;
};

const NotesListPage = () => {
  const navigate = useNavigate();
  const { notes, fetchNotes, isLoading, filter, setFilter, deleteNote, updateNote, reorderNotes } = useNotesStore();
  const { toggleHideShare } = useSharingStore();
  const { isAuthenticated } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sharingNoteId, setSharingNoteId] = useState(null);
  
  // Local state for optimistic sorting
  const [localNotes, setLocalNotes] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes({ workspace__isnull: true });
    }
  }, [isAuthenticated, fetchNotes]);

  useEffect(() => {
    // Only update local notes when the server notes change to prevent jitter
    // We sort them locally by custom_sort_index first, then updated_at
    const sorted = [...(Array.isArray(notes) ? notes : [])].sort((a, b) => {
      if (a.custom_sort_index !== b.custom_sort_index) {
        return (b.custom_sort_index || 0) - (a.custom_sort_index || 0);
      }
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
    setLocalNotes(sorted);
  }, [notes]);

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

  const handleToggleHide = async (note) => {
    if (!note.share_id) return;
    try {
      await toggleHideShare(note.share_id);
      await fetchNotes({ workspace__isnull: true }); // Refetch notes to get updated is_hidden status
    } catch (e) {
      console.error('Failed to hide note', e);
    }
  };

  // DND setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLocalNotes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arraySwap(items, oldIndex, newIndex);
        
        // Call API
        const orderedIds = newItems.map((n) => n.id);
        reorderNotes(orderedIds).catch(err => {
          // If it fails, we could revert, but for now we just log
          console.error("Reorder failed", err);
        });

        return newItems;
      });
    }
  }, [reorderNotes]);

  // Filtering
  const displayNotes = localNotes.filter((note) => {
    // Hide shared notes if is_hidden is true
    if (note.user_permission !== 'owner' && note.is_hidden) {
      return false;
    }

    if (filter === 'recent') {
      // Return true if it's one of the 10 most recently updated notes (ignoring sort index)
      const recentIds = [...localNotes]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 10)
        .map(n => n.id);
      return recentIds.includes(note.id);
    }
    if (filter === 'favorites') return note.is_favorite;
    return true;
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.06),transparent_32%),#0f172a] text-white">
      <Header 
        onOpenSearch={() => setSearchOpen(true)} 
        currentView="notes"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-sm text-white/40 uppercase tracking-[0.2em] mb-1">Overview</p>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-white">My Notes</h2>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs uppercase tracking-widest">
                Vault
              </span>
            </div>
            <p className="text-white/70 mt-2">
              {Array.isArray(notes) ? notes.length : 0} {(Array.isArray(notes) ? notes.length : 0) === 1 ? 'note' : 'notes'}
            </p>
          </div>

          {/* Filter & Search Buttons */}
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full border border-white/10 bg-white/5 hover:border-orange-500/60 hover:bg-orange-500/10 transition-colors"
              title="Search notes"
              aria-label="Search notes"
              style={{ minWidth: '40px' }}
            >
              <FiSearch size={16} className="text-white/80" />
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                filter === 'all'
                  ? 'bg-orange-500/90 border-orange-500 text-white shadow'
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                filter === 'recent'
                  ? 'bg-orange-500/90 border-orange-500 text-white shadow'
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
              }`}
            >
              <FiFilter size={16} /> Recent
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                filter === 'favorites'
                  ? 'bg-orange-500/90 border-orange-500 text-white shadow'
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
              }`}
            >
              <FiStar size={16} /> Favorites
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        {isLoading && notes.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">✨</div>
              <p className="text-white/70">Loading notes...</p>
            </div>
          </div>
        ) : displayNotes.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl shadow-2xl">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No notes yet
            </h3>
            <p className="text-white/70 mb-6">
              Create your first note to get started!
            </p>
            <button
              onClick={() => navigate('/note/new')}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-medium shadow-lg shadow-orange-500/20 transition-all"
            >
              Create First Note
            </button>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={displayNotes.map(n => n.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayNotes.map((note) => (
                  <SortableNoteItem 
                    key={note.id} 
                    id={note.id}
                    note={note} 
                    shared={note.user_permission && note.user_permission !== 'owner'}
                    onDelete={note.user_permission === 'owner' || !note.user_permission ? handleDeleteNote : null}
                    onShare={note.user_permission === 'owner' || note.user_permission === 'admin' || !note.user_permission ? handleShareNote : null}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleHide={note.user_permission && note.user_permission !== 'owner' ? handleToggleHide : null}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Share Modal */}
      {sharingNoteId && (
        <ShareModal noteId={sharingNoteId} onClose={() => setSharingNoteId(null)} />
      )}

      {/* FAB */}
      <AddButton />
    </div>
  );
};

export default NotesListPage;