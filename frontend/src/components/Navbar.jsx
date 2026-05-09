import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  ChevronDown,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const searchInputRef = React.useRef(null);
  const notificationsRef = React.useRef(null);
  const dropdownRef = React.useRef(null);

  // Sample notifications
  const notifications = [
    { id: 1, title: 'Low Stock Alert', message: 'Cricket Bat is running low on stock', time: '2 min ago', read: false },
    { id: 2, title: 'New Issue', message: 'Rahul issued Football Kit', time: '15 min ago', read: false },
    { id: 3, title: 'Return Due', message: 'Volleyball Kit return due tomorrow', time: '1 hour ago', read: true },
    { id: 4, title: 'System Update', message: 'Dashboard analytics updated', time: '3 hours ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    if (showNotifications || showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showDropdown]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/kits?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Keyboard shortcut to focus search
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoutClick = () => {
    setShowDropdown(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    // Simulate a brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    logout();
    setShowLogoutConfirm(false);
    setIsLoggingOut(false);
    navigate('/login');
  };

  return (
    <>
    <header className="h-16 bg-white dark:bg-[#020617] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 transition-colors duration-300">
      {/* Search Bar */}
      <div className="relative w-80">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search kits, users..."
            className="w-full bg-slate-100 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-xl pl-10 pr-24 py-2.5 text-sm text-gray-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery ? (
              <button
                type="button"
                onClick={clearSearch}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            ) : (
              <kbd className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hidden md:block">⌘K</kbd>
            )}
          </div>
        </form>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl z-50 max-h-96 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Notifications</h4>
                  <span className="text-xs text-emerald-500 font-medium">{unreadCount} new</span>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${!notification.read ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{notification.message}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => navigate('/notifications')}
                  className="w-full text-center text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        {isAuthenticated && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'R'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'Rahul Verma'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{isAdmin ? 'Admin' : user?.role || 'Student'}</p>
              </div>
              <ChevronDown size={16} className={`text-slate-500 dark:text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] shadow-2xl z-50 overflow-hidden">
                <div className="p-3">
                  <div className="px-2 py-2 mb-2 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'Rahul Verma'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'rahul@sportkits.com'}</p>
                    <Badge variant={isAdmin ? "default" : "secondary"} className="mt-2 text-xs">
                      {isAdmin ? 'Admin' : user?.role || 'Student'}
                    </Badge>
                  </div>
                  <button
                    onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2 px-2 py-2 text-sm text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { navigate('/admin'); setShowDropdown(false); }}
                      className="w-full flex items-center gap-2 px-2 py-2 text-sm text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User size={16} />
                      Admin Panel
                    </button>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-800 my-1" />
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-500 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 text-center border-b border-gray-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Confirm Logout
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Are you sure you want to log out? You will need to sign in again to access your account.
                </p>
              </div>

              {/* User Info */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-700 shadow-md">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-gray-900 dark:text-white font-medium">{user?.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 flex gap-3">
                <motion.button
                  whileHover={{ scale: isLoggingOut ? 1 : 1.02 }}
                  whileTap={{ scale: isLoggingOut ? 1 : 0.98 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: isLoggingOut ? 1 : 1.02 }}
                  whileTap={{ scale: isLoggingOut ? 1 : 0.98 }}
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut size={18} />
                      Logout
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
