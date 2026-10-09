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
          {/* Security */}
          <SettingsSection
            icon={FiShield}
            title="Security"
            description="Manage your account security"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-white">Account Password</h4>
                  <p className="text-sm text-white/70">Change your password to keep your account secure</p>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-colors"
                >
                  Change Password in Profile →
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* Placeholder */}
          <div className="p-8 border border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <FiGlobe className="text-white/40" size={24} />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">More settings coming soon</h3>
            <p className="text-white/50 max-w-sm">
              We're working on adding more customization options like themes, localization, and notification preferences.
            </p>
          </div>
        </div>
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

export default SettingsPage;