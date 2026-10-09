import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiCamera, FiSave, FiEdit3, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import { useAuthStore } from '../stores/authStore';
import { useNotesStore } from '../stores/notesStore';
import { useWorkspacesStore } from '../stores/workspacesStore';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { notes, fetchNotes } = useNotesStore();
  const { workspaces, fetchWorkspaces } = useWorkspacesStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  const { changePassword } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePasswordSubmit = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.old_password?.[0] || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Initialize form data with user data
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
      fetchWorkspaces();
    }
  }, [isAuthenticated, fetchNotes, fetchWorkspaces]);



  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('First and last name are required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement actual profile update API call
      // await updateProfile(formData);

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      // TODO: Implement actual avatar upload API call
      // const formData = new FormData();
      // formData.append('avatar', file);
      // await uploadAvatar(formData);

      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to update avatar. Please try again.');
    }
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last;
  };

  const notesCount = Array.isArray(notes) ? notes.length : 0;
  const workspacesCount = Array.isArray(workspaces) ? workspaces.length : 0;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.06),transparent_32%),#0f172a'
      }}
    >
      <Header currentView="profile" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/notes')}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">Profile</h1>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs uppercase tracking-widest">
                  Identity
                </span>
              </div>
              <p className="text-white/70 mt-2">Manage your account settings</p>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-medium shadow-lg shadow-orange-500/20 transition-all"
            >
              <FiEdit3 size={18} />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 border border-white/10 text-white/80 rounded-full hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-70 text-white font-medium shadow-lg shadow-orange-500/20 transition-all"
              >
                <FiSave size={18} />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Avatar & Basic Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-lg">
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-bold text-white mb-4 mx-auto shadow-lg shadow-orange-500/30">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${formData.first_name} ${formData.last_name}`}
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(formData.first_name, formData.last_name) ||
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.email}`}
                        alt="Avatar"
                        className="w-32 h-32 rounded-full"
                      />
                    )}
                  </div>

                  {isEditing && (
                    <>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-2 right-2 p-2 bg-orange-500 hover:bg-orange-400 rounded-full cursor-pointer shadow-lg shadow-orange-500/30 transition-all"
                      >
                        <FiCamera size={16} className="text-white" />
                      </label>
                    </>
                  )}
                </div>

                <h2 className="text-xl font-bold text-white">
                  {formData.first_name} {formData.last_name}
                </h2>
                <p className="text-white/70 mt-1">{formData.email}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                <div className="text-center rounded-2xl bg-white/5 border border-white/10 py-3">
                  <div className="text-2xl font-bold text-white">
                    {notesCount || user?.notes_count || 0}
                  </div>
                  <div className="text-sm text-white/70">Notes</div>
                </div>
                <div className="text-center rounded-2xl bg-white/5 border border-white/10 py-3">
                  <div className="text-2xl font-bold text-white">
                    {workspacesCount || user?.workspaces_count || 0}
                  </div>
                  <div className="text-sm text-white/70">Workspaces</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-lg">
              <h3 className="text-lg font-semibold text-white mb-6">Personal Information</h3>

              <div className="space-y-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-white/10 rounded-2xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-transparent transition-all"
                        placeholder="Enter your first name"
                      />
                    </div>
                  ) : (
                    <div className="py-3 px-4 bg-white/5 border border-white/10 rounded-2xl text-white/80">
                      {formData.first_name || 'Not provided'}
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-white/10 rounded-2xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-transparent transition-all"
                        placeholder="Enter your last name"
                      />
                    </div>
                  ) : (
                    <div className="py-3 px-4 bg-white/5 border border-white/10 rounded-2xl text-white/80">
                      {formData.last_name || 'Not provided'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-white/10 rounded-2xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-transparent transition-all"
                        placeholder="Enter your email address"
                      />
                    </div>
                  ) : (
                    <div className="py-3 px-4 bg-white/5 border border-white/10 rounded-2xl text-white/80">
                      {formData.email || 'Not provided'}
                    </div>
                  )}
                </div>

                {/* Account Created */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Member Since
                  </label>
                  <div className="py-3 px-4 bg-white/5 border border-white/10 rounded-2xl text-white/60">
                    {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Settings (future expansion) */}
            <div className="bg-white/5 rounded-3xl border border-white/10 p-6 mt-6 shadow-2xl backdrop-blur-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Account Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full text-left px-4 py-3 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-white/80"
                >
                  Account Settings
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full text-left px-4 py-3 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-white/80"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleChangePasswordSubmit(); }}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Old Password</label>
                  <input
                    type="password"
                    name="oldPassword"
                    autoComplete="current-password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, oldPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-white/10 text-white/80 rounded-full hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-70 text-white rounded-full transition-colors"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;