import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownCircle, Search, Package, User, CheckCircle, X, Calendar, Clock, Check, Loader2, Sparkles } from "lucide-react";
import { transactionsAPI } from '@/services/api';

export default function Return() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [confirmingReturn, setConfirmingReturn] = useState(null);
  const [returning, setReturning] = useState(false);
  const [issuedKits, setIssuedKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentlyReturned, setRecentlyReturned] = useState([]);
  const [stats, setStats] = useState({ total: 0, overdue: 0 });

  useEffect(() => {
    loadIssuedKits();
  }, []);

  const loadIssuedKits = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getAll({ status: 'active', type: 'issue' });
      if (response.data.success) {
        const activeIssues = response.data.data.filter(t => !t.returnDate);
        setIssuedKits(activeIssues);
        // Update stats
        const overdue = activeIssues.filter(k => getDaysRemaining(k.dueDate || k.expectedReturnDate) < 0);
        setStats({ total: activeIssues.length, overdue: overdue.length });
      }
    } catch (error) {
      console.error('Failed to load issued kits:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleReturn = async (kit) => {
    setReturning(true);
    try {
      // Use the proper return endpoint
      const response = await transactionsAPI.returnKit({ 
        transactionId: kit._id,
        condition: 'good',
        notes: 'Returned via dashboard'
      });
      
      if (response.data.success) {
        setIssuedKits(issuedKits.filter(k => k._id !== kit._id));
        setConfirmingReturn(null);
        
        // Add to recently returned
        setRecentlyReturned(prev => [{
          kitName: kit.kit?.name || kit.name,
          studentName: kit.user?.name || kit.student,
          time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 5));
        
        showNotification(`${kit.kit?.name || kit.name} returned successfully!`);
        
        // Refresh stats
        loadIssuedKits();
      } else {
        showNotification(response.data.message || 'Failed to return kit. Please try again.');
      }
    } catch (error) {
      console.error('Return error:', error);
      showNotification('Error returning kit. Please try again.');
    } finally {
      setReturning(false);
    }
  };

  const filteredKits = issuedKits.filter(kit => 
    (kit.kit?.name || kit.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kit.user?.name || kit.student || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysRemaining = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Return Kit</h1>
          <p className="text-base text-slate-600 dark:text-slate-400">Process kit returns from students</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white dark:bg-[#111827] px-5 py-3 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
            <p className="text-slate-600 dark:text-slate-400 text-sm">Pending: <span className="text-gray-900 dark:text-white font-semibold">{stats.total}</span></p>
          </div>
          {stats.overdue > 0 && (
            <div className="bg-red-50 dark:bg-red-500/10 px-5 py-3 rounded-lg border border-red-200 dark:border-red-500/30">
              <p className="text-red-600 dark:text-red-400 text-sm">Overdue: <span className="font-semibold">{stats.overdue}</span></p>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-[#111827] px-5 py-3.5 rounded-lg w-full max-w-md mb-8 border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search by kit or student name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none w-full text-gray-900 dark:text-white text-sm"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Issued Kits List */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-gray-900 dark:text-white font-semibold">Currently Issued Kits</h2>
          <span className="text-slate-500 dark:text-slate-400 text-sm">{filteredKits.length} kits</span>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-slate-800">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 size={32} className="text-emerald-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Loading issued kits...</p>
            </div>
          ) : filteredKits.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald-500 dark:text-emerald-400" size={32} />
              </div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1">All Kits Returned!</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">No pending returns found.</p>
              {recentlyReturned.length > 0 && (
                <div className="mt-6 max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center justify-center gap-2">
                    <Sparkles size={14} className="text-emerald-500" />
                    Recently Returned
                  </h4>
                  <div className="space-y-2">
                    {recentlyReturned.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-xs text-left"
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
            </motion.div>
          ) : (
            filteredKits.map((kit, index) => {
              const daysRemaining = getDaysRemaining(kit.dueDate || kit.expectedReturnDate);
              const isOverdue = daysRemaining < 0;
              
              return (
                <motion.div 
                  key={kit._id || kit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors gap-4"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      isOverdue ? 'bg-red-100 dark:bg-red-500/20' : 'bg-blue-100 dark:bg-blue-500/20'
                    }`}>
                      {kit.kit?.emoji ? (
                        <span className="text-2xl">{kit.kit.emoji}</span>
                      ) : (
                        <Package className={isOverdue ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400'} size={24} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-gray-900 dark:text-white font-semibold">{kit.kit?.name || kit.name}</h3>
                        {isOverdue && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs rounded border border-red-200 dark:border-red-500/30">
                            Overdue
                          </span>
                        )}
                        {daysRemaining <= 2 && daysRemaining >= 0 && (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded border border-amber-200 dark:border-amber-500/30">
                            Due Soon
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <User size={14} />
                        <span>{kit.user?.name || kit.student || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="text-right flex-1 sm:flex-none">
                      <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 justify-end">
                        <Calendar size={12} />
                        Issued: {new Date(kit.issueDate || kit.createdAt).toLocaleDateString()}
                      </p>
                      <p className={`text-xs flex items-center gap-1 justify-end ${
                        isOverdue ? 'text-red-500 dark:text-red-400' : daysRemaining <= 2 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'
                      }`}>
                        <Clock size={12} />
                        {isOverdue ? `Overdue by ${Math.abs(daysRemaining)} days` : `Due: ${new Date(kit.dueDate || kit.expectedReturnDate).toLocaleDateString()} (${daysRemaining} days)`}
                      </p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setConfirmingReturn(kit)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                      <ArrowDownCircle size={16} />
                      Return
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Return Confirmation Modal */}
      <AnimatePresence>
        {confirmingReturn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#111827] p-8 rounded-xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                  {confirmingReturn.kit?.emoji ? (
                    <span className="text-2xl">{confirmingReturn.kit.emoji}</span>
                  ) : (
                    <Package className="text-blue-500 dark:text-blue-400" size={24} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Return</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Verify kit condition before returning</p>
                </div>
              </div>
              
              <div className="bg-gray-100 dark:bg-slate-800/50 p-5 rounded-lg mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">Kit</span>
                  <span className="text-gray-900 dark:text-white font-medium">{confirmingReturn.kit?.name || confirmingReturn.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">Student</span>
                  <span className="text-gray-900 dark:text-white">{confirmingReturn.user?.name || confirmingReturn.student || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">Issued Date</span>
                  <span className="text-gray-900 dark:text-white">{new Date(confirmingReturn.issueDate || confirmingReturn.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">Due Date</span>
                  <span className="text-gray-900 dark:text-white">{new Date(confirmingReturn.dueDate || confirmingReturn.expectedReturnDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmingReturn(null)}
                  disabled={returning}
                  className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleReturn(confirmingReturn)}
                  disabled={returning}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/30"
                >
                  {returning ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                  ) : (
                    <><Check size={18} /> Confirm Return</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
