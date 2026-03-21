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
    }),

  resetPassword: (email) =>
    apiClient.post('/v1/auth/forgot-password/', { email }),

  confirmReset: (token, newPassword) =>
    apiClient.post('/v1/auth/reset-password/', { token, new_password: newPassword }),
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

  search: (query) =>
    apiClient.get('/v1/notes/', { params: { search: query } }),

  getVersions: (id) =>
    apiClient.get(`/v1/notes/${id}/versions/`),

  restoreVersion: (id, versionId) =>
    apiClient.post(`/v1/notes/${id}/restore-version/`, { version_id: versionId }),
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

  getFolders: (workspaceId) =>
    apiClient.get(`/v1/workspaces/${workspaceId}/folders/`),

  createFolder: (workspaceId, data) =>
    apiClient.post(`/v1/workspaces/${workspaceId}/folders/`, data),

  moveNote: (workspaceId, noteId, folderId) =>
    apiClient.post(`/v1/workspaces/${workspaceId}/move-note/`, {
      note_id: noteId,
      folder_id: folderId,
    }),
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
    apiClient.get('/v1/note-shares/', { params }),

  getMyShares: (params = {}) =>
    apiClient.get('/v1/note-shares/', { params }),

  shareNote: (noteId, data) =>
    apiClient.post(`/v1/note-shares/`, {
      note_id: noteId,
      ...data,
    }),

  updatePermission: (shareId, permission) =>
    apiClient.patch(`/v1/note-shares/${shareId}/`, { permission_level: permission }),

  removeShare: (shareId) =>
    apiClient.delete(`/v1/note-shares/${shareId}/`),

  shareWorkspace: (workspaceId, data) =>
    apiClient.post(`/v1/workspace-shares/`, {
      workspace_id: workspaceId,
      ...data,
    }),

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
    apiClient.post('/oauth/google/callback/', { code }),

  handleGithubCallback: (code) =>
    apiClient.post('/oauth/github/callback/', { code }),
};

// =====================
// Health Check
// =====================

export const healthAPI = {
  check: () =>
    apiClient.get('/health/'),
};

export default apiClient;
