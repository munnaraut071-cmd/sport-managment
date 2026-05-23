import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  X, 
  Trash2, 
  Settings, 
  Search, 
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Package,
  Users,
  Calendar,
  TrendingUp,
  Zap,
  ChevronDown,
  Archive,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { notificationsAPI } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const NotificationsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.getAll();
      if (res.data.success) {
        setNotifications(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({ title: 'Error', description: 'Failed to load notifications', variant: 'destructive' });
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    pushNotifications: true,
    lowStockAlerts: true,
    overdueReminders: true,
    aiInsights: true,
    systemUpdates: false,
    marketingEmails: false,
    weeklyDigest: true
  });

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await notificationsAPI.getSettings();
        if (res.data.success) {
          setNotificationSettings(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (error) {
        console.error('Failed to load notification settings');
      }
    };
    loadSettings();
  }, []);

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    toast({ title: message, variant: 'success' });
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, status: 'read' } : n
      ));
      showNotification('Marked as read');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to mark as read', variant: 'destructive' });
    }
  };

  const handleMarkAsUnread = async (id) => {
    try {
      await notificationsAPI.markAsUnread(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, status: 'unread' } : n
      ));
      showNotification('Marked as unread');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to mark as unread', variant: 'destructive' });
    }
  };

  const handleArchive = async (id) => {
    try {
      await notificationsAPI.archive(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, status: 'archived' } : n
      ));
      showNotification('Notification archived');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to archive', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
      showNotification('Notification deleted');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => 
        n.status === 'unread' ? { ...n, status: 'read' } : n
      ));
      showNotification('All notifications marked as read');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to mark all as read', variant: 'destructive' });
    }
  };

  const handleAction = (notification) => {
    showNotification(`Action: ${notification.action}`);
  };

  const handleSettingChange = (setting, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    showNotification(`${setting} ${value ? 'enabled' : 'disabled'}`);
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const notificationStats = {
    total: notifications.length,
    unread: unreadCount,
    read: notifications.filter(n => n.status === 'read').length,
    archived: notifications.filter(n => n.status === 'archived').length
  };

  const getNotificationIcon = (type) => {
    const icons = {
      alert: AlertTriangle,
      info: Info,
      warning: Clock,
      success: CheckCircle
    };
    return icons[type] || Info;
  };

  const getNotificationColor = (type) => {
    const colors = {
      alert: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20',
      info: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20',
      warning: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20',
      success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20'
    };
    return colors[type] || colors.info;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
    </div>
  );

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
            <CheckCircle size={18} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your notifications and alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchNotifications}
            className="bg-white dark:bg-[#111827] hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="bg-white dark:bg-[#111827] hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <CheckCircle size={18} />
            Mark All Read
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSettings(true)}
            className="bg-white dark:bg-[#111827] hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Settings size={18} />
            Settings
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total', value: notificationStats.total, icon: Bell, color: 'from-slate-500 to-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' },
          { title: 'Unread', value: notificationStats.unread, icon: AlertTriangle, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-500/20', iconColor: 'text-amber-600 dark:text-amber-400' },
          { title: 'Read', value: notificationStats.read, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { title: 'Archived', value: notificationStats.archived, icon: Archive, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{stat.title}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
              </div>
              <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={stat.iconColor} size={26} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm dark:shadow-none"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 rounded-lg px-10 py-2.5 text-gray-900 dark:text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors shadow-sm dark:shadow-none"
            >
              <option value="all">All Types</option>
              <option value="alert">Alerts</option>
              <option value="info">Info</option>
              <option value="warning">Warnings</option>
              <option value="success">Success</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 rounded-lg px-10 py-2.5 text-gray-900 dark:text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors shadow-sm dark:shadow-none"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notifications</h2>
          <span className="text-slate-500 dark:text-slate-400 text-sm">{filteredNotifications.length} notifications</span>
        </div>
        <AnimatePresence mode="popLayout">
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-1">No notifications found</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Try adjusting your search or filters</p>
              </motion.div>
            ) : (
              filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                      notification.status === 'unread' ? 'bg-gray-50/50 dark:bg-slate-800/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className={`font-medium ${notification.status === 'unread' ? 'text-gray-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-500">{notification.time}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{notification.message}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleAction(notification)}
                            className="text-emerald-600 dark:text-emerald-400 text-sm hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors font-medium"
                          >
                            {notification.action}
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          {notification.status === 'unread' ? (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-slate-500 dark:text-slate-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              Mark as read
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsUnread(notification.id)}
                              className="text-slate-500 dark:text-slate-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              Mark as unread
                            </button>
                          )}
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <button
                            onClick={() => handleArchive(notification.id)}
                            className="text-slate-500 dark:text-slate-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            Archive
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="text-red-500 dark:text-red-400 text-sm hover:text-red-600 dark:hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#111827] rounded-xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-xl"
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  {[
                    { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive notifications via email' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                    { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Alert when kits run low' },
                    { key: 'overdueReminders', label: 'Overdue Reminders', desc: 'Remind about overdue returns' },
                    { key: 'aiInsights', label: 'AI Insights', desc: 'AI-powered recommendations' },
                    { key: 'systemUpdates', label: 'System Updates', desc: 'System maintenance notifications' },
                    { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotional emails' },
                    { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary email' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{setting.label}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">{setting.desc}</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange(setting.key, !notificationSettings[setting.key])}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notificationSettings[setting.key] ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notificationSettings[setting.key] ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white py-2.5 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      showNotification('Settings saved successfully!');
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPage;
