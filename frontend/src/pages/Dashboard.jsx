import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import {
  Package, ArrowUpCircle, ArrowDownCircle, AlertTriangle,
  TrendingUp, Trophy, Calendar, ChevronDown, Sparkles,
  Medal, Zap, ArrowUpRight, ArrowDownRight, Loader2,
  Search, Bell, User, ChevronRight, Activity, Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { analyticsAPI, transactionsAPI, aiAPI, tournamentsAPI } from '@/services/api';

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

// Components
const StatCard = ({ title, value, subtitle, change, up, icon: Icon, gradient, glow, loading }) => (
  <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="relative group">
    <div className={`absolute -inset-[1px] bg-gradient-to-br ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
    <div className="relative bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-8 hover:border-gray-700/80 transition-all duration-300 h-full">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow}`}>
          <Icon size={28} className="text-white" />
        </div>
        {change && !loading && (
          <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${up ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </span>
        )}
      </div>
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 size={24} className="animate-spin text-gray-500" />
          <span className="text-gray-500">Loading...</span>
        </div>
      ) : (
        <p className="text-4xl font-bold text-white tracking-tight">{value}</p>
      )}
      <p className="text-base text-gray-400 mt-2 font-medium">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </motion.div>
);

const ActivityItem = ({ action, user, time, type }) => {
  const config = {
    issue: { icon: ArrowUpCircle, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
    return: { icon: ArrowDownCircle, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
    alert: { icon: AlertTriangle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20' },
  };
  const { icon: ItemIcon, color, bg, border } = config[type] || config.issue;
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-200 dark:border-gray-800/40 last:border-0 group cursor-default hover:bg-gray-50 dark:hover:bg-gray-800/20 rounded-xl px-2 -mx-2 transition-colors">
      <div className={`w-10 h-10 rounded-xl ${bg} ${border} border flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110`}>
        <ItemIcon size={18} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{action}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{user}</p>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-600 flex-shrink-0 font-medium">{time}</span>
    </div>
  );
};

const EventCard = ({ title, date, description, icon: EventIcon, sports }) => (
  <div className="flex gap-4 py-4 border-b border-gray-800/40 last:border-0 group cursor-default hover:bg-gray-800/20 rounded-xl px-2 -mx-2 transition-colors">
    <div className="w-14 h-16 bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 rounded-xl flex flex-col items-center justify-center border border-emerald-500/20 flex-shrink-0 group-hover:border-emerald-500/40 transition-colors">
      <span className="text-[10px] text-emerald-400 font-bold tracking-widest">{date?.split(' ')[0]}</span>
      <span className="text-xl text-white font-bold leading-none">{date?.split(' ')[1]}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <EventIcon size={14} className="text-emerald-400" />
        <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">{title}</h4>
      </div>
      <p className="text-xs text-gray-500 mb-2 line-clamp-1">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {sports?.slice(0, 3).map((s) => (
          <span key={s} className="text-[10px] px-2 py-0.5 bg-gray-800/80 rounded-md text-gray-400 border border-gray-700/50">{s}</span>
        ))}
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F172A]/95 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-3 shadow-2xl shadow-black/40">
      <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-sm font-semibold flex items-center gap-2" style={{ color: e.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }}></span>
          {e.name}: {e.value}
        </p>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('This Month');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Live data states
  const [stats, setStats] = useState({
    totalKits: 0,
    issuedKits: 0,
    availableKits: 0,
    lowStockCount: 0,
  });

  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [events, setEvents] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch main dashboard stats
      const dashboardRes = await analyticsAPI.getDashboard();
      const dashboardData = dashboardRes.data?.data || dashboardRes.data;
      
      if (dashboardData?.counts) {
        setStats({
          totalKits: dashboardData.counts.totalKits || 0,
          issuedKits: dashboardData.counts.issuedKits || 0,
          availableKits: dashboardData.counts.availableKits || 0,
          lowStockCount: dashboardData.counts.lowStockCount || 0,
        });
      }

      // Fetch low stock items
      if (dashboardData.lowStockKits) {
        setLowStockItems(dashboardData.lowStockKits.map(kit => ({
          name: kit.name,
          available: kit.available,
          total: kit.quantity,
          status: kit.available <= 2 ? 'Critical' : kit.available <= 5 ? 'Low' : 'Medium',
          emoji: getKitEmoji(kit.category)
        })));
      }

      // Fetch usage stats for chart
      const usageRes = await analyticsAPI.getKitsUsage({ period: '7d' });
      const usageStats = usageRes.data?.data?.dailyStats || usageRes.data?.dailyStats;
      
      if (Array.isArray(usageStats)) {
        setChartData(usageStats.map(item => ({
          name: item.name,
          issued: item.issued || 0,
          available: item.available || 0,
          active: item.active || 0
        })));
      } else {
        // Fallback to usageData if dailyStats is missing
        const usageData = usageRes.data?.data || usageRes.data;
        if (Array.isArray(usageData)) {
          setChartData(usageData.map(item => ({
            name: item.name,
            issued: item.issued || 0,
            available: item.available || 0,
            active: item.active || 0
          })));
        }
      }

      // Fetch AI recommendations
      try {
        const aiRes = await aiAPI.getRecommendations();
        if (aiRes.data?.data) {
          setAiRecommendations(aiRes.data.data.slice(0, 4).map(rec => ({
            text: rec.message || rec.text,
            icon: getIconForType(rec.type || 'info')
          })));
        }
      } catch (e) {
        console.warn('AI Recommendations unavailable');
        setAiRecommendations([]);
      }

      // Fetch recent transactions for activities
      const transactionsRes = await transactionsAPI.getAll({ limit: 6 });
      if (transactionsRes.data.data) {
        setActivities(transactionsRes.data.data.map(t => ({
          id: t._id,
          action: `${t.type === 'issue' ? 'Kit issued to' : 'Kit returned by'} ${t.user?.name || 'User'}`,
          user: t.user?.name || 'Unknown',
          time: formatTimeAgo(t.createdAt),
          type: t.type === 'issue' ? 'issue' : t.type === 'return' ? 'return' : 'alert'
        })));
      }

      // Fetch upcoming tournaments/events
      try {
        const tournamentsRes = await tournamentsAPI.getAll({ upcoming: true, limit: 3 });
        if (tournamentsRes.data?.data) {
          setEvents(tournamentsRes.data.data.map(t => ({
            title: t.eventName,
            date: formatEventDate(t.startDate),
            description: `${t.description?.substring(0, 50) || 'Tournament event'} • ${t.sports?.join(', ') || 'All Sports'}`,
            icon: Trophy,
            sports: t.sports || ['Sports']
          })));
        }
      } catch (e) {
        console.warn('Tournaments data unavailable');
        setEvents([]);
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Using offline mode.',
        variant: 'destructive'
      });
      // Set default data on error
      setDefaultData();
    } finally {
      setLoading(false);
    }
  };

  const setDefaultData = () => {
    setStats({ totalKits: 120, issuedKits: 45, availableKits: 75, lowStockCount: 8 });
    setChartData([
      { date: 'Day 1', issued: 12, returned: 8 },
      { date: 'Day 2', issued: 18, returned: 10 },
      { date: 'Day 3', issued: 15, returned: 14 },
      { date: 'Day 4', issued: 22, returned: 12 },
      { date: 'Day 5', issued: 19, returned: 16 },
      { date: 'Day 6', issued: 25, returned: 18 },
      { date: 'Day 7', issued: 20, returned: 22 },
    ]);
    setLowStockItems([
      { name: 'SG Cricket Bat', available: 3, total: 12, status: 'Low', emoji: '🏏' },
      { name: 'Masuri Helmet', available: 2, total: 8, status: 'Critical', emoji: '⛑️' },
    ]);
  };

  const getKitEmoji = (category) => {
    const emojis = {
      cricket: '🏏', football: '⚽', badminton: '🏸', basketball: '🏀',
      tennis: '🎾', hockey: '🏒', volleyball: '🏐', swimming: '🏊'
    };
    return emojis[category?.toLowerCase()] || '📦';
  };

  const getIconForType = (type) => {
    const icons = { warning: AlertTriangle, trend: TrendingUp, urgent: Zap, info: Trophy };
    return icons[type] || Trophy;
  };

  const formatTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days} day ago`;
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    const day = String(date.getDate()).padStart(2, '0');
    return `${month} ${day}`;
  };

  const statCards = [
    { title: 'Active Kits', value: stats.totalKits, subtitle: 'Working & Available', icon: Package, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
    { title: 'Issued Kits', value: stats.issuedKits, subtitle: 'Currently Borrowed', icon: ArrowUpCircle, gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/30' },
    { title: 'Available Now', value: stats.availableKits, subtitle: 'Ready to Issue', icon: ArrowDownCircle, gradient: 'from-purple-500 to-pink-600', glow: 'shadow-purple-500/30' },
    { title: 'Low Stock Alert', value: stats.lowStockCount, subtitle: 'Needs Restock', icon: AlertTriangle, gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30' },
  ];

  return (
    <div className="w-full h-full bg-slate-100 dark:bg-transparent">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-base text-gray-600 dark:text-gray-400 mt-2">Welcome back, {user?.name || 'User'}! Here is what is happening today.</p>
      </div>

      <div className="space-y-8 w-full">
          
          {/* Stats Row */}
          <motion.div variants={scaleIn} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((s, i) => (
              <motion.div key={s.title} variants={fadeUp} initial="hidden" animate="show" custom={i}>
                <StatCard {...s} loading={loading} />
              </motion.div>
            ))}
          </motion.div>

          {/* Main Grid Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Issue Overview - col-span-7 */}
            <motion.div className="lg:col-span-7" variants={fadeUp} initial="hidden" animate="show" custom={4}>
              <div className="bg-white dark:bg-[#0F172A]/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800/60 p-8 h-[500px] shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none hover:border-gray-300 dark:hover:border-gray-700/80 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Activity size={18} className="text-emerald-500" />
                      Issue Overview
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kit issuance & return trends</p>
                  </div>
                  <div className="relative">
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-emerald-500/40 appearance-none pr-10 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                    >
                      <option>This Month</option>
                      <option>Last Month</option>
                      <option>Last 3 Months</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="issuedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="returnedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="activeFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="availableFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#1E293B" vertical={false} opacity={0.4} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#475569" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={15}
                        padding={{ left: 30, right: 30 }}
                        tick={{ fill: '#94A3B8' }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis 
                        stroke="#475569" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#94A3B8' }}
                        tickFormatter={(val) => val === 0 ? '0' : val}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
                      />
                      <Area 
                        type="natural" 
                        dataKey="available" 
                        name="Available" 
                        stroke="#8B5CF6" 
                        strokeWidth={3} 
                        fill="url(#availableFill)"
                        dot={{ r: 3, fill: '#8B5CF6', strokeWidth: 1, stroke: '#0F172A' }} 
                        activeDot={{ r: 5 }} 
                      />
                      <Area 
                        type="natural" 
                        dataKey="active" 
                        name="Active (Out)" 
                        stroke="#F59E0B" 
                        strokeWidth={3} 
                        fill="url(#activeFill)"
                        dot={{ r: 3, fill: '#F59E0B', strokeWidth: 1, stroke: '#0F172A' }} 
                        activeDot={{ r: 5 }} 
                      />
                      <Area 
                        type="natural" 
                        dataKey="issued" 
                        name="Total Issued" 
                        stroke="#22C55E" 
                        strokeWidth={4} 
                        fill="url(#issuedFill)"
                        dot={{ r: 4, fill: '#22C55E', strokeWidth: 2, stroke: '#0F172A' }} 
                        activeDot={{ r: 6 }} 
                        animationDuration={2000}
                      />
                      <Area 
                        type="natural" 
                        dataKey="returned" 
                        name="Total Returned" 
                        stroke="#3B82F6" 
                        strokeWidth={4} 
                        fill="url(#returnedFill)"
                        dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#0F172A' }} 
                        activeDot={{ r: 6 }} 
                        animationDuration={2000}
                        animationBegin={400}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                

              </div>
            </motion.div>

            {/* Recent Activity - col-span-5 */}
            <motion.div className="lg:col-span-5" variants={fadeUp} initial="hidden" animate="show" custom={6}>
              <div className="bg-white dark:bg-[#0F172A]/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800/60 p-6 h-[420px] shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none hover:border-gray-300 dark:hover:border-gray-700/80 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock size={18} className="text-blue-500" />
                      Recent Activities
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                    <span className="text-xs text-emerald-400 font-semibold">LIVE</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <div className="space-y-1">
                    {activities.map((a) => (
                      <ActivityItem key={a.id} {...a} />
                    ))}
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full mt-4 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-sm font-medium">
                  View All <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Main Grid Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Low Stock Alert - col-span-4 */}
            <motion.div className="lg:col-span-4" variants={fadeUp} initial="hidden" animate="show" custom={7}>
              <div className="bg-white dark:bg-[#0F172A]/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800/60 p-8 h-full shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none hover:border-gray-300 dark:hover:border-gray-700/80 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <AlertTriangle size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alert</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Items needing restock</p>
                    </div>
                  </div>
                  <span className="text-xs text-amber-500 font-semibold px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-full border border-amber-200 dark:border-amber-500/20">
                    {lowStockItems.length} items
                  </span>
                </div>
                
                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div key={item.name} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#0F172A]/80 rounded-xl border border-gray-200 dark:border-gray-800/40 hover:border-amber-300 dark:hover:border-gray-700/60 transition-all group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm">
                        {item.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Available: {item.available} / {item.total}</p>
                      </div>
                      <Badge variant={item.status === 'Low' ? 'destructive' : 'warning'} className="text-xs px-3 py-1">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <Button variant="ghost" className="w-full mt-6 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-sm font-medium">
                  View All <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </motion.div>

            {/* AI Recommendation - col-span-5 */}
            <motion.div className="lg:col-span-5" variants={fadeUp} initial="hidden" animate="show" custom={8}>
              <div className="relative bg-gradient-to-br from-emerald-50 dark:from-emerald-900/40 via-white dark:via-[#0F172A]/80 to-white dark:to-[#0F172A]/80 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 p-8 h-full overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-500/40 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-all duration-300">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 left-0 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl"></div>
                
                <div className="relative flex gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Sparkles size={26} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          AI Recommendation
                          <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs border-emerald-200 dark:border-emerald-500/30">NEW</Badge>
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Based on usage & upcoming tournaments</p>
                      </div>
                    </div>
                    
                    <ul className="space-y-4 mb-8">
                      {aiRecommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="flex items-center gap-3 text-base text-gray-700 dark:text-gray-300">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <rec.icon size={16} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="font-medium">{rec.text}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex gap-3">
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]">
                        View Details
                        <ArrowUpRight size={18} />
                      </Button>
                      <Button variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-6 py-3 rounded-xl text-base font-medium">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  
                  <div className="hidden lg:flex flex-col items-center justify-center w-32">
                    <div className="relative">
                      <div className="text-6xl drop-shadow-2xl">🏏</div>
                      <div className="absolute -bottom-3 -right-4 text-4xl drop-shadow-xl">🧤</div>
                      <div className="absolute -top-2 -right-6 text-3xl drop-shadow-lg">⚽</div>
                      <div className="absolute top-4 -left-6 text-3xl drop-shadow-lg">🏀</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Upcoming Events - col-span-3 */}
            <motion.div className="lg:col-span-3" variants={fadeUp} initial="hidden" animate="show" custom={9}>
              <div className="bg-[#0F172A]/60 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-8 h-full hover:border-gray-700/80 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Calendar size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Upcoming Events</h3>
                      <p className="text-sm text-gray-500">Scheduled activities</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {events.map((e, i) => <EventCard key={i} {...e} />)}
                </div>
                
                <Button variant="ghost" className="w-full mt-6 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-sm font-medium">
                  View All <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
    </div>
  );
};

export default Dashboard;
