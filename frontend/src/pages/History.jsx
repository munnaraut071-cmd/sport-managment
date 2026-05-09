import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, getDaysOverdue } from '@/lib/utils';
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  Download,
  ArrowUpCircle,
  X,
  FileSpreadsheet,
  Printer,
  Eye,
  Loader2,
  Sparkles,
  History as HistoryIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { transactionsAPI } from '@/services/api';

const History = () => {
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    overdue: 0,
    returned: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getAll();
      const data = response.data.data || [];
      setTransactions(data);
      
      // Calculate stats
      const active = data.filter(t => !t.returnDate && new Date(t.dueDate || t.expectedReturnDate) >= new Date()).length;
      const overdue = data.filter(t => !t.returnDate && new Date(t.dueDate || t.expectedReturnDate) < new Date()).length;
      const returned = data.filter(t => t.returnDate || t.status === 'returned').length;
      
      setStats({
        total: data.length,
        active,
        overdue,
        returned
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showNotification('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Kit Name', 'Student', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Quantity'];
    const rows = filteredTransactions.map(t => [
      t.kit?.name || t.kitName,
      t.user?.name || t.userName || t.issuedTo,
      new Date(t.issueDate || t.createdAt).toLocaleDateString(),
      new Date(t.dueDate || t.expectedReturnDate).toLocaleDateString(),
      t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '-',
      t.returnDate || t.status === 'returned' ? 'Returned' : 
        new Date(t.dueDate || t.expectedReturnDate) < new Date() ? 'Overdue' : 'Active',
      t.quantity || 1
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Transaction history exported to CSV!');
  };

  const handlePrint = () => {
    showNotification('Sending to printer...');
  };

  const handleReturnKit = async (id) => {
    try {
      const response = await transactionsAPI.returnKit({
        transactionId: id,
        condition: 'good'
      });
      
      if (response.data.success) {
        await fetchTransactions();
        showNotification('Kit returned successfully!');
      } else {
        showNotification('Failed to return kit');
      }
    } catch (error) {
      console.error('Error returning kit:', error);
      showNotification('Error returning kit');
    }
  };

  // Safe filter function that handles undefined values
  const filteredTransactions = transactions.filter(t => {
    const kitName = (t.kit?.name || t.kitName || '').toLowerCase();
    const userName = (t.user?.name || t.userName || t.issuedTo || '').toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = !searchQuery || 
                         kitName.includes(searchLower) ||
                         userName.includes(searchLower);
    
    // Determine actual status
    let actualStatus = t.status;
    const dueDate = t.dueDate || t.expectedReturnDate;
    if (!actualStatus && dueDate) {
      if (t.returnDate) {
        actualStatus = 'returned';
      } else if (new Date(dueDate) < new Date()) {
        actualStatus = 'overdue';
      } else {
        actualStatus = 'active';
      }
    }
    
    const matchesStatus = statusFilter === 'all' || actualStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Safe status badge with proper fallbacks
  const getStatusBadge = (transaction) => {
    const dueDate = transaction.dueDate || transaction.expectedReturnDate;
    
    // Determine actual status
    if (transaction.status === 'returned' || transaction.returnDate) {
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">Returned</Badge>;
    }
    
    if (transaction.status === 'overdue' || (dueDate && new Date(dueDate) < new Date())) {
      const days = getDaysOverdue ? getDaysOverdue(dueDate) : Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-0">{days > 0 ? `${days} days ` : ''}overdue</Badge>;
    }
    
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0">Active</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'returned':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div className="w-full h-full space-y-8 bg-slate-50 dark:bg-transparent">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <HistoryIcon className="h-8 w-8 text-emerald-500" />
            Transaction History
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">View all kit issues and returns</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2 bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800" 
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800" 
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          whileHover={{ y: -4 }}
        >
          <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Total Transactions</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4 }}
        >
          <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Active Issues</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4 }}
        >
          <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.overdue}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Overdue</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4 }}
        >
          <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-500/10">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.returned}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Returned</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by kit or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 dark:text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-slate-800">
                  <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Kit</TableHead>
                  {isAdmin && <TableHead className="text-gray-900 dark:text-white">User</TableHead>}
                  <TableHead className="text-gray-900 dark:text-white">Issue Date</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Due Date</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Return Date</TableHead>
                  <TableHead className="text-right text-gray-900 dark:text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-12">
                      <div className="space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-emerald-500" />
                        <p className="text-slate-500 dark:text-slate-400">Loading transaction history...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-12">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                          <HistoryIcon className="h-10 w-10 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">No transactions found</p>
                          {searchQuery && (
                            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                              Try adjusting your search or filters
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction._id || transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        {getStatusBadge(transaction)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {transaction.kit?.emoji && <span className="text-xl">{transaction.kit.emoji}</span>}
                        {transaction.kit?.name || transaction.kitName}
                      </div>
                    </TableCell>
                    {isAdmin && <TableCell className="text-gray-900 dark:text-white">{transaction.user?.name || transaction.userName || transaction.issuedTo}</TableCell>}
                    <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(transaction.issueDate || transaction.createdAt)}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(transaction.dueDate || transaction.expectedReturnDate)}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {transaction.returnDate || transaction.status === 'returned' ? (
                        formatDate(transaction.returnDate)
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setViewingTransaction(transaction)}
                          className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(!transaction.returnDate && transaction.status !== 'returned') && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleReturnKit(transaction._id || transaction.id)}
                            className="h-8 w-8 p-0 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                            title="Return Kit"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          {filteredTransactions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-sm">
              <p className="text-slate-500 dark:text-slate-400">
                Showing {filteredTransactions.length} of {stats.total} transactions
              </p>
              <div className="flex gap-4">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-3 w-3" /> {stats.returned} returned
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" /> {stats.active} active
                </span>
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3" /> {stats.overdue} overdue
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Transaction Modal */}
      <AnimatePresence>
        {viewingTransaction && (
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
              className="bg-white dark:bg-[#111827] rounded-xl w-full max-w-lg border border-gray-200 dark:border-slate-800 shadow-2xl"
            >
              {/* Header */}
              <div className="border-b border-gray-200 dark:border-slate-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    {viewingTransaction.kit?.emoji ? (
                      <span className="text-2xl">{viewingTransaction.kit.emoji}</span>
                    ) : (
                      <Package className="text-emerald-500 dark:text-emerald-400" size={24} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{viewingTransaction.kit?.name || viewingTransaction.kitName}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Transaction Details</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingTransaction(null)}
                  className="p-2 text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 dark:bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(viewingTransaction.status)}
                      {getStatusBadge(viewingTransaction.status, viewingTransaction.dueDate)}
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Transaction ID</p>
                    <p className="text-gray-900 dark:text-white font-medium">#{viewingTransaction._id || viewingTransaction.id}</p>
                  </div>
                </div>
                
                <div className="bg-gray-100 dark:bg-slate-800/50 p-4 rounded-lg space-y-3">
                  <h3 className="text-gray-900 dark:text-white font-medium">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Calendar className="text-emerald-500 dark:text-emerald-400" size={14} />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white text-sm">Issued</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">{formatDate(viewingTransaction.issueDate || viewingTransaction.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        (viewingTransaction.status === 'overdue' || new Date(viewingTransaction.dueDate || viewingTransaction.expectedReturnDate) < new Date()) ? 'bg-red-100 dark:bg-red-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
                      }`}>
                        <Clock className={(viewingTransaction.status === 'overdue' || new Date(viewingTransaction.dueDate || viewingTransaction.expectedReturnDate) < new Date()) ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'} size={14} />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white text-sm">Due Date</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">{formatDate(viewingTransaction.dueDate || viewingTransaction.expectedReturnDate)}</p>
                      </div>
                    </div>
                    {(viewingTransaction.returnDate || viewingTransaction.status === 'returned') && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="text-blue-500 dark:text-blue-400" size={14} />
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white text-sm">Returned</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">{formatDate(viewingTransaction.returnDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="bg-gray-100 dark:bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">User</p>
                    <p className="text-gray-900 dark:text-white font-medium">{viewingTransaction.user?.name || viewingTransaction.userName || viewingTransaction.issuedTo}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;
