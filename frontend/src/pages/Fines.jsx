import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, CheckCircle, Clock, CreditCard, AlertCircle,
  Search, Download, Eye, Receipt, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Bell, Settings, TrendingUp
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { finesAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import PaymentModal from '@/components/PaymentModal';

const SPORT_EMOJIS = { cricket:'🏏', football:'⚽', basketball:'🏀', badminton:'🏸', volleyball:'🏐', default:'🎽' };

const StatCard = ({ label, value, sub, icon, color }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 flex items-center justify-between shadow-sm`}>
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
    paid:     'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    overdue:  'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    disputed: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    waived:   'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${map[status] || map.pending}`}>
      {status}
    </span>
  );
};

const DonutChart = ({ overdue, pending, paid }) => {
  const total = overdue + pending + paid || 1;
  const r = 60, cx = 70, cy = 70, circumference = 2 * Math.PI * r;
  const overdueP = (overdue / total) * circumference;
  const pendingP = (pending / total) * circumference;
  const paidP = (paid / total) * circumference;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="20" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth="20"
        strokeDasharray={`${overdueP} ${circumference}`} strokeDashoffset="0" strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth="20"
        strokeDasharray={`${pendingP} ${circumference}`} strokeDashoffset={`-${overdueP}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeWidth="20"
        strokeDasharray={`${paidP} ${circumference}`} strokeDashoffset={`-${overdueP + pendingP}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="9" fontWeight="600">Total</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-gray-900 dark:fill-white" fontSize="13" fontWeight="800">
        ₹{((overdue + pending + paid) / 1000).toFixed(0)}k
      </text>
    </svg>
  );
};

