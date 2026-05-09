import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, User, CheckCircle, 
  Minus, Plus, Calendar, Clock, ArrowRight,
  Box, Loader2, Sparkles
} from "lucide-react";
import { kitsAPI, transactionsAPI, usersAPI } from '@/services/api';

export default function Issue() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedKit, setSelectedKit] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [dueDays, setDueDays] = useState(7);
  const [availableKits, setAvailableKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentlyIssued, setRecentlyIssued] = useState([]);

  useEffect(() => {
    fetchKits();
  }, []);

  const fetchKits = async () => {
    try {
      setLoading(true);
      const response = await kitsAPI.getAll();
      if (response.data.success) {
        // Filter only kits with available quantity > 0
        const availableOnly = response.data.data.filter(kit => kit.available > 0);
        setAvailableKits(availableOnly);
      } else {
        showNotification('Error loading kits');
      }
    } catch (error) {
      console.error('Error fetching kits:', error);
      showNotification('Error loading kits');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleIssue = async () => {
    if (!studentName.trim()) {
      showNotification('Please enter student name!');
      return;
    }

    if (!selectedKit) {
      showNotification('Please select a kit!');
      return;
    }

    if (quantity > selectedKit.available) {
      showNotification(`Only ${selectedKit.available} kits available!`);
      return;
    }

    try {
      setIssuing(true);
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);
      
      let userId = null;
      try {
        const usersResponse = await usersAPI.getAll({ search: studentName });
        if (usersResponse.data.success && usersResponse.data.data.length > 0) {
          userId = usersResponse.data.data[0]._id;
        }
      } catch (e) {
        console.log('User lookup failed');
      }

      const issueData = {
        kit: selectedKit._id,
        quantity: quantity,
        dueDate: dueDate.toISOString(),
        notes: `Issued to: ${studentName}`,
        userId: userId || null,
        issuedTo: studentName
      };

      const response = await transactionsAPI.issueKit(issueData);

      if (response.data.success) {
        showNotification(`Successfully issued ${selectedKit.name} to ${studentName}`);
        // Add to recently issued
        setRecentlyIssued(prev => [{
          kitName: selectedKit.name,
          studentName,
          quantity,
          dueDate: getDueDate(),
          time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 5));
        setStudentName('');
        setQuantity(1);
        setDueDays(7);
        setSelectedKit(null);
        fetchKits();
      } else {
        showNotification(response.data.message || 'Failed to issue kit');
      }
    } catch (error) {
      console.error('Error issuing kit:', error);
      const errorMessage = error.response?.data?.message || 'Error issuing kit. Please try again.';
      showNotification(errorMessage);
    } finally {
      setIssuing(false);
    }
  };

  const filteredKits = availableKits.filter(kit => {
    const matchesSearch = kit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kit.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const isAvailable = kit.available > 0;
    return matchesSearch && isAvailable;
  });

  const getDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + dueDays);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalAvailable = availableKits.reduce((acc, kit) => acc + kit.available, 0);

  return (
    <div className="w-full h-full p-6 bg-slate-50 dark:bg-transparent">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle size={18} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Issue Kit</h1>
        <p className="text-slate-600 dark:text-slate-400">Issue equipment to students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Kit Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Stats */}
          <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-slate-800/50 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 w-full sm:w-auto flex-1 max-w-md">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search available kits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent outline-none w-full text-gray-900 dark:text-white text-sm placeholder-slate-500"
                />
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Package size={18} className="text-emerald-500 dark:text-emerald-400" />
                <span>{totalAvailable} kits available</span>
              </div>
            </div>
          </div>

          {/* Kits Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={32} className="text-emerald-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredKits.map((kit, index) => (
                <motion.div
                  key={kit._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedKit(kit)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedKit?._id === kit._id
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/20'
                      : 'bg-white dark:bg-[#0F172A] border-gray-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedKit?._id === kit._id ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-slate-800'
                    }`}>
                      {kit.emoji ? (
                        <span className="text-2xl">{kit.emoji}</span>
                      ) : (
                        <Box size={24} className={selectedKit?._id === kit._id ? 'text-white' : 'text-slate-400'} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 dark:text-white font-semibold truncate">{kit.name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{kit.category}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                          {kit.available} available
                        </span>
                        <span className="text-slate-500 text-sm">
                          of {kit.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredKits.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-12 text-slate-500"
                >
                  <Package size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No kits available matching your search</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-4 text-emerald-500 hover:text-emerald-600 text-sm"
                    >
                      Clear search
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Issue Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-gray-200 dark:border-slate-800 p-6 sticky top-6 shadow-sm dark:shadow-none">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-emerald-500 dark:text-emerald-400" />
              Issue Details
            </h2>

            {/* Selected Kit */}
            {selectedKit ? (
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg"
              >
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Selected Kit</p>
                <p className="text-gray-900 dark:text-white font-semibold">{selectedKit.name}</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm">{selectedKit.available} available</p>
              </motion.div>
            ) : (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-center">
                <p className="text-slate-500 dark:text-slate-500">Click on a kit to select</p>
              </div>
            )}

            {/* Student Name */}
            <div className="mb-6">
              <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Student Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student name"
                  className="w-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!selectedKit}
                  className="w-10 h-10 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={!selectedKit}
                  className="w-20 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-center disabled:opacity-50 transition-colors"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!selectedKit || (selectedKit && quantity >= selectedKit.available)}
                  className="w-10 h-10 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Due Days */}
            <div className="mb-6">
              <label className="block text-slate-600 dark:text-slate-400 text-sm mb-2">
                <Clock size={14} className="inline mr-1" />
                Due Days
              </label>
              <select
                value={dueDays}
                onChange={(e) => setDueDays(parseInt(e.target.value))}
                disabled={!selectedKit}
                className="w-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 focus:border-emerald-500 outline-none disabled:opacity-50 transition-colors"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            {/* Due Date Preview */}
            <div className="mb-6 p-3 bg-gray-100 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-1">
                <Calendar size={14} />
                Due Date
              </div>
              <p className="text-gray-900 dark:text-white font-medium">{getDueDate()}</p>
            </div>

            {/* Recently Issued */}
            {recentlyIssued.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-500" />
                  Recently Issued
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentlyIssued.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-xs"
                    >
                      <p className="text-gray-900 dark:text-white font-medium">{item.kitName}</p>
                      <p className="text-slate-600 dark:text-slate-400">
                        {item.studentName} • {item.time}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Issue Button */}
            <button
              onClick={handleIssue}
              disabled={!selectedKit || !studentName.trim() || issuing}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
            >
              {issuing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  Issue Kit
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
