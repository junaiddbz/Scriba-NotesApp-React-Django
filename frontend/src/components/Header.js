import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import {
  FiPlus,
  FiLogOut,
  FiUser,
  FiSettings,
  FiSearch,
  FiHome,
  FiFolderPlus,
  FiShare2,
  FiTrash2,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { useAuthStore } from '../stores/authStore';

const Header = ({ onOpenSearch, currentView = 'notes' }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    navigate(path);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { icon: FiHome, label: 'Notes', path: '/notes', view: 'notes' },
    { icon: FiFolderPlus, label: 'Workspaces', path: '/workspaces', view: 'workspaces' },
    { icon: FiShare2, label: 'Shared', path: '/shared', view: 'shared' },
    { icon: FiTrash2, label: 'Trash', path: '/trash', view: 'trash' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur border-b border-gray-700/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation('/')}>
            <img src={logo} alt="Scriba" className="w-10 h-10 rounded-lg" />
            <div className="hidden sm:flex flex-col">
              <h1 className="font-bold text-lg text-white">
                Scriba
              </h1>
              <p className="text-xs text-gray-400">
                Notes, simplified.
              </p>
            </div>
          </div>

          {/* Center: Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavButton
                key={item.view}
                icon={item.icon}
                label={item.label}
                active={currentView === item.view}
                onClick={() => handleNavigation(item.path)}
              />
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              ref={mobileMenuRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <FiX className="text-lg text-gray-300" />
              ) : (
                <FiMenu className="text-lg text-gray-300" />
              )}
            </button>

            {/* User Menu (Desktop/Click-based) */}
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                  alt={user?.first_name || 'User avatar'}
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden sm:inline text-sm text-gray-200 font-medium">
                  {user?.first_name}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.email}
                    </p>
                  </div>

                  <button
                    onClick={() => handleNavigation('/profile')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FiUser size={16} /> Profile
                  </button>

                  <button
                    onClick={() => handleNavigation('/settings')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FiSettings size={16} /> Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 border-t border-gray-700"
                  >
                    <FiLogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-gray-800 border-b border-gray-700 shadow-lg z-40">
          <div className="px-4 py-4 space-y-1">
            {/* Navigation Links */}
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.view
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-gray-700 my-2"></div>

            {/* User Info */}
            <div className="px-4 py-3 flex items-center gap-3">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                alt={user?.first_name || 'User avatar'}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="text-sm font-medium text-white">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>

            {/* User Menu Links */}
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiUser size={20} />
              <span>Profile</span>
            </button>

            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiSettings size={20} />
              <span>Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiLogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

const NavButton = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all ${
      active
        ? 'bg-orange-500/15 border-orange-500/60 text-white shadow-sm'
        : 'border-transparent text-gray-300 hover:border-gray-600 hover:bg-gray-800'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    <Icon size={18} /> {label}
  </button>
);

export default Header;