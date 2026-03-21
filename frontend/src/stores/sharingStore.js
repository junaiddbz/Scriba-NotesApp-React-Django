import create from 'zustand';
import { sharingAPI } from '../services/api';

export const useSharingStore = create((set, get) => ({
  // State
  sharedWithMe: [],
  myShares: [],
  workspaceMembers: [],
  isLoading: false,
  error: null,

  // Actions
  fetchSharedWithMe: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sharingAPI.getSharedWithMe(params);
      const sharedData = response.data.results || response.data || [];
      set({ sharedWithMe: Array.isArray(sharedData) ? sharedData : [], isLoading: false });
      return sharedData;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch shared items';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchMyShares: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sharingAPI.getMyShares(params);
      const sharesData = response.data.results || response.data || [];
      set({ myShares: Array.isArray(sharesData) ? sharesData : [], isLoading: false });
      return sharesData;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch my shares';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  shareNote: async (noteId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sharingAPI.shareNote(noteId, data);
      const { myShares } = get();
      set({ myShares: [response.data, ...myShares], isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to share note';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updatePermission: async (shareId, permission) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sharingAPI.updatePermission(shareId, permission);
      const { myShares } = get();

      const updatedShares = myShares.map((share) =>
        share.id === shareId ? response.data : share
      );

      set({ myShares: updatedShares, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to update permission';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  removeShare: async (shareId, shareType = 'my-shares') => {
    set({ isLoading: true, error: null });
    try {
      await sharingAPI.removeShare(shareId);
      const { myShares, sharedWithMe } = get();
      set({
        myShares: shareType === 'my-shares' ? myShares.filter((share) => share.id !== shareId) : myShares,
        sharedWithMe: shareType === 'shared-with-me' ? sharedWithMe.filter((share) => share.id !== shareId) : sharedWithMe,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to remove share';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  shareWorkspace: async (workspaceId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sharingAPI.shareWorkspace(workspaceId, data);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to share workspace';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchWorkspaceMembers: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sharingAPI.getWorkspaceMembers(workspaceId);
      set({ workspaceMembers: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch workspace members';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  leaveWorkspace: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      await sharingAPI.leaveWorkspace(workspaceId);
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to leave workspace';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
