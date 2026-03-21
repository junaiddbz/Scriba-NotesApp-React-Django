import create from 'zustand';
import { workspacesAPI } from '../services/api';

export const useWorkspacesStore = create((set, get) => ({
  // State
  workspaces: [],
  currentWorkspace: null,
  folders: [],
  isLoading: false,
  error: null,

  // Actions
  fetchWorkspaces: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await workspacesAPI.getAll(params);
      // Handle paginated response: extract results array
      const workspacesData = response.data.results || response.data || [];
      set({ workspaces: Array.isArray(workspacesData) ? workspacesData : [], isLoading: false });
      return workspacesData;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch workspaces';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchWorkspaceById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await workspacesAPI.getById(id);
      set({ currentWorkspace: response.data, isLoading: false });

      // Fetch folders for this workspace
      await get().fetchFolders(id);

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch workspace';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createWorkspace: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await workspacesAPI.create(data);
      const { workspaces } = get();
      const workspacesArray = Array.isArray(workspaces) ? workspaces : [];
      set({ workspaces: [response.data, ...workspacesArray], isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to create workspace';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateWorkspace: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await workspacesAPI.update(id, data);
      const { workspaces, currentWorkspace } = get();
      const workspacesArray = Array.isArray(workspaces) ? workspaces : [];

      const updatedWorkspaces = workspacesArray.map((ws) =>
        ws.id === id ? response.data : ws
      );

      set({
        workspaces: updatedWorkspaces,
        currentWorkspace: currentWorkspace?.id === id ? response.data : currentWorkspace,
        isLoading: false,
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to update workspace';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteWorkspace: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await workspacesAPI.delete(id);
      const { workspaces } = get();
      const workspacesArray = Array.isArray(workspaces) ? workspaces : [];

      set({
        workspaces: workspacesArray.filter((ws) => ws.id !== id),
        currentWorkspace: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete workspace';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchFolders: async (workspaceId) => {
    try {
      const response = await workspacesAPI.getFolders(workspaceId);
      set({ folders: response.data });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createFolder: async (workspaceId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await workspacesAPI.createFolder(workspaceId, data);
      const { folders } = get();
      set({ folders: [response.data, ...folders], isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to create folder';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  moveNote: async (workspaceId, noteId, folderId) => {
    set({ isLoading: true, error: null });
    try {
      await workspacesAPI.moveNote(workspaceId, noteId, folderId);
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to move note';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
}));
