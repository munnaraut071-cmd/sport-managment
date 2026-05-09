import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid3X3, List, Plus, QrCode, Package, ArrowUpCircle, ArrowDownCircle, CheckCircle, X, User, Calendar, Minus, Check, Edit, Trash2, Eye, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { kitsAPI, analyticsAPI, transactionsAPI } from '@/services/api';
import { useSearchParams } from 'react-router-dom';

const categories = [
  { name: 'All Kits', icon: LayoutGrid, value: 'All' },
  { name: 'Cricket', icon: '🏏', value: 'Cricket' },
  { name: 'Football', icon: '⚽', value: 'Football' },
  { name: 'Badminton', icon: '🏸', value: 'Badminton' },
  { name: 'Basketball', icon: '🏀', value: 'Basketball' },
  { name: 'Tennis', icon: '🎾', value: 'Tennis' },
  { name: 'Hockey', icon: '🏒', value: 'Hockey' },
  { name: 'Volleyball', icon: '🏐', value: 'Volleyball' },
  { name: 'Table Tennis', icon: '🏓', value: 'Table Tennis' }
];

const Kits = () => {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [kits, setKits] = useState([]);
  const [filteredKits, setFilteredKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedKit, setSelectedKit] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [dueDays, setDueDays] = useState(7);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newKit, setNewKit] = useState({
    name: '',
    category: 'Cricket',
    quantity: 0,
    available: 0,
    description: '',
    emoji: '🏏'
  });
  const [statistics, setStatistics] = useState({
    totalKits: 0,
    totalAvailable: 0,
    totalIssued: 0,
    lowStockCount: 0
  });

  // Handle URL search parameter from navbar
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchStatistics = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      const data = response.data?.data || response.data;
      // API returns data in data.counts object
      if (data?.counts) {
        setStatistics({
          totalKits: data.counts.totalKits || 0,
          totalAvailable: data.counts.availableKits || 0,
          totalIssued: data.counts.issuedKits || 0,
          lowStockCount: data.counts.lowStockCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchKits();
    fetchStatistics();
  }, []);

  const fetchKits = async () => {
    try {
      setLoading(true);
      const response = await kitsAPI.getAll();
      if (response.data.success) {
        setKits(response.data.data);
        setFilteredKits(response.data.data);
      } else {
        showNotification('Error loading kits');
        setKits([]);
        setFilteredKits([]);
      }
    } catch (error) {
      console.error('Error fetching kits:', error);
      showNotification('Error loading kits');
      setKits([]);
      setFilteredKits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = kits.filter(kit => {
      const matchesSearch = kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           kit.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || kit.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredKits(filtered);
  }, [kits, searchQuery, selectedCategory]);

  // Helper function to get emoji by category
  const getKitEmoji = (kit) => {
    // If kit has its own emoji, use it
    if (kit.emoji) return kit.emoji;
    
    // Otherwise use category-based emoji
    const emojis = {
      'Cricket': '🏏',
      'Football': '⚽',
      'Badminton': '🏸',
      'Basketball': '🏀',
      'Tennis': '🎾',
      'Hockey': '🏒',
      'Volleyball': '🏐',
      'Table Tennis': '🏓',
      'Other': '📦'
    };
    return emojis[kit.category] || '📦';
  };

  const handleIssue = (kit) => {
    setSelectedKit(kit);
    setShowIssueModal(true);
    setQuantity(1);
    setDueDays(7);
    setStudentName('');
  };

  const handleReturn = async (kit) => {
    try {
      const response = await transactionsAPI.create({
        kit: kit._id,
        type: 'return',
        quantity: 1
      });

      if (response.data.success) {
        showNotification(`${kit.name} returned successfully!`);
        fetchKits();
        fetchStatistics();
      } else {
        showNotification(response.data.message || 'Failed to return kit');
      }
    } catch (error) {
      console.error('Error returning kit:', error);
      showNotification('Error returning kit');
    }
  };

  const handleDeleteKit = async (kitId) => {
    if (!window.confirm('Are you sure you want to delete this kit?')) {
      return;
    }

    try {
      const response = await kitsAPI.delete(kitId);
      
      if (response.data.success) {
        // Refresh kits and statistics
        await fetchKits();
        await fetchStatistics();
        showNotification('Kit deleted successfully!');
      } else {
        showNotification('Failed to delete kit');
      }
    } catch (error) {
      console.error('Error deleting kit:', error);
      showNotification('Error deleting kit');
    }
  };

  const handleEditKit = async (kitId, updatedData) => {
    try {
      const response = await kitsAPI.update(kitId, updatedData);
      
      if (response.data.success) {
        // Refresh kits and statistics
        await fetchKits();
        await fetchStatistics();
        showNotification('Kit updated successfully!');
      } else {
        showNotification('Failed to update kit');
      }
    } catch (error) {
      console.error('Error updating kit:', error);
      showNotification('Error updating kit');
    }
  };

  const handleConfirmIssue = async () => {
    if (!studentName.trim()) {
      showNotification('Please enter student name!');
      return;
    }
    if (quantity > selectedKit.available) {
      showNotification('Not enough kits available!');
      return;
    }

    try {
      setIssuing(true);
      const response = await transactionsAPI.issueKit({
        kit: selectedKit._id,
        issuedTo: studentName.trim(),
        quantity: quantity,
        expectedReturnDate: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString()
      });

      if (response.data.success) {
        // Refresh kits and statistics
        await fetchKits();
        await fetchStatistics();
        setIssuing(false);
        setShowIssueModal(false);
        setStudentName('');
        setQuantity(1);
        setDueDays(7);
        showNotification(`${quantity} ${selectedKit.name}(s) issued to ${studentName} successfully!`);
      } else {
        showNotification(response.data.message || 'Failed to issue kit');
        setIssuing(false);
      }
    } catch (error) {
      console.error('Error issuing kit:', error);
      const errorMessage = error.response?.data?.message || 'Error issuing kit';
      showNotification(errorMessage);
      setIssuing(false);
    }
  };

  const handleAddKit = async () => {
    if (!newKit.name || !newKit.category || !newKit.quantity || !newKit.available) {
      showNotification('Please fill all required fields!');
      return;
    }

    try {
      setAdding(true);
      const response = await kitsAPI.create(newKit);
      
      if (response.data.success) {
        // Refresh kits and statistics
        await fetchKits();
        await fetchStatistics();
        setShowAddModal(false);
        setNewKit({
          name: '',
          category: 'Cricket',
          quantity: 0,
          available: 0,
          description: '',
          emoji: '🏏'
        });
        showNotification('Kit added successfully!');
      } else {
        showNotification('Failed to add kit');
      }
    } catch (error) {
      console.error('Error adding kit:', error);
      showNotification('Error adding kit');
    } finally {
      setAdding(false);
    }
  };

  const handleQRScan = (decodedText) => {
    try {
      const data = JSON.parse(decodedText);
      const kit = kits.find(k => k._id === data.kitId);
      if (kit) {
        handleIssue(kit);
        setShowQRScanner(false);
      }
    } catch (error) {
      console.error('Invalid QR code');
    }
  };

  return (
    <div className="w-full h-full space-y-8">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle size={18} />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Package size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sports Kits</h1>
            <p className="text-slate-600 dark:text-slate-400">Browse and manage available equipment</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQRScanner(true)}
            className="bg-gray-100 dark:bg-[#111827] hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <QrCode size={18} />
            Scan QR
          </button>
          {isAdmin && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/30"
            >
              <Plus size={18} />
              Add Kit
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search kits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-slate-800 rounded-lg px-10 py-2.5 text-gray-900 dark:text-white appearance-none focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.name}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="flex border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-500' : 'hover:bg-gray-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'} transition-colors`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-500' : 'hover:bg-gray-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'} transition-colors`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          <span className="ml-3 text-slate-400">Loading kits...</span>
        </div>
      )}

      {/* Category Tags */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isEmoji = typeof Icon === 'string';
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all flex items-center gap-2 ${
                selectedCategory === cat.value
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white dark:bg-[#111827] hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-400 border border-gray-200 dark:border-slate-800'
              }`}
            >
              {isEmoji ? (
                <span className="text-base">{Icon}</span>
              ) : (
                <Icon size={14} />
              )}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600 dark:text-slate-400 text-sm">Total Kits</span>
            <Package className="text-emerald-500 dark:text-emerald-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{statistics.totalKits}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">All equipment</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600 dark:text-slate-400 text-sm">Available</span>
            <CheckCircle className="text-emerald-500 dark:text-emerald-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">
            {statistics.totalAvailable}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Ready to issue</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600 dark:text-slate-400 text-sm">Issued</span>
            <ArrowUpCircle className="text-blue-500 dark:text-blue-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-blue-500 dark:text-blue-400">
            {statistics.totalIssued}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Currently out</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600 dark:text-slate-400 text-sm">Low Stock</span>
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-3xl font-bold text-amber-500 dark:text-amber-400">
            {statistics.lowStockCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Need attention</p>
        </motion.div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-slate-400">
        Showing {filteredKits.length} of {kits.length} kits
      </p>

      {/* Kits Grid/List */}
      <AnimatePresence mode="popLayout">
        <motion.div
          layout
          className={`gap-6 ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'flex flex-col'
          }`}
        >
          {filteredKits.map((kit, index) => (
            <motion.div
              key={kit._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {viewMode === 'grid' ? (
                /* Grid Card */
                <div className="bg-[#111827] rounded-xl border border-slate-800 p-7 hover:border-emerald-500/50 transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-3xl">{getKitEmoji(kit)}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded border ${
                      kit.available > 5 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : kit.available > 0
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {kit.available} Available
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{kit.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{kit.category}</p>
                  <p className="text-slate-500 text-xs mb-4 line-clamp-2">{kit.description}</p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleIssue(kit)}
                      disabled={kit.available === 0}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Issue
                    </button>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            const newQuantity = prompt('Enter new quantity:', kit.quantity);
                            const newAvailable = prompt('Enter new available:', kit.available);
                            if (newQuantity && newAvailable) {
                              handleEditKit(kit._id, {
                                ...kit,
                                quantity: parseInt(newQuantity),
                                available: parseInt(newAvailable)
                              });
                            }
                          }}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                          title="Edit Kit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteKit(kit._id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="Delete Kit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* List View */
                <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 hover:border-emerald-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-3xl">{getKitEmoji(kit)}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{kit.name}</h3>
                        <p className="text-slate-400 text-sm">{kit.category} • {kit.available}/{kit.quantity} available</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleIssue(kit)}
                        disabled={kit.available === 0}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <ArrowUpCircle size={16} />
                        Issue
                      </button>
                      <button 
                        onClick={() => handleReturn(kit)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <ArrowDownCircle size={16} />
                        Return
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredKits.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="text-emerald-400" size={32} />
          </div>
          <h3 className="text-white font-semibold mb-1">No kits found</h3>
          <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-xl w-full max-w-md border border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Scan Kit QR Code</h2>
              <button 
                onClick={() => setShowQRScanner(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {/* Simulated QR Scanner */}
              <div className="aspect-square bg-black rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-0 border-2 border-emerald-500 rounded-lg animate-pulse"></div>
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-pulse"></div>
                <div className="absolute top-0 left-1/2 h-full w-0.5 bg-red-500 animate-pulse"></div>
                <div className="text-center z-10">
                  <QrCode className="text-emerald-400 mx-auto mb-2 animate-pulse" size={64} />
                  <p className="text-emerald-400 text-sm">Scanning...</p>
                </div>
              </div>
              
              {/* Kit Selection for Demo */}
              <div className="space-y-2">
                <p className="text-slate-400 text-sm mb-2">Select a kit to simulate QR scan:</p>
                <div className="grid grid-cols-2 gap-2">
                  {kits.slice(0, 4).map(kit => (
                    <button
                      key={kit._id}
                      onClick={() => {
                        handleQRScan(JSON.stringify({ kitId: kit._id }));
                        showNotification(`QR Scanned: ${kit.name}`);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm flex items-center gap-2 transition-colors"
                    >
                      <span className="text-lg">{getKitEmoji(kit)}</span>
                      {kit.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => setShowQRScanner(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    // Simulate successful scan with first available kit
                    const availableKit = kits.find(k => k.available > 0);
                    if (availableKit) {
                      handleQRScan(JSON.stringify({ kitId: availableKit._id }));
                      showNotification(`QR Scanned: ${availableKit.name}`);
                    } else {
                      showNotification('No kits available for scanning');
                    }
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Simulate Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && selectedKit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-xl w-full max-w-md border border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Issue {selectedKit.name}</h2>
                <p className="text-slate-400 text-sm">{selectedKit.available} units available</p>
              </div>
              <button 
                onClick={() => setShowIssueModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Student Name */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Student Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student name..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Minus size={18} className="text-white" />
                  </button>
                  <span className="w-12 text-center text-white font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedKit.available, quantity + 1))}
                    disabled={quantity >= selectedKit.available}
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Plus size={18} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Due Date</label>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-400" />
                  <select
                    value={dueDays}
                    onChange={(e) => setDueDays(parseInt(e.target.value))}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={3}>3 Days</option>
                    <option value={5}>5 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  Due: {new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowIssueModal(false);
                    setStudentName('');
                    setQuantity(1);
                  }}
                  disabled={issuing}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmIssue}
                  disabled={issuing || !studentName.trim()}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {issuing ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                  ) : (
                    <><Check size={18} /> Confirm Issue</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Kit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-xl w-full max-w-md border border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add New Kit</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Kit Name */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Kit Name</label>
                <input
                  type="text"
                  value={newKit.name}
                  onChange={(e) => setNewKit({...newKit, name: e.target.value})}
                  placeholder="Enter kit name..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Category</label>
                <select
                  value={newKit.category}
                  onChange={(e) => setNewKit({...newKit, category: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Hockey">Hockey</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Table Tennis">Table Tennis</option>
                </select>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Total Quantity</label>
                  <input
                    type="number"
                    value={newKit.quantity}
                    onChange={(e) => setNewKit({...newKit, quantity: parseInt(e.target.value) || 0})}
                    placeholder="Total quantity..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Available</label>
                  <input
                    type="number"
                    value={newKit.available}
                    onChange={(e) => setNewKit({...newKit, available: parseInt(e.target.value) || 0})}
                    placeholder="Available quantity..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Description</label>
                <textarea
                  value={newKit.description}
                  onChange={(e) => setNewKit({...newKit, description: e.target.value})}
                  placeholder="Kit description..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Emoji */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Sport Emoji</label>
                <select
                  value={newKit.emoji}
                  onChange={(e) => setNewKit({...newKit, emoji: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="🏏">🏏 Cricket</option>
                  <option value="⚽">⚽ Football</option>
                  <option value="🏸">🏸 Badminton</option>
                  <option value="🏀">🏀 Basketball</option>
                  <option value="🎾">🎾 Tennis</option>
                  <option value="🏑">🏑 Hockey</option>
                  <option value="🏐">🏐 Volleyball</option>
                  <option value="🏓">🏓 Table Tennis</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewKit({
                      name: '',
                      category: 'Cricket',
                      quantity: 0,
                      available: 0,
                      description: '',
                      emoji: '🏏'
                    });
                  }}
                  disabled={adding}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddKit}
                  disabled={adding || !newKit.name.trim()}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding...</>
                  ) : (
                    <><Plus size={18} /> Add Kit</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kits;
