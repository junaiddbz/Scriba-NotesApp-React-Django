import create from 'zustand';
import { notesAPI } from '../services/api';

export const useNotesStore = create((set, get) => ({
  // State
  notes: [],
  currentNote: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filter: 'all', // 'all', 'recent', 'favorites'

  // Actions
  fetchNotes: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notesAPI.getAll(params);
      // Handle paginated response: extract results array
      const notesData = response.data.results || response.data || [];
      set({ notes: Array.isArray(notesData) ? notesData : [], isLoading: false });
      return notesData;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch notes';
      set({ error: errorMessage, isLoading: false, notes: [] });
      throw error;
    }
  },

  fetchNoteById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notesAPI.getById(id);
      set({ currentNote: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch note';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createNote: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notesAPI.create(data);
      const { notes } = get();
      set({ notes: [response.data, ...notes], currentNote: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to create note';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateNote: async (id, data) => {
    // We intentionally don't set isLoading: true here to prevent the UI from flashing
    // during autosaves or when toggling favorites
    set({ error: null });
    try {
      // Use partialUpdate (PATCH) instead of update (PUT) so we can update single fields
      const response = await notesAPI.partialUpdate(id, data);
      const { notes, currentNote } = get();

      const updatedNotes = notes.map((note) =>
        note.id === id ? { ...note, ...response.data } : note
      );

      set({
        notes: updatedNotes,
        currentNote: currentNote?.id === id ? { ...currentNote, ...response.data } : currentNote,
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to update note';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await notesAPI.delete(id);
      const { notes } = get();

      set({
        notes: notes.filter((note) => note.id !== id),
        currentNote: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete note';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  reorderNotes: async (orderedIds) => {
    // Optimistically reorder in state if needed, but since frontend handles the drag state,
    // we can just make the API call silently.
    try {
      await notesAPI.reorder(orderedIds);
      // Optional: Could refetch or let frontend rely on local state swap.
    } catch (error) {
      console.error('Failed to reorder notes:', error);
      throw error;
    }
  },

  searchNotes: async (query) => {
    set({ isLoading: true, error: null, searchQuery: query });
    try {
      const response = await notesAPI.search(query);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Search failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  setFilter: (filter) => set({ filter }),

  clearSearchQuery: () => set({ searchQuery: '', currentNote: null }),

  setCurrentNote: (note) => set({ currentNote: note }),

  getVersions: async (noteId) => {
    try {
      const response = await notesAPI.getVersions(noteId);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  restoreVersion: async (noteId, versionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notesAPI.restoreVersion(noteId, versionId);
      set({ currentNote: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to restore version';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
