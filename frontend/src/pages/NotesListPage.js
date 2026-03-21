import React, { useState, useEffect } from 'react';
import { FiTrash2, FiShare2, FiFilter, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ListItem from '../components/ListItem';
import AddButton from '../components/AddButton';
import SearchModal from '../components/SearchModal';
import { useNotesStore } from '../stores/notesStore';
import { useAuthStore } from '../stores/authStore';

const NotesListPage = () => {
  const navigate = useNavigate();
  const { notes, fetchNotes, isLoading, filter, setFilter } = useNotesStore();
  const { isAuthenticated } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
    }
  }, [isAuthenticated, fetchNotes]);

  const filteredNotes = (Array.isArray(notes) ? notes : []).filter((note) => {
    if (filter === 'recent') {
      // Show only the 10 most recently updated notes
      const sortedByDate = [...(Array.isArray(notes) ? notes : [])].sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );
      return sortedByDate.slice(0, 10).includes(note);
    }
    if (filter === 'favorites') return note.is_favorite;
    return true;
  });

  const sortedNotes = [...filteredNotes].sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  );

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
              <FiShare2 size={16} /> Favorites
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">✨</div>
              <p className="text-white/70">Loading notes...</p>
            </div>
          </div>
        ) : sortedNotes.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNotes.map((note) => (
              <ListItem key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* FAB */}
      <AddButton />
    </div>
  );
};

export default NotesListPage;