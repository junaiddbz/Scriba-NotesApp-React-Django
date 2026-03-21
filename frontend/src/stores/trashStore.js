import create from 'zustand';
import { trashAPI } from '../services/api';

export const useTrashStore = create((set, get) => ({
  // State
  deletedNotes: [],
  isLoading: false,
  error: null,

  // Actions
  fetchDeletedNotes: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await trashAPI.getAll(params);
      const notesData = response.data.results || response.data || [];
      set({ deletedNotes: Array.isArray(notesData) ? notesData : [], isLoading: false });
      return notesData;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch trash';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  restoreNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await trashAPI.restore(id);
      const { deletedNotes } = get();
      set({
        deletedNotes: deletedNotes.filter((item) => item.id !== id),
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to restore note';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  permanentlyDeleteNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await trashAPI.permanentDelete(id);
      const { deletedNotes } = get();
      set({
        deletedNotes: deletedNotes.filter((item) => item.id !== id),
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to permanently delete note';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  emptyTrash: async () => {
    set({ isLoading: true, error: null });
    try {
      await trashAPI.emptyTrash();
      set({ deletedNotes: [], isLoading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to empty trash';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
