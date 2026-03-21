import create from 'zustand';
import { authAPI, workspacesAPI } from '../services/api';

export const useAuthStore = create((set) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  register: async (email, password, passwordConfirm, firstName, lastName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(email, password, passwordConfirm, firstName, lastName);
      const { access, refresh, user } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      set({
        user,
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
      });

      // Create default workspace for new user
      try {
        await workspacesAPI.create({
          name: 'Personal',
          description: 'Your personal workspace for notes',
          color: '#f68657', // Orange - matches app theme
          is_public: false,
        });
      } catch (workspaceError) {
        // Don't fail registration if workspace creation fails
        console.warn('Failed to create default workspace:', workspaceError);
      }

      return response.data;
    } catch (error) {
      // Log full error for debugging
      console.error('Register error:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle different error response formats
      let errorMessage = 'Registration failed';
      
      if (error.response?.data) {
        const data = error.response.data;
        console.log('Error data object:', data);
        
        // Handle DRF field errors (dict of field names to error arrays/strings)
        if (typeof data === 'object' && !Array.isArray(data)) {
          const firstError = Object.values(data)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (data.message) {
            errorMessage = data.message;
          }
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      
      console.log('Setting error:', errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { access, refresh, user } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      set({
        user,
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      set({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        error: null,
      });
    }
  },

  getCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const response = await authAPI.getCurrentUser();
      const user = response.data;

      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to fetch user',
      });
      throw error;
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.changePassword(oldPassword, newPassword);
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Password change failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.resetPassword(email);
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Password reset failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  confirmReset: async (token, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.confirmReset(token, newPassword);
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Password confirmation failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  hydrate: async () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (token) {
      set({ isLoading: true });
      try {
        const response = await authAPI.getCurrentUser();
        set({
          user: response.data,
          accessToken: token,
          refreshToken: refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
