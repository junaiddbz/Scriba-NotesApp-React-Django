import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept requests to the token endpoints to avoid infinite loops and page reloads on login
    if (originalRequest.url.includes('/auth/token/') || originalRequest.url.includes('/auth/login/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (email, password, passwordConfirm, firstName, lastName) =>
    apiClient.post('/v1/auth/register/', {
      email,
      password,
      password_confirm: passwordConfirm,
      first_name: firstName,
      last_name: lastName,
    }),

  login: (email, password) =>
    apiClient.post('/v1/auth/token/', { username: email, password }),

  logout: () => {
    const refreshToken = localStorage.getItem('refresh_token');
    return apiClient.post('/v1/auth/logout/', { refresh: refreshToken });
  },

  getCurrentUser: () =>
    apiClient.get('/v1/auth/me/'),

  changePassword: (oldPassword, newPassword) =>
    apiClient.post('/v1/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPassword, // Backend requires new_password_confirm
    }),

  resetPassword: (email) =>
    apiClient.post('/v1/auth/forgot-password/', { email }),

  confirmReset: (token, newPassword) =>
    apiClient.post('/v1/auth/reset-password/', { 
      token, 
      password: newPassword,
      password_confirm: newPassword 
    }),
};

// =====================
// Notes APIs
// =====================

export const notesAPI = {
  getAll: (params = {}) =>
    apiClient.get('/v1/notes/', { params }),

  getById: (id) =>
    apiClient.get(`/v1/notes/${id}/`),

  create: (data) =>
    apiClient.post('/v1/notes/', data),

  update: (id, data) =>
    apiClient.put(`/v1/notes/${id}/`, data),

  partialUpdate: (id, data) =>
    apiClient.patch(`/v1/notes/${id}/`, data),

  delete: (id) =>
    apiClient.delete(`/v1/notes/${id}/`),

  reorder: (orderedIds) =>
    apiClient.post('/v1/notes/reorder/', { ordered_ids: orderedIds }),

  search: (query) =>
    apiClient.get('/v1/notes/', { params: { search: query } }),

  getVersions: (id) =>
    apiClient.get(`/v1/notes/${id}/versions/`),

  restoreVersion: (id, versionId) =>
    apiClient.post(`/v1/notes/${id}/versions/${versionId}/restore/`),
};

// =====================
// Workspace APIs
// =====================

export const workspacesAPI = {
  getAll: (params = {}) =>
    apiClient.get('/v1/workspaces/', { params }),

  getById: (id) =>
    apiClient.get(`/v1/workspaces/${id}/`),

  create: (data) =>
    apiClient.post('/v1/workspaces/', data),

  update: (id, data) =>
    apiClient.put(`/v1/workspaces/${id}/`, data),

  delete: (id) =>
    apiClient.delete(`/v1/workspaces/${id}/`),

  getActivities: (id) =>
    apiClient.get(`/v1/workspaces/${id}/activities/`),

  getTree: () =>
    apiClient.get('/v1/workspaces/tree/'),

  move: (id, parentId) =>
    apiClient.post(`/v1/workspaces/${id}/move/`, { parent_workspace_id: parentId }),
};

// =====================
// Trash APIs
// =====================

export const trashAPI = {
  getAll: (params = {}) =>
    apiClient.get('/v1/trash/', { params }),

  restore: (id) =>
    apiClient.post(`/v1/trash/${id}/restore/`),

  permanentDelete: (id) =>
    apiClient.delete(`/v1/trash/${id}/`),

  emptyTrash: () =>
    apiClient.post('/v1/trash/empty/'),
};

// =====================
// Sharing APIs
// =====================

export const sharingAPI = {
  getSharedWithMe: (params = {}) =>
    apiClient.get('/v1/note-shares/shared-with-me/', { params }),

  getMyShares: (params = {}) =>
    apiClient.get('/v1/note-shares/shared-by-me/', { params }),

  shareNote: (noteId, data) =>
    apiClient.post(`/v1/note-shares/`, {
      note: noteId,
      ...data,
    }),

  updatePermission: (shareId, permission) =>
    apiClient.patch(`/v1/note-shares/${shareId}/`, { permission_level: permission }),

  removeShare: (shareId) =>
    apiClient.delete(`/v1/note-shares/${shareId}/`),

  toggleHideShare: (shareId) =>
    apiClient.post(`/v1/note-shares/${shareId}/toggle-hide/`),

  shareWorkspace: (workspaceId, data) =>
    apiClient.post(`/v1/workspace-shares/`, {
      workspace: workspaceId,
      ...data,
    }),

  updateWorkspacePermission: (shareId, permission) =>
    apiClient.patch(`/v1/workspace-shares/${shareId}/`, { permission_level: permission }),

  removeWorkspaceShare: (shareId) =>
    apiClient.delete(`/v1/workspace-shares/${shareId}/`),

  getWorkspaceMembers: (workspaceId) =>
    apiClient.get(`/v1/workspace-shares/`, { params: { workspace_id: workspaceId } }),

  leaveWorkspace: (workspaceId) =>
    apiClient.post(`/v1/workspace-shares/leave/`, { workspace_id: workspaceId }),
};

// =====================
// Attachment APIs
// =====================

export const attachmentsAPI = {
  uploadToS3: (file, noteId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('note_id', noteId);

    return apiClient.post('/v1/attachments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getSignedUrl: (noteId, attachmentId) =>
    apiClient.get(`/v1/attachments/${attachmentId}/`, {
      params: { note_id: noteId },
    }),

  delete: (attachmentId) =>
    apiClient.delete(`/v1/attachments/${attachmentId}/`),
};

// =====================
// Collaboration APIs
// =====================

export const collaborationAPI = {
  getActiveUsers: (noteId) =>
    apiClient.get(`/v1/collaborative-edits/`, { params: { note_id: noteId } }),

  recordEdit: (noteId, data) =>
    apiClient.post(`/v1/collaborative-edits/`, {
      note_id: noteId,
      ...data,
    }),

  getEditHistory: (noteId, params = {}) =>
    apiClient.get(`/v1/collaborative-edits/`, {
      params: { note_id: noteId, ...params },
    }),
};

// =====================
// OAuth APIs
// =====================

export const oauthAPI = {
  getGoogleAuthUrl: () =>
    apiClient.get('/v1/oauth/google/'),

  getGithubAuthUrl: () =>
    apiClient.get('/v1/oauth/github/'),

  handleGoogleCallback: (code) =>
    apiClient.post('/v1/oauth/google-callback/', { code }),

  handleGithubCallback: (code) =>
    apiClient.post('/v1/oauth/github-callback/', { code }),
};

// =====================
// Health Check
// =====================

export const healthAPI = {
  check: () =>
    apiClient.get('/health/'),
};

export default apiClient;
