import React, { useState, useEffect } from 'react';
import {
  FiArrowLeft,
  FiBell,
  FiShield,
  FiGlobe,
  FiMoon,
  FiSun,
  FiTrash2,
  FiDownload,
  FiAlertTriangle
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import { useAuthStore } from '../stores/authStore';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      browser: true,
      updates: false,
      marketing: false,
    },
    privacy: {
      profileVisibility: 'private',
      noteSharing: 'colleagues',
      activityStatus: true,
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      autoSave: true,
    }
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Load settings on mount
  useEffect(() => {
    // TODO: Load actual user settings from API
    // loadUserSettings();
  }, []);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));

    // TODO: Auto-save setting change to backend
    toast.success('Setting updated');
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // TODO: Implement actual data export API call
      // const data = await exportUserData();

      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Data export completed and downloaded');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion');
      return;
    }

    try {
      // TODO: Implement actual account deletion API call
      // await deleteUserAccount();

      toast.success('Account deletion requested. You will be logged out.');
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Failed to delete account. Please contact support.');
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle_at_20%_20%,rgba(230,126,34,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(230,126,34,0.06),transparent_32%),#0f172a'
      }}
    >
      <Header currentView="settings" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/notes')}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs uppercase tracking-widest">
                Preferences
              </span>
            </div>
            <p className="text-white/70 mt-2">Manage your account preferences and privacy</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Notifications */}
          <SettingsSection
            icon={FiBell}
            title="Notifications"
            description="Control how you receive notifications"
          >
            <div className="space-y-4">
              <SettingToggle
                label="Email notifications"
                description="Receive updates and alerts via email"
                checked={settings.notifications.email}
                onChange={(value) => handleSettingChange('notifications', 'email', value)}
              />
              <SettingToggle
                label="Browser notifications"
                description="Show desktop notifications in your browser"
                checked={settings.notifications.browser}
                onChange={(value) => handleSettingChange('notifications', 'browser', value)}
              />
              <SettingToggle
                label="Product updates"
                description="Get notified about new features and improvements"
                checked={settings.notifications.updates}
                onChange={(value) => handleSettingChange('notifications', 'updates', value)}
              />
              <SettingToggle
                label="Marketing emails"
                description="Receive newsletters and promotional content"
                checked={settings.notifications.marketing}
                onChange={(value) => handleSettingChange('notifications', 'marketing', value)}
              />
            </div>
          </SettingsSection>

          {/* Privacy & Security */}
          <SettingsSection
            icon={FiShield}
            title="Privacy & Security"
            description="Manage your privacy and security settings"
          >
            <div className="space-y-6">
              <SettingSelect
                label="Profile visibility"
                description="Who can see your profile information"
                value={settings.privacy.profileVisibility}
                options={[
                  { value: 'private', label: 'Private (Only you)' },
                  { value: 'colleagues', label: 'Colleagues only' },
                  { value: 'public', label: 'Public' },
                ]}
                onChange={(value) => handleSettingChange('privacy', 'profileVisibility', value)}
              />

              <SettingSelect
                label="Default note sharing"
                description="Default sharing permissions for new notes"
                value={settings.privacy.noteSharing}
                options={[
                  { value: 'private', label: 'Private' },
                  { value: 'colleagues', label: 'Colleagues' },
                  { value: 'team', label: 'Team members' },
                ]}
                onChange={(value) => handleSettingChange('privacy', 'noteSharing', value)}
              />

              <SettingToggle
                label="Show activity status"
                description="Let others see when you're online and active"
                checked={settings.privacy.activityStatus}
                onChange={(value) => handleSettingChange('privacy', 'activityStatus', value)}
              />

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => navigate('/profile')}
                  className="text-orange-200 hover:text-orange-100 font-medium"
                >
                  Change Password →
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* Preferences */}
          <SettingsSection
            icon={FiGlobe}
            title="Preferences"
            description="Customize your experience"
          >
            <div className="space-y-6">
              <SettingSelect
                label="Theme"
                description="Choose your preferred color scheme"
                value={settings.preferences.theme}
                options={[
                  { value: 'dark', label: 'Dark theme', icon: FiMoon },
                  { value: 'light', label: 'Light theme', icon: FiSun },
                  { value: 'auto', label: 'Auto (system)', icon: FiGlobe },
                ]}
                onChange={(value) => handleSettingChange('preferences', 'theme', value)}
              />

              <SettingSelect
                label="Language"
                description="Choose your preferred language"
                value={settings.preferences.language}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                  { value: 'fr', label: 'Français' },
                  { value: 'de', label: 'Deutsch' },
                ]}
                onChange={(value) => handleSettingChange('preferences', 'language', value)}
              />

              <SettingSelect
                label="Timezone"
                description="Your local timezone for timestamps"
                value={settings.preferences.timezone}
                options={[
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/New_York', label: 'Eastern Time' },
                  { value: 'America/Los_Angeles', label: 'Pacific Time' },
                  { value: 'Europe/London', label: 'London' },
                ]}
                onChange={(value) => handleSettingChange('preferences', 'timezone', value)}
              />

              <SettingToggle
                label="Auto-save notes"
                description="Automatically save changes as you type"
                checked={settings.preferences.autoSave}
                onChange={(value) => handleSettingChange('preferences', 'autoSave', value)}
              />
            </div>
          </SettingsSection>

          {/* Data & Account */}
          <SettingsSection
            icon={FiDownload}
            title="Data & Account"
            description="Manage your data and account"
          >
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-white/10 rounded-2xl bg-white/5">
                <div>
                  <h4 className="font-medium text-white">Export your data</h4>
                  <p className="text-sm text-white/70 mt-1">
                    Download a copy of all your notes and data
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-70 text-white shadow-lg shadow-orange-500/20 transition-all"
                >
                  <FiDownload size={16} />
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>

              <div className="p-4 border border-red-500/30 bg-red-900/10 rounded-2xl">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="text-red-400 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-400">Danger Zone</h4>
                    <p className="text-sm text-white/70 mt-1 mb-4">
                      Delete your account and all associated data permanently. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all"
                    >
                      <FiTrash2 size={16} />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white/5 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 border border-red-500/30">
              <div className="flex items-center gap-3 mb-4">
                <FiAlertTriangle className="text-red-400" size={24} />
                <h3 className="text-lg font-semibold text-white">Delete Account</h3>
              </div>

              <p className="text-white/70 mb-6">
                This will permanently delete your account and all your notes. This action cannot be undone.
                Type <strong className="text-white">DELETE</strong> to confirm:
              </p>

              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-4 py-2.5 border border-white/10 rounded-2xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/60 mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-white/10 text-white/80 rounded-full hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE'}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-70 text-white rounded-full transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Setting Components
const SettingsSection = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-lg">
    <div className="p-6 border-b border-white/10">
      <div className="flex items-center gap-3">
        <Icon className="text-orange-300" size={24} />
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-white/70 text-sm">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const SettingToggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <h4 className="font-medium text-white">{label}</h4>
      <p className="text-sm text-white/70">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors border ${
        checked
          ? 'bg-gradient-to-r from-orange-500 to-orange-600 border-orange-400/40'
          : 'bg-white/10 border-white/15'
      }`}
    >
      <div
        className={`absolute w-5 h-5 bg-white rounded-full transition-transform top-0.5 shadow ${
          checked ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

const SettingSelect = ({ label, description, value, options, onChange }) => (
  <div>
    <h4 className="font-medium text-white mb-1">{label}</h4>
    <p className="text-sm text-white/70 mb-3">{description}</p>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border border-white/10 rounded-2xl bg-white/5 text-white/90 focus:outline-none focus:ring-2 focus:ring-orange-500/70 focus:border-transparent"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-slate-900 text-white">
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default SettingsPage;