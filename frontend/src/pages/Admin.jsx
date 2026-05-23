import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Package, ArrowUpCircle, ArrowDownCircle, History, Sparkles, Users, Package2, FileText, Brain, Settings, LogOut, MessageCircle, X, Send, Bot, User, Search, Plus, Edit, Trash2, Shield, BarChart3, Bell, Check, Camera, Eye, EyeOff, RefreshCw, Download, Calendar, TrendingUp, PieChart as PieChartIcon, FileSpreadsheet, Printer, ChevronDown, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { usersAPI, kitsAPI, analyticsAPI, transactionsAPI } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const mockUsers = [
  { id: '1', name: 'Aman Sharma', email: 'aman@example.com', role: 'admin', status: 'active', issues: 12 },
  { id: '2', name: 'Priya Shah', email: 'priya@example.com', role: 'user', status: 'active', issues: 8 },
  { id: '3', name: 'Rohit Singh', email: 'rohit@example.com', role: 'staff', status: 'active', issues: 15 },
  { id: '4', name: 'Neha Gupta', email: 'neha@example.com', role: 'user', status: 'inactive', issues: 3 },
  { id: '5', name: 'Kabir Mehta', email: 'kabir@example.com', role: 'user', status: 'active', issues: 5 },
];

const mockKits = [
  { id: '1', name: 'Cricket Bat', category: 'Cricket', quantity: 15, available: 8, status: 'active' },
  { id: '2', name: 'Football', category: 'Football', quantity: 25, available: 12, status: 'active' },
  { id: '3', name: 'Badminton Racket', category: 'Badminton', quantity: 20, available: 5, status: 'low_stock' },
  { id: '4', name: 'Basketball', category: 'Basketball', quantity: 12, available: 10, status: 'active' },
  { id: '5', name: 'Tennis Racket', category: 'Tennis', quantity: 8, available: 6, status: 'active' },
];

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddKit, setShowAddKit] = useState(false);
  const [showEditKit, setShowEditKit] = useState(false);
  const [showDeleteKit, setShowDeleteKit] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState({ type: 'usage', dateRange: 'Last 30 Days', format: 'PDF Document' });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [realUsers, setRealUsers] = useState([]);
  const [realKits, setRealKits] = useState([]);
  const [realTransactions, setRealTransactions] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, kitsRes, txRes] = await Promise.allSettled([
        usersAPI.getAll().catch(() => null),
        kitsAPI.getAll().catch(() => null),
        transactionsAPI.getAll().catch(() => null),
      ]);
      if (usersRes.status === 'fulfilled' && usersRes.value?.data?.success) {
        setRealUsers(usersRes.value.data.data || []);
      }
      if (kitsRes.status === 'fulfilled' && kitsRes.value?.data?.success) {
        setRealKits(kitsRes.value.data.data || []);
      }
      if (txRes.status === 'fulfilled' && txRes.value?.data?.success) {
        setRealTransactions(txRes.value.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };
  const [recentReports, setRecentReports] = useState([
    { name: 'Monthly Usage Report - May 2025', date: 'Generated 2 hours ago', type: 'PDF', size: '2.4 MB', downloaded: true },
    { name: 'Inventory Status Report', date: 'Generated yesterday', type: 'Excel', size: '1.8 MB', downloaded: true },
    { name: 'User Activity Summary', date: 'Generated 3 days ago', type: 'PDF', size: '3.1 MB', downloaded: true },
    { name: 'Financial Summary Q2 2025', date: 'Generated 1 week ago', type: 'Excel', size: '4.2 MB', downloaded: false },
  ]);
  const [viewingReport, setViewingReport] = useState(null);
  const [selectedKit, setSelectedKit] = useState(null);
  const [kits, setKits] = useState(realKits.length > 0 ? realKits : mockKits);

  useEffect(() => {
    if (realKits.length > 0) setKits(realKits);
  }, [realKits]);
  const [newKit, setNewKit] = useState({ name: '', category: 'Cricket', quantity: 1, available: 1, status: 'active' });

  const displayUsers = realUsers.length > 0 ? realUsers : mockUsers;
  const filteredUsers = displayUsers.filter(u =>
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredKits = kits.filter(k => {
    const matchesSearch = k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || k.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Inventory stats
  const inventoryStats = {
    total: kits.reduce((acc, k) => acc + (k.quantity || k.totalQuantity || 0), 0),
    available: kits.reduce((acc, k) => acc + (k.available || k.availableQuantity || 0), 0),
    issued: kits.reduce((acc, k) => acc + ((k.quantity || k.totalQuantity || 0) - (k.available || k.availableQuantity || 0)), 0),
    lowStock: kits.filter(k => (k.available || k.availableQuantity || 0) < 5).length,
  };

  // Overview stats
  const overviewStats = {
    totalUsers: displayUsers.length,
    totalKits: kits.length,
    activeIssues: realTransactions.length > 0 ? realTransactions.filter(t => t.status === 'issued' || t.type === 'issue').length : 67,
    lowStock: inventoryStats.lowStock,
  };

  const StatCard = ({ title, value, icon: Icon, gradient, subtitle }) => (
    <div className={`bg-gradient-to-br ${gradient} p-5 rounded-xl relative overflow-hidden`}>
      <div className="relative z-10">
        <p className="text-white/70 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1 text-white">{value}</p>
        <p className="text-white/50 text-xs mt-1">{subtitle}</p>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'ai-dashboard', label: 'AI Dashboard', icon: Brain },
  ];

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
            <Check size={18} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage users, kits, and system settings</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchAdminData}
          className="bg-white dark:bg-[#111827] hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw size={16} />
          Refresh
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-2 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { title: 'Total Users', value: overviewStats.totalUsers, icon: Users, gradient: 'from-[#064e3b] to-[#065f46]', subtitle: `${displayUsers.filter(u => u.status === 'active').length} active` },
              { title: 'Total Kits', value: overviewStats.totalKits, icon: Package, gradient: 'from-[#1e40af] to-[#1e3a8a]', subtitle: `${inventoryStats.available} available` },
              { title: 'Active Issues', value: overviewStats.activeIssues, icon: BarChart3, gradient: 'from-[#5b21b6] to-[#4c1d95]', subtitle: 'Currently issued' },
              { title: 'Low Stock', value: overviewStats.lowStock, icon: Bell, gradient: 'from-[#92400e] to-[#78350f]', subtitle: 'Need attention' },
            ].map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-br ${stat.gradient} p-5 rounded-xl relative overflow-hidden`}
              >
                <div className="relative z-10">
                  <p className="text-white/70 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1 text-white">{stat.value}</p>
                  <p className="text-white/50 text-xs mt-1">{stat.subtitle}</p>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-5 rounded-xl shadow-sm dark:shadow-none">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { action: 'New kit added', user: 'Admin', time: '2 hours ago', icon: Package },
                  { action: 'User registered', user: 'Aman Sharma', time: '4 hours ago', icon: Users },
                  { action: 'Kit issued', user: 'Priya Shah', time: '5 hours ago', icon: BarChart3 },
                  { action: 'Stock alert triggered', user: 'System', time: '1 day ago', icon: Bell },
                ].map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
                    >
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white text-sm font-medium">{activity.action}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">by {activity.user}</p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-500">{activity.time}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-5 rounded-xl shadow-sm dark:shadow-none">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">System Status</h3>
              <div className="space-y-3">
                {[
                  { service: 'Database', status: 'operational', latency: '45ms' },
                  { service: 'API Server', status: 'operational', latency: '28ms' },
                  { service: 'AI Engine', status: 'operational', latency: '120ms' },
                  { service: 'Notifications', status: 'operational', latency: '15ms' },
                ].map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-gray-900 dark:text-white text-sm">{service.service}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded border border-emerald-200 dark:border-emerald-500/30">
                        {service.status}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{service.latency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-3 bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 px-4 py-3 rounded-lg w-full max-w-md">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-gray-900 dark:text-white text-sm placeholder:text-slate-500"
              />
            </div>
            <button 
              onClick={() => setShowAddUser(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800">
                  <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">User</th>
                  <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Role</th>
                  <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Status</th>
                  <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Issues</th>
                  <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id || user._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{user.name}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : user.role === 'staff'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        user.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white">{user.issues || 0}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-xl">
              <p className="text-emerald-100 text-sm">Total Kits</p>
              <p className="text-3xl font-bold text-white">{inventoryStats.total}</p>
              <p className="text-emerald-200 text-xs">All sports equipment</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl">
              <p className="text-blue-100 text-sm">Available</p>
              <p className="text-3xl font-bold text-white">{inventoryStats.available}</p>
              <p className="text-blue-200 text-xs">Ready to issue</p>
            </div>
            <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-6 rounded-xl">
              <p className="text-amber-100 text-sm">Issued</p>
              <p className="text-3xl font-bold text-white">{inventoryStats.issued}</p>
              <p className="text-amber-200 text-xs">Currently with users</p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-xl">
              <p className="text-red-100 text-sm">Low Stock</p>
              <p className="text-3xl font-bold text-white">{inventoryStats.lowStock}</p>
              <p className="text-red-200 text-xs">Need restocking</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex items-center gap-3 bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 px-4 py-3 rounded-lg w-64">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search kits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none w-full text-gray-900 dark:text-white text-sm placeholder:text-slate-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white dark:bg-[#111827] text-gray-900 dark:text-white px-4 py-3 rounded-lg text-sm border border-gray-200 dark:border-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="all">All Categories</option>
                <option value="cricket">Cricket</option>
                <option value="football">Football</option>
                <option value="badminton">Badminton</option>
                <option value="basketball">Basketball</option>
                <option value="tennis">Tennis</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddKit(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Kit
            </button>
          </div>

          {/* Kits Table */}
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800">
                  <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Kit</th>
                  <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Category</th>
                  <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Stock</th>
                  <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Status</th>
                  <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredKits.map((kit) => (
                  <tr key={kit.id || kit._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-lg">
                          {kit.category === 'Cricket' ? '🏏' :
                           kit.category === 'Football' ? '⚽' :
                           kit.category === 'Badminton' ? '🏸' :
                           kit.category === 'Basketball' ? '🏀' :
                           kit.category === 'Tennis' ? '🎾' :
                           kit.category === 'Hockey' ? '🏒' :
                           kit.category === 'Volleyball' ? '🏐' :
                           kit.category === 'Table Tennis' ? '🏓' :
                           kit.category === 'Gym' ? '🏋️' : '📦'}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">{kit.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs">
                        {kit.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${kit.available < 5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(kit.available / kit.quantity) * 100}%` }}
                          ></div>
                        </div>
                        <span className={kit.available < 5 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {kit.available}/{kit.quantity}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        kit.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                      }`}>
                        {kit.status === 'active' ? 'Active' : 'Low Stock'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedKit(kit); setShowEditKit(true); }}
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedKit(kit); setShowDeleteKit(true); }}
                          className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Quick Download Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: 'Usage Report', desc: 'Monthly kit usage', icon: BarChart3, color: 'emerald', data: `${inventoryStats.issued} issues, ${inventoryStats.available} returns this month` },
              { title: 'User Activity', desc: 'Student participation', icon: Users, color: 'blue', data: `${overviewStats.totalUsers} active users` },
              { title: 'Inventory Status', desc: 'Current stock levels', icon: Package, color: 'amber', data: `${inventoryStats.available} available, ${inventoryStats.issued} issued` },
              { title: 'Financial Summary', desc: 'Revenue & fines', icon: FileSpreadsheet, color: 'purple', data: '₹12,450 total' },
            ].map((report, index) => {
              const Icon = report.icon;
              const colorClasses = {
                emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-200 dark:hover:bg-emerald-500/30',
                blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 hover:bg-blue-200 dark:hover:bg-blue-500/30',
                amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 hover:bg-amber-200 dark:hover:bg-amber-500/30',
                purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30 hover:bg-purple-200 dark:hover:bg-purple-500/30',
              };
              return (
                <div key={index} className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-4 rounded-xl shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[report.color].split(' ')[0]}`}>
                      <Icon className={colorClasses[report.color].split(' ')[1]} size={20} />
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold text-sm">{report.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">{report.desc}</p>
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-500 text-xs mb-3">{report.data}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setToastMessage(`${report.title} downloaded!`); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${colorClasses[report.color]}`}
                    >
                      <Download size={14} className="inline mr-1" />
                      PDF
                    </button>
                    <button 
                      onClick={() => { setToastMessage(`${report.title} printed!`); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }}
                      className="px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg text-xs transition-colors"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Report Generator */}
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-5 rounded-xl shadow-sm dark:shadow-none">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
              <PieChartIcon size={18} className="text-emerald-500 dark:text-emerald-400" />
              Generate Custom Report
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Report Type</label>
                <select 
                  value={selectedReport?.type || 'usage'}
                  onChange={(e) => setSelectedReport({...selectedReport, type: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="usage">Usage Statistics</option>
                  <option value="users">User Activity</option>
                  <option value="inventory">Inventory Status</option>
                  <option value="financial">Financial Summary</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Date Range</label>
                <select 
                  value={selectedReport.dateRange}
                  onChange={(e) => setSelectedReport({...selectedReport, dateRange: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>Custom Range</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Format</label>
                <select 
                  value={selectedReport.format}
                  onChange={(e) => setSelectedReport({...selectedReport, format: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option>PDF Document</option>
                  <option>Excel Spreadsheet</option>
                  <option>CSV File</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={() => {
                    setGeneratingReport(true);
                    setTimeout(() => {
                      const reportTypeNames = {
                        'usage': 'Usage Statistics Report',
                        'users': 'User Activity Report',
                        'inventory': 'Inventory Status Report',
                        'financial': 'Financial Summary Report'
                      };
                      const newReport = {
                        name: `${reportTypeNames[selectedReport.type]} - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
                        date: 'Generated just now',
                        type: selectedReport.format === 'PDF Document' ? 'PDF' : selectedReport.format === 'Excel Spreadsheet' ? 'Excel' : 'CSV',
                        size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
                        downloaded: false
                      };
                      setRecentReports([newReport, ...recentReports]);
                      setGeneratingReport(false);
                      setToastMessage('Report generated successfully!');
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }, 2000);
                  }}
                  disabled={generatingReport}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {generatingReport ? (
                    <><RefreshCw size={18} className="animate-spin" /> Generating...</>
                  ) : (
                    <><TrendingUp size={18} /> Generate Report</>
                  )}
                </button>
              </div>
            </div>

            {/* Report Preview Section */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-gray-900 dark:text-white font-medium text-sm">Report Preview</h4>
                <span className="text-xs text-slate-500 dark:text-slate-500">Last updated: Just now</span>
              </div>
              
              {/* Sample Chart */}
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Cricket', issued: 45, returned: 38 },
                    { name: 'Football', issued: 32, returned: 28 },
                    { name: 'Badminton', issued: 28, returned: 25 },
                    { name: 'Basketball', issued: 18, returned: 15 },
                    { name: 'Tennis', issued: 12, returned: 10 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="issued" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="returned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{inventoryStats.issued}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Total Issues</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inventoryStats.available}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Total Returns</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{overviewStats.totalUsers}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Active Users</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{overviewStats.lowStock}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-5 rounded-xl shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-semibold">Recently Generated Reports</h3>
              <button 
                onClick={() => { setRecentReports([]); setToastMessage('History cleared!'); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear History
              </button>
            </div>
            <div className="space-y-2">
              {recentReports.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-500">
                  <FileText size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No reports generated yet</p>
                  <p className="text-xs">Generate your first report above</p>
                </div>
              ) : (
                recentReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        report.type === 'PDF' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-emerald-100 dark:bg-emerald-500/20'
                      }`}>
                        <FileText size={18} className={report.type === 'PDF' ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'} />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium text-sm flex items-center gap-2">
                          {report.name}
                          {report.downloaded && <Check size={12} className="text-emerald-500 dark:text-emerald-400" />}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">{report.date} • {report.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setViewingReport(report); }}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => { 
                          const updated = [...recentReports];
                          updated[index].downloaded = true;
                          setRecentReports(updated);
                          setToastMessage('Report downloaded!'); 
                          setShowToast(true); 
                          setTimeout(() => setShowToast(false), 3000); 
                        }}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => { setToastMessage('Report sent to printer!'); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                        title="Print"
                      >
                        <Printer size={16} />
                      </button>
                      <button 
                        onClick={() => { 
                          setRecentReports(recentReports.filter((_, i) => i !== index));
                          setToastMessage('Report removed from list'); 
                          setShowToast(true); 
                          setTimeout(() => setShowToast(false), 3000); 
                        }}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Dashboard Tab */}
      {activeTab === 'ai-dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Brain className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Predictions</h3>
                  <p className="text-emerald-200 text-sm">Active</p>
                </div>
              </div>
              <p className="text-emerald-100 text-sm">AI is analyzing usage patterns to predict future demand.</p>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-6 rounded-xl shadow-sm dark:shadow-none">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Bell className="text-amber-600 dark:text-amber-400" size={20} />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold">Anomaly Alerts</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">3 detected</p>
                </div>
              </div>
              <button className="w-full bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-200 dark:border-amber-500/30">
                View Details
              </button>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-6 rounded-xl shadow-sm dark:shadow-none">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Package className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold">Maintenance</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">5 kits scheduled</p>
                </div>
              </div>
              <button className="w-full bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-200 dark:border-blue-500/30">
                View Schedule
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-6 rounded-xl shadow-sm dark:shadow-none">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">AI Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 dark:text-emerald-400">💡</span>
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">High Demand Predicted</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Cricket kits demand will increase by 40% in June due to upcoming tournaments. Consider adding 15 more kits.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">Unusual Return Pattern</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Football kits are being returned late 30% more often than usual. Consider sending reminder notifications.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400">📊</span>
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">Usage Trend</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Overall kit usage has increased by 25% this month compared to last month.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#111827] p-6 rounded-xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Add New User</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Create a new user account</p>
            <div className="space-y-4">
              <input type="text" placeholder="Full Name" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <input type="email" placeholder="Email" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <select className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500">
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <input type="password" placeholder="Password" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium transition-colors">
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Kit Modal */}
      {showAddKit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#111827] p-6 rounded-xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Add New Kit</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Add a new sports kit to inventory</p>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Kit Name</label>
                <input 
                  type="text" 
                  value={newKit.name}
                  onChange={(e) => setNewKit({...newKit, name: e.target.value})}
                  placeholder="e.g., Cricket Bat" 
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Category</label>
                <select 
                  value={newKit.category}
                  onChange={(e) => setNewKit({...newKit, category: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Total Quantity</label>
                  <input 
                    type="number" 
                    value={newKit.quantity}
                    onChange={(e) => setNewKit({...newKit, quantity: parseInt(e.target.value) || 0, available: parseInt(e.target.value) || 0})}
                    placeholder="10" 
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Available</label>
                  <input 
                    type="number" 
                    value={newKit.available}
                    onChange={(e) => setNewKit({...newKit, available: parseInt(e.target.value) || 0})}
                    placeholder="10" 
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setShowAddKit(false); setNewKit({ name: '', category: 'Cricket', quantity: 1, available: 1, status: 'active' }); }}
                  className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (newKit.name) {
                      const kitToAdd = {
                        ...newKit,
                        id: String(kits.length + 1),
                        status: newKit.available < 5 ? 'low_stock' : 'active'
                      };
                      setKits([...kits, kitToAdd]);
                      setToastMessage('Kit added successfully!');
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                      setShowAddKit(false);
                      setNewKit({ name: '', category: 'Cricket', quantity: 1, available: 1, status: 'active' });
                    }
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Add Kit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Kit Modal */}
      {showEditKit && selectedKit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#111827] p-6 rounded-xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Edit Kit</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Update kit details</p>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Kit Name</label>
                <input 
                  type="text" 
                  value={selectedKit.name}
                  onChange={(e) => setSelectedKit({...selectedKit, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Category</label>
                <select 
                  value={selectedKit.category}
                  onChange={(e) => setSelectedKit({...selectedKit, category: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Total Quantity</label>
                  <input 
                    type="number" 
                    value={selectedKit.quantity}
                    onChange={(e) => setSelectedKit({...selectedKit, quantity: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Available</label>
                  <input 
                    type="number" 
                    value={selectedKit.available}
                    onChange={(e) => setSelectedKit({...selectedKit, available: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setShowEditKit(false); setSelectedKit(null); }}
                  className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const updatedKitData = {
                        ...selectedKit,
                        status: selectedKit.available < 5 ? 'low_stock' : 'active'
                      };
                      await kitsAPI.update(selectedKit._id || selectedKit.id, updatedKitData);
                      setKits(kits.map(k => (k._id === selectedKit._id || k.id === selectedKit.id) ? updatedKitData : k));
                      setToastMessage('Kit updated successfully!');
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                      setShowEditKit(false);
                      setSelectedKit(null);
                    } catch (error) {
                      console.error('Update failed:', error);
                      setToastMessage('Update failed!');
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Kit Modal */}
      {showDeleteKit && selectedKit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#111827] p-6 rounded-xl w-full max-w-sm border border-gray-200 dark:border-slate-800 shadow-xl text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500 dark:text-red-400" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Delete Kit?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Are you sure you want to delete <span className="text-gray-900 dark:text-white font-medium">{selectedKit.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowDeleteKit(false); setSelectedKit(null); }}
                className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await kitsAPI.delete(selectedKit._id || selectedKit.id);
                    setKits(kits.filter(k => (k._id !== selectedKit._id && k.id !== selectedKit.id)));
                    setToastMessage('Kit deleted successfully!');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                    setShowDeleteKit(false);
                    setSelectedKit(null);
                  } catch (error) {
                    console.error('Delete failed:', error);
                    setToastMessage('Delete failed!');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-800 shadow-xl">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  viewingReport.type === 'PDF' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-emerald-100 dark:bg-emerald-500/20'
                }`}>
                  <FileText size={20} className={viewingReport.type === 'PDF' ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{viewingReport.name}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{viewingReport.date} • {viewingReport.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { 
                    const index = recentReports.findIndex(r => r.name === viewingReport.name);
                    if (index >= 0) {
                      const updated = [...recentReports];
                      updated[index].downloaded = true;
                      setRecentReports(updated);
                    }
                    setToastMessage('Report downloaded!'); 
                    setShowToast(true); 
                    setTimeout(() => setShowToast(false), 3000); 
                  }}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button 
                  onClick={() => { setToastMessage('Report sent to printer!'); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                  title="Print"
                >
                  <Printer size={18} />
                </button>
                <button 
                  onClick={() => setViewingReport(null)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {/* Report Content */}
            <div className="p-6 space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{inventoryStats.issued}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Total Issues</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inventoryStats.available}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Total Returns</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{overviewStats.totalUsers}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Active Users</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{overviewStats.lowStock}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Pending</p>
                </div>
              </div>
              
              {/* Chart */}
              <div className="bg-gray-50 dark:bg-slate-800/30 p-4 rounded-xl">
                <h3 className="text-gray-900 dark:text-white font-medium mb-4">Usage Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Cricket', issued: 45, returned: 38 },
                      { name: 'Football', issued: 32, returned: 28 },
                      { name: 'Badminton', issued: 28, returned: 25 },
                      { name: 'Basketball', issued: 18, returned: 15 },
                      { name: 'Tennis', issued: 12, returned: 10 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="issued" fill="#22c55e" radius={[4, 4, 0, 0]} name="Issued" />
                      <Bar dataKey="returned" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Returned" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Report Details */}
              <div className="bg-gray-50 dark:bg-slate-800/30 p-4 rounded-xl">
                <h3 className="text-gray-900 dark:text-white font-medium mb-3">Report Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400">Report Type</span>
                    <span className="text-gray-900 dark:text-white">{viewingReport.name.split(' - ')[0]}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400">Generated On</span>
                    <span className="text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400">File Format</span>
                    <span className="text-gray-900 dark:text-white">{viewingReport.type}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500 dark:text-slate-400">File Size</span>
                    <span className="text-gray-900 dark:text-white">{viewingReport.size}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
