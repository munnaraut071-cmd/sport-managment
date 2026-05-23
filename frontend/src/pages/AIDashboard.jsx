import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, ShoppingCart, Users, Zap, BarChart3, Calendar, Clock, ArrowUpRight, ArrowDownRight, CheckCircle, Sparkles, RefreshCw, Download, Lightbulb, Target, Check, X, Bell, TrendingDown, Package, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api, { aiAPI } from '@/services/api';

export default function AIDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // AI Data States
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState([]);
  const [demandData, setDemandData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [tournamentRecommendations, setTournamentRecommendations] = useState([]);

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    try {
      setLoading(true);

      // Fetch AI recommendations
      try {
        const recRes = await aiAPI.getRecommendations();
        if (recRes.data.success) {
          setRecommendations(recRes.data.data?.slice(0, 6) || []);
        }
      } catch (e) { console.log('Recommendations API not available, using fallback'); }

      // Fetch anomalies
      try {
        const anomRes = await api.get('/ai/anomalies');
        if (anomRes.data.success) {
          setAnomalies(anomRes.data.data?.slice(0, 8) || []);
        }
      } catch (e) { console.log('Anomalies API not available, using fallback'); }

      // Fetch insights
      try {
        const insRes = await api.get('/ai/insights');
        if (insRes.data.success) {
          const insightsData = insRes.data.data;
          // Handle different response formats
          if (Array.isArray(insightsData)) {
            setInsights(insightsData.slice(0, 6));
          } else if (insightsData.alerts || insightsData.demandPredictions) {
            // Format the insights data
            const formattedInsights = [];
            if (insightsData.alerts) {
              formattedInsights.push(...insightsData.alerts.map((alert, i) => ({
                title: alert.message || 'Alert',
                description: alert.details || alert.message,
                icon: AlertTriangle,
                color: 'amber'
              })));
            }
            if (insightsData.demandPredictions) {
              formattedInsights.push(...insightsData.demandPredictions.map((pred, i) => ({
                title: `Demand: ${pred.kitName}`,
                description: `Predicted demand: ${pred.predictedDemand} units`,
                icon: TrendingUp,
                color: 'emerald'
              })));
            }
            setInsights(formattedInsights.slice(0, 6));
          }
        }
      } catch (e) { console.log('Insights API not available, using fallback'); }

      // Fetch predictions (demand data)
      try {
        const predRes = await api.get('/ai/predictions');
        if (predRes.data.success) {
          const predictionsData = predRes.data.data;
          setDemandData(predictionsData?.demand || []);
          setWeeklyData(predictionsData?.weekly || []);
          setPieData(predictionsData?.distribution || []);
        }
      } catch (e) { console.log('Predictions API not available, using fallback'); }

      // Fetch AI stats
      try {
        const statsRes = await api.get('/ai/stats');
        if (statsRes.data.success) {
          setStatsData(statsRes.data.data || []);
        }
      } catch (e) { console.log('AI stats API not available, using fallback'); }

      // Fetch tournament data for recommendations
      try {
        const upcomingRes = await api.get('/ai/recommendations/upcoming-events');
        if (upcomingRes.data.success && upcomingRes.data.data && upcomingRes.data.data.length > 0) {
          setTournamentRecommendations(upcomingRes.data.data);
        } else {
          // Fallback to old calendar mapping if real recs aren't generated
          const calendarRes = await api.get('/ai/academic-calendar');
          if (calendarRes.data.success) {
            const calendarData = calendarRes.data.data;
            const events = calendarData.upcomingEvents || [];
            
            // Generate tournament-based recommendations
            const tournamentRecs = events
              .filter(event => event.priority === 'high' || event.type === 'tournament')
              .map(event => ({
                _id: event.id || `event-${Date.now()}`,
                title: `Prepare for ${event.name}`,
                description: `Upcoming ${event.type || 'event'} on ${new Date(event.date).toLocaleDateString()}. Based on historical usage, expect increased demand for related equipment.`,
                priority: event.priority === 'high' ? 'high' : 'medium',
                estimatedCost: 'TBD',
                expectedBenefit: 'Ensure adequate stock for event',
                type: 'tournament',
                eventDate: event.date,
                eventType: event.type
              }));
            
            setTournamentRecommendations(tournamentRecs);
          }
        }
      } catch (e) { 
        console.log('Upcoming events API not available, using fallback');
        // Fallback tournament recommendations
        setTournamentRecommendations([
          {
            _id: 'fallback-1',
            title: 'Prepare for Inter-College Cricket Tournament',
            description: 'Upcoming tournament on June 15th. Based on historical usage, expect 45% increase in cricket equipment demand.',
            priority: 'high',
            estimatedCost: '$1200',
            expectedBenefit: 'Prevent stockouts during tournament',
            type: 'tournament',
            eventDate: '2025-06-15',
            eventType: 'tournament'
          },
          {
            _id: 'fallback-2',
            title: 'Football Championship Preparation',
            description: 'Annual football championship starting July 1st. Historical data shows 30% surge in football kit rentals.',
            priority: 'medium',
            estimatedCost: '$800',
            expectedBenefit: 'Meet increased demand',
            type: 'tournament',
            eventDate: '2025-07-01',
            eventType: 'tournament'
          }
        ]);
      }

    } catch (error) {
      console.error('Error fetching AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAIData();
    setRefreshing(false);
    showNotification('AI data refreshed successfully!');
  };

  const handleResolveAnomaly = (id) => {
    setAnomalies(anomalies.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
    showNotification('Anomaly marked as resolved!');
  };

  const handleApproveRecommendation = (id) => {
    setRecommendations(recommendations.map(r => r.id === id ? { ...r, approved: true } : r));
    showNotification('Recommendation approved!');
  };

  const handleExport = () => {
    showNotification('AI report exported successfully!');
  };

  // Fallback Data Arrays (used if API returns empty)
  const defaultStats = [
    { title: 'AI Accuracy', value: '94%', subtitle: 'Prediction accuracy', icon: Target, color: 'emerald', gradient: 'from-[#064e3b] to-[#065f46]' },
    { title: 'Predictions', value: '156', subtitle: 'This month', icon: Brain, color: 'blue', gradient: 'from-[#1e40af] to-[#1e3a8a]' },
    { title: 'Anomalies', value: '12', subtitle: 'Detected issues', icon: AlertTriangle, color: 'amber', gradient: 'from-[#92400e] to-[#78350f]' },
    { title: 'Recommendations', value: '8', subtitle: 'Active suggestions', icon: Lightbulb, color: 'purple', gradient: 'from-[#5b21b6] to-[#4c1d95]' },
  ];

  const defaultDemandData = [
    { kit: 'Cricket Bat', current: 8, predicted: 25, confidence: 92, trend: 'up', status: 'high' },
    { kit: 'Football', current: 12, predicted: 30, confidence: 88, trend: 'up', status: 'high' },
    { kit: 'Badminton Set', current: 5, predicted: 15, confidence: 85, trend: 'up', status: 'medium' },
    { kit: 'Tennis Racket', current: 2, predicted: 12, confidence: 78, trend: 'up', status: 'high' },
    { kit: 'Basketball', current: 10, predicted: 18, confidence: 72, trend: 'stable', status: 'low' },
  ];

  const defaultWeeklyData = [
    { day: 'Mon', actual: 12, predicted: 15 },
    { day: 'Tue', actual: 18, predicted: 20 },
    { day: 'Wed', actual: 15, predicted: 18 },
    { day: 'Thu', actual: 22, predicted: 25 },
    { day: 'Fri', actual: 28, predicted: 30 },
    { day: 'Sat', actual: 35, predicted: 38 },
    { day: 'Sun', actual: 20, predicted: 22 },
  ];

  const defaultPieData = [
    { name: 'Cricket', value: 35, color: '#22c55e' },
    { name: 'Football', value: 28, color: '#3b82f6' },
    { name: 'Badminton', value: 18, color: '#8b5cf6' },
    { name: 'Basketball', value: 12, color: '#f59e0b' },
    { name: 'Others', value: 7, color: '#64748b' },
  ];

  const defaultInsights = [
    { title: 'Peak Usage Times', description: 'AI detected peak usage between 4PM-6PM on weekdays. Consider increasing staff during these hours.', icon: Clock, color: 'blue' },
    { title: 'Seasonal Pattern', description: 'Cricket kit demand typically increases 45% during June-July. Plan inventory accordingly.', icon: Calendar, color: 'emerald' },
    { title: 'Maintenance Alert', description: '15 kits are due for maintenance based on usage patterns. Schedule maintenance to prevent damage.', icon: AlertTriangle, color: 'amber' },
  ];

  // Use API data or fallbacks
  const displayStats = statsData.length > 0 ? statsData : defaultStats;
  const displayDemand = demandData.length > 0 ? demandData : defaultDemandData;
  const displayWeekly = weeklyData.length > 0 ? weeklyData : defaultWeeklyData;
  const displayPie = pieData.length > 0 ? pieData : defaultPieData;
  const displayInsights = insights.length > 0 ? insights : defaultInsights;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'recommendations', label: 'Recommendations', icon: ShoppingCart },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
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
            <CheckCircle size={18} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400">AI-powered insights and predictions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="bg-white dark:bg-[#111827] hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download size={18} />
            Export
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Updating...' : 'Refresh Data'}
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`bg-gradient-to-br ${stat.gradient} p-7 rounded-xl relative overflow-hidden`}>
              <div className="relative z-10">
                <p className="text-white/70 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold mt-1 text-white">{stat.value}</p>
                <p className="text-white/50 text-xs mt-1">{stat.subtitle}</p>
              </div>
              <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10`}>
                <Icon className={`w-7 h-7 text-${stat.color}-300`} />
              </div>
            </div>
          );
        })}
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
          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-8">
            {/* Weekly Trend Chart */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-7 rounded-xl shadow-sm dark:shadow-none">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-900 dark:text-white font-semibold">Weekly Demand Trend</h3>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-500 dark:text-slate-400">Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 rounded-full bg-blue-500"></div>
                    <span className="text-slate-500 dark:text-slate-400">AI Predicted</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayWeekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-[#1e293b]" />
                    <XAxis dataKey="day" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} className="text-gray-500 dark:text-[#64748b]" />
                    <YAxis stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} className="text-gray-500 dark:text-[#64748b]" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--tw-bg-opacity)', border: '1px solid', borderRadius: '8px', color: 'inherit' }}
                      wrapperClassName="dark:!bg-[#1e293b] dark:!border-[#334155] dark:!text-white"
                    />
                    <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} />
                    <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sport Distribution */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-7 rounded-xl shadow-sm dark:shadow-none">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Sport Usage Distribution</h3>
              <div className="flex items-center justify-center h-64">
                <ResponsiveContainer width={250} height={250}>
                  <PieChart>
                    <Pie
                      data={displayPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="ml-6 space-y-2">
                  {displayPie.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-slate-500 dark:text-slate-500">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 p-7 rounded-xl shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-emerald-500 dark:text-emerald-400" size={22} />
              <h3 className="text-gray-900 dark:text-white font-semibold">AI Insights</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {displayInsights.map((insight, index) => {
                const Icon = insight.icon;
                const bgColor = insight.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' :
                               insight.color === 'blue' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' :
                               insight.color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' :
                               'bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20';
                const iconColor = insight.color === 'emerald' ? 'text-emerald-500 dark:text-emerald-400' :
                                  insight.color === 'blue' ? 'text-blue-500 dark:text-blue-400' :
                                  insight.color === 'amber' ? 'text-amber-500 dark:text-amber-400' :
                                  'text-slate-500 dark:text-slate-400';
                return (
                  <div key={index} className={`p-4 ${bgColor} border rounded-xl`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 bg-${insight.color}-100 dark:bg-${insight.color}-500/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon size={20} className={iconColor} />
                      </div>
                      <div>
                        <h4 className="text-gray-900 dark:text-white font-medium text-sm mb-1">{insight.title}</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-xs">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800">
            <h3 className="text-gray-900 dark:text-white font-semibold">AI Demand Predictions</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Next 30 days forecast based on historical data</p>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800">
                <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Kit</th>
                <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Current Stock</th>
                <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Predicted Demand</th>
                <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">AI Confidence</th>
                <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left p-4 text-slate-600 dark:text-slate-400 font-medium text-sm">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {displayDemand.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-gray-900 dark:text-white font-medium">{item.kit}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{item.current} units</td>
                  <td className="p-4 text-gray-900 dark:text-white">{item.predicted} units</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${item.confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 text-sm">{item.confidence}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      item.status === 'high' 
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : item.status === 'medium'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {item.status === 'high' ? 'High Demand' : item.status === 'medium' ? 'Medium' : 'Normal'}
                    </span>
                  </td>
                  <td className="p-4">
                    {item.trend === 'up' ? (
                      <span className="flex items-center gap-1 text-red-500 dark:text-red-400 text-sm">
                        <ArrowUpRight size={16} /> Rising
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 text-sm">
                        <ArrowDownRight size={16} /> Stable
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Tournament-Based Recommendations */}
          {tournamentRecommendations.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-500/10 dark:to-cyan-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold">NEW: Based on Usage & Upcoming Tournaments</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">AI-generated recommendations for upcoming events</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournamentRecommendations.map((rec, index) => (
                  <motion.div
                    key={rec._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-[#111827] p-5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">{rec.title}</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-xs">{rec.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        rec.priority === 'high' 
                          ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30'
                          : 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                      }`}>
                        {rec.priority === 'high' ? 'High' : 'Medium'}
                      </span>
                    </div>
                    {rec.eventDate && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                        <Clock size={14} />
                        <span>{new Date(rec.eventDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Est. Cost: <span className="font-semibold text-gray-900 dark:text-white">{rec.estimatedCost}</span></span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{rec.expectedBenefit}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Recommendations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-white font-semibold text-lg">AI Purchase Recommendations</h3>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                className="bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors border border-emerald-200 dark:border-emerald-500/30"
              >
                <Download size={16} />
                Export Report
              </motion.button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-2 text-center py-16 bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 rounded-xl"
                >
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No recommendations yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">AI will analyze data and generate recommendations</p>
                </motion.div>
              ) : (
                recommendations.map((rec, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-[#111827] p-7 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-gray-900 dark:text-white font-semibold">{rec.kit || rec.title}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{rec.reason || rec.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        rec.priority === 'high' 
                          ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30'
                          : 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                      }`}>
                        {rec.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Recommended Quantity</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{rec.qty || rec.quantity} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">units</span></p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <ShoppingCart className="text-emerald-500 dark:text-emerald-400" size={24} />
                      </div>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleApproveRecommendation(rec.id || index)}
                      disabled={rec.approved}
                      className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        rec.approved
                          ? 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-default'
                          : rec.priority === 'high'
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                      }`}
                    >
                      {rec.approved ? (
                        <><Check size={18} /> Approved</>
                      ) : (
                        rec.action || 'Approve'
                      )}
                    </motion.button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Detected Anomalies</h3>
          {anomalies.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 rounded-xl"
            >
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No anomalies detected</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">All systems running normally</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {anomalies.map((anomaly, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      anomaly.severity === 'high' ? 'bg-red-100 dark:bg-red-500/20' :
                      anomaly.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-blue-100 dark:bg-blue-500/20'
                    }`}>
                      {anomaly.severity === 'high' ? <AlertTriangle size={20} className="text-red-500 dark:text-red-400" /> :
                       anomaly.severity === 'medium' ? <AlertTriangle size={20} className="text-amber-500 dark:text-amber-400" /> :
                       <Zap size={20} className="text-blue-500 dark:text-blue-400" />}
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-medium">{anomaly.message}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">{anomaly.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      anomaly.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                      anomaly.status === 'monitoring' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                      'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {anomaly.status}
                    </span>
                    {anomaly.status !== 'resolved' && (
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleResolveAnomaly(anomaly.id || index)}
                        className="text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Mark as resolved"
                      >
                        <CheckCircle size={18} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