export default function Fines() {
  const [fines, setFines] = useState([]);
  const [myFines, setMyFines] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payDialog, setPayDialog] = useState(null);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const r = await finesAPI.getAll();
        setFines(r.data?.data || []);
        const sr = await finesAPI.getStats().catch(() => ({ data: { data: null } }));
        setStatistics(sr.data?.data);
      }
      const mr = await finesAPI.getMyFines();
      setMyFines(mr.data?.data?.fines || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error loading fines', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handlePay = async (fineId, method) => {
    try {
      await finesAPI.markPaid(fineId, { method });
      toast({ title: '✅ Payment Successful!', description: 'Fine has been marked as paid.' });
      setPayDialog(null);
      fetchData();
    } catch (e) {
      toast({ title: 'Payment failed', variant: 'destructive' });
    }
  };

  const displayFines = isAdmin ? fines : myFines;

  const filtered = useMemo(() => {
    let list = displayFines;
    if (tab === 'outstanding') list = list.filter(f => f.status === 'pending');
    else if (tab === 'paid') list = list.filter(f => f.status === 'paid');
    else if (tab === 'overdue') list = list.filter(f => f.status === 'overdue' || (f.status === 'pending' && f.daysLate > 0));
    if (statusFilter !== 'all') list = list.filter(f => f.status === statusFilter);
    if (search) list = list.filter(f =>
      f.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.kit?.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.user?.studentId?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [displayFines, tab, statusFilter, search]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  // Stats
  const totalOutstanding = displayFines.filter(f => f.status !== 'paid').reduce((s, f) => s + (f.fineAmount || 0), 0);
  const totalCollected = displayFines.filter(f => f.status === 'paid').reduce((s, f) => s + (f.fineAmount || 0), 0);
  const totalFines = displayFines.reduce((s, f) => s + (f.fineAmount || 0), 0);
  const totalPaid = displayFines.filter(f => f.status === 'paid').length;
  const overdueAmt = displayFines.filter(f => f.status === 'overdue').reduce((s, f) => s + f.fineAmount, 0);
  const pendingAmt = displayFines.filter(f => f.status === 'pending').reduce((s, f) => s + f.fineAmount, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Fine &amp; Payment Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Dashboard &gt; Fine &amp; Payments &gt; {tab === 'all' ? 'All Fines' : tab}</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Outstanding" value={`₹ ${totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} sub={`${displayFines.filter(f => f.status !== 'paid').length} Pending Payments`}
          icon={<DollarSign className="w-6 h-6 text-violet-600" />} color="bg-violet-100 dark:bg-violet-500/20" />
        <StatCard label="Total Collected" value={`₹ ${totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} sub="This Month"
          icon={<CreditCard className="w-6 h-6 text-orange-500" />} color="bg-orange-100 dark:bg-orange-500/20" />
        <StatCard label="Total Fines" value={`₹ ${totalFines.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} sub="This Month"
          icon={<TrendingUp className="w-6 h-6 text-blue-500" />} color="bg-blue-100 dark:bg-blue-500/20" />
        <StatCard label="Total Paid" value={totalPaid} sub="Payments Completed"
          icon={<CheckCircle className="w-6 h-6 text-green-500" />} color="bg-green-100 dark:bg-green-500/20" />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-slate-700 px-6 pt-4 gap-6">
          {['all', 'outstanding', 'paid', 'overdue'].map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }}
              className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-colors ${tab === t ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {t === 'all' ? 'All Fines' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by student name, ID or kit..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="disputed">Disputed</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50 text-left">
                {['#', 'Student', 'Kit Details', 'Issue Date', 'Due Date', 'Days Late', 'Fine Amount', 'Paid Amount', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No fines found</p>
                </td></tr>
              ) : paginated.map((fine, i) => {
                const isLate = fine.daysLate > 0;
                const avatar = (fine.user?.name || 'U').charAt(0).toUpperCase();
                const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-orange-500','bg-pink-500'];
                const avatarColor = colors[i % colors.length];
                return (
                  <motion.tr key={fine._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3.5 text-slate-500 font-medium">{(page - 1) * PER_PAGE + i + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{avatar}</div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{fine.user?.name || 'N/A'}</p>
                          <p className="text-xs text-slate-400">{fine.user?.studentId || fine.user?.email?.split('@')[0] || 'STU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900 dark:text-white">{fine.kit?.name || 'Unknown Kit'}</p>
                      <p className="text-xs text-slate-400">{fine.kit?.brand || fine.kit?.category || ''}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {fine.transaction?.dueDate ? new Date(fine.transaction.dueDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {fine.daysLate > 0 ? (
                        <span className={`font-bold ${fine.daysLate >= 10 ? 'text-red-500' : fine.daysLate >= 5 ? 'text-orange-500' : 'text-yellow-500'}`}>
                          {fine.daysLate} Days
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">₹ {(fine.fineAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-700 dark:text-slate-300">
                      {fine.status === 'paid' ? `₹ ${(fine.fineAmount || 0).toFixed(2)}` : '₹ 0.00'}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={fine.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-semibold transition-colors">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {fine.status === 'paid' ? (
                          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 text-xs font-semibold transition-colors">
                            <Receipt className="w-3.5 h-3.5" /> Receipt
                          </button>
                        ) : (
                          <button onClick={() => setPayDialog(fine)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors">
                            <CreditCard className="w-3.5 h-3.5" /> Collect
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-700">
          <p className="text-sm text-slate-500">
            Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page === p ? 'bg-violet-600 text-white' : 'border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: Summary + Recent + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Fine Summary</h3>
          <div className="flex items-center gap-4">
            <DonutChart overdue={overdueAmt} pending={pendingAmt} paid={totalCollected} />
            <div className="space-y-3 flex-1">
              {[
                { label: 'Overdue', amt: overdueAmt, color: 'bg-red-500' },
                { label: 'Pending', amt: pendingAmt, color: 'bg-amber-500' },
                { label: 'Paid', amt: totalCollected, color: 'bg-emerald-500' },
              ].map(({ label, amt, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">₹ {amt.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {displayFines.filter(f => f.status === 'paid').slice(0, 4).map((fine, i) => {
              const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-orange-500'];
              return (
                <div key={fine._id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${colors[i % colors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {(fine.user?.name || 'U').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{fine.user?.name || 'User'}</p>
                    <p className="text-xs text-slate-400 uppercase">{fine.kit?.name || 'Kit'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">₹ {fine.fineAmount}</p>
                    <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">Paid</span>
                  </div>
                </div>
              );
            })}
            {displayFines.filter(f => f.status === 'paid').length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No payments yet</p>
            )}
          </div>
          {displayFines.filter(f => f.status === 'paid').length > 4 && (
            <button className="w-full mt-4 text-sm font-semibold text-violet-600 hover:text-violet-700 text-center">View All Payments →</button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <CreditCard className="w-5 h-5" />, label: 'Collect Fine Payment', color: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' },
              { icon: <Bell className="w-5 h-5" />, label: 'Send Payment Reminder', color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' },
              { icon: <Receipt className="w-5 h-5" />, label: 'Generate Fine Report', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' },
              { icon: <Settings className="w-5 h-5" />, label: 'Fine Settings', color: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' },
            ].map(({ icon, label, color }) => (
              <button key={label} className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} hover:opacity-80 transition-opacity text-center`}>
                {icon}
                <span className="text-xs font-semibold leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {payDialog && (
        <PaymentModal
          isOpen={!!payDialog}
          onClose={() => setPayDialog(null)}
          amount={payDialog.fineAmount}
          onSuccess={(method) => handlePay(payDialog._id, method)}
          title={`Pay for ${payDialog.kit?.name || 'Kit'}`}
        />
      )}
    </div>
  );
}
