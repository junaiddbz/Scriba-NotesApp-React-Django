import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useNotesStore } from '../stores/notesStore';
import ListItem from './ListItem';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { notes, searchNotes, isLoading } = useNotesStore();
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    try {
      const results = await searchNotes(query);
      // Extract results array from paginated response
      const resultsList = Array.isArray(results) ? results : (results?.results || []);
      setSearchResults(resultsList);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="bg-gray-900/95 rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-gray-800/70">
        {/* Search Header */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-700">
          <FiSearch className="text-gray-400" size={20} />
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              placeholder="Search notes by title, content, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-transparent text-lg text-white placeholder-gray-500 focus:outline-none"
            />
          </form>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close search"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin">⏳</div> Searching...
            </div>
          )}

          {!isLoading && hasSearched && searchResults.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No notes found matching "{query}"
            </div>
          )}

          {!isLoading && !hasSearched && (
            <div className="p-8 text-center text-gray-500">
              Type to search your notes
            </div>
          )}

          {!isLoading && searchResults.length > 0 && (
            <div className="p-4 space-y-2">
              {searchResults.map((note) => (
                <div key={note.id} onClick={onClose}>
                  <ListItem note={note} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
