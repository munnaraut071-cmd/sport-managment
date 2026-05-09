import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Moon, Shield, User, Mail, Lock, Save, Check,
  Camera, Eye, EyeOff, Download, Upload, Loader2, RefreshCw,
  Key, Palette, Globe, Trash2
} from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { usersAPI, notificationsAPI } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ---------------- PROFILE ----------------
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    avatar: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Sync user → profile
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  // ---------------- NOTIFICATIONS ----------------
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    lowStockAlerts: true,
    dueDateReminders: false,
    weeklyReports: true,
    systemUpdates: false,
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // ---------------- SECURITY ----------------
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ---------------- APPEARANCE ----------------
  const [appearance, setAppearance] = useState({
    darkMode: true,
    compactView: false,
    animations: true,
    sidebarCollapsed: false,
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, color: 'from-blue-500 to-cyan-500' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-amber-500 to-orange-500' },
    { id: 'appearance', label: 'Appearance', icon: Moon, color: 'from-purple-500 to-pink-500' },
    { id: 'security', label: 'Security', icon: Key, color: 'from-red-500 to-rose-500' },
  ];

  // ---------------- TOAST ----------------
  const showNotification = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    toast({ title: msg, variant: 'success' });
  };

  // ---------------- HANDLERS ----------------
  const handleSaveProfile = async () => {
    if (!user?._id) {
      showNotification('User not loaded');
      return;
    }

    try {
      setProfileLoading(true);
      const res = await usersAPI.update(user._id, {
        name: profile.name,
        phone: profile.phone,
      });

      res.data.success
        ? showNotification('Profile updated!')
        : showNotification('Failed to update');
    } catch {
      showNotification('Error updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const res = await notificationsAPI.updateSettings(notifications);

      res.data.success
        ? showNotification('Saved!')
        : showNotification('Failed');
    } catch {
      showNotification('Error saving');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      return showNotification('Passwords do not match');
    }

    try {
      setPasswordLoading(true);
      const res = await usersAPI.changePassword({
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      });

      res.data.success
        ? showNotification('Password updated')
        : showNotification('Failed');
    } catch {
      showNotification('Error updating password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = () => {
    const data = JSON.stringify({ profile, notifications, appearance });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();

    showNotification('Exported!');
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.profile) setProfile(data.profile);
        if (data.notifications) setNotifications(data.notifications);
        if (data.appearance) setAppearance(data.appearance);
        showNotification('Imported!');
      } catch {
        showNotification('Invalid file');
      }
    };
    reader.readAsText(file);
  };

  // ---------------- UI ----------------
  return (
    <div className="w-full h-full bg-slate-50 dark:bg-transparent">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Check size={18} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Shield size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your account preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white rounded-lg transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/30"
              >
                Save Changes
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <ul className="space-y-3">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <motion.button
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                          : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <tab.icon size={22} />
                      <span className="font-medium">{tab.label}</span>
                    </motion.button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-slate-800 p-8 shadow-sm dark:shadow-none"
              >
              {/* PROFILE */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Profile Settings</h2>
                  
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${profile.name}&background=10b981&color=fff&size=128`}
                        alt="Profile"
                        className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-700 shadow-lg"
                      />
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                      >
                        <Camera size={18} className="text-white" />
                      </motion.button>
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-medium text-lg">{profile.name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{profile.email}</p>
                      <p className="text-emerald-500 dark:text-emerald-400 text-xs mt-1 capitalize">{profile.role}</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2 font-medium">Full Name</label>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2 font-medium">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                          type="email" 
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2 font-medium">Role</label>
                      <input 
                        type="text" 
                        value={profile.role} 
                        disabled 
                        className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2 font-medium">Phone</label>
                      <input 
                        type="tel" 
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-slate-800">
                    <motion.button 
                      onClick={handleSaveProfile}
                      disabled={profileLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 shadow-lg shadow-emerald-500/30"
                    >
                      {profileLoading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Save Changes
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Notification Preferences</h2>
                  <div className="space-y-4 mb-8">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email updates about kit issues and returns', icon: Mail },
                      { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get push notifications in your browser', icon: Bell },
                      { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Get notified when kits are running low', icon: AlertTriangle },
                      { key: 'dueDateReminders', label: 'Due Date Reminders', desc: 'Remind students about upcoming due dates', icon: Clock },
                      { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly usage reports via email', icon: TrendingUp },
                      { key: 'systemUpdates', label: 'System Updates', desc: 'Get notified about new features and updates', icon: Shield },
                    ].map((item, index) => (
                      <motion.div 
                        key={item.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 px-4 -mx-4 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                            <item.icon size={20} className="text-slate-500 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 dark:text-white font-medium">{item.label}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{item.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notifications[item.key]}
                            onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                            className="sr-only peer" 
                          />
                          <div className="w-12 h-7 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-slate-800">
                    <motion.button 
                      onClick={handleSaveNotifications}
                      disabled={notificationsLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 shadow-lg shadow-emerald-500/30"
                    >
                      {notificationsLoading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Save Preferences
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* APPEARANCE */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Appearance</h2>
                  <div className="space-y-4 mb-8">
                    {[
                      { key: 'darkMode', label: 'Dark Mode', desc: 'Always use dark theme', icon: Moon },
                      { key: 'compactView', label: 'Compact View', desc: 'Show more content with less spacing', icon: Eye },
                      { key: 'animations', label: 'Animations', desc: 'Enable smooth animations throughout the app', icon: Palette },
                      { key: 'sidebarCollapsed', label: 'Collapsed Sidebar', desc: 'Keep sidebar collapsed by default', icon: Check },
                    ].map((item, index) => (
                      <motion.div 
                        key={item.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 px-4 -mx-4 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                            <item.icon size={20} className="text-slate-500 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 dark:text-white font-medium">{item.label}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{item.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={appearance[item.key]}
                            onChange={(e) => setAppearance({...appearance, [item.key]: e.target.checked})}
                            className="sr-only peer" 
                          />
                          <div className="w-12 h-7 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-slate-800">
                    <motion.button 
                      onClick={() => {
                        localStorage.setItem('appearance', JSON.stringify(appearance));
                        showNotification('Appearance settings saved!');
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 shadow-lg shadow-emerald-500/30"
                    >
                      <Save size={20} />
                      Save Preferences
                    </motion.button>
                  </div>
                </div>
              )}

              {/* SECURITY - Coming Soon Placeholder */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Security Settings</h2>
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-800">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <Lock size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-medium text-lg">Change Password</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Update your account password</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <input 
                          type="password" 
                          placeholder="Current password"
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                        <input 
                          type="password" 
                          placeholder="New password"
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                        <input 
                          type="password" 
                          placeholder="Confirm new password"
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex justify-end mt-4">
                        <motion.button 
                          onClick={handleChangePassword}
                          disabled={passwordLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          {passwordLoading ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                          Update Password
                        </motion.button>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
                          <Trash2 size={24} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-gray-900 dark:text-white font-medium text-lg">Delete Account</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Permanently delete your account and all data</p>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Delete Account
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}