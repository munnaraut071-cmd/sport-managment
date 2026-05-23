import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, Users, MapPin, Plus, Edit, Trash2, Eye, Search, Filter, Sparkles, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { tournamentsAPI } from '@/services/api';

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSport, setFilterSport] = useState('all');
  const [newTournament, setNewTournament] = useState({
    eventName: '',
    startDate: '',
    endDate: '',
    location: '',
    sport: '',
    description: '',
    eventType: 'inter-college',
    priority: 'medium'
  });
  const [viewingTournament, setViewingTournament] = useState(null);
  const [editingTournament, setEditingTournament] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentsAPI.getAll();
      setTournaments(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({ title: 'Failed to load tournaments', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTournament = async () => {
    if (!newTournament.eventName || !newTournament.startDate || !newTournament.endDate) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please provide an event name, start date, and end date.',
        variant: 'destructive' 
      });
      return;
    }
    try {
      setSubmitting(true);
      const response = await tournamentsAPI.create({
        ...newTournament,
        reservedKits: [],
      });
      
      const createdTournament = response.data?.data || response.data;
      if (createdTournament) {
        setTournaments(prev => [createdTournament, ...prev]);
        setShowAddDialog(false);
        setNewTournament({ 
          eventName: '', startDate: '', endDate: '', location: '',
          sport: '', description: '', eventType: 'inter-college', priority: 'medium'
        });
        toast({ title: '🏆 Tournament Scheduled!', description: `${newTournament.eventName} has been added successfully.` });
      }
    } catch (error) {
      console.error('Tournament creation failed:', error);
      toast({ 
        title: 'Creation Failed', 
        description: error.response?.data?.message || 'Check if you have admin permissions and fill all required fields.',
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTournament = async () => {
    if (!editingTournament.eventName || !editingTournament.startDate || !editingTournament.endDate) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please provide an event name, start date, and end date.',
        variant: 'destructive' 
      });
      return;
    }
    try {
      const payload = {
        ...editingTournament,
        // Ensure backend compatibility
        eventName: editingTournament.eventName || editingTournament.name,
        eventType: editingTournament.eventType || editingTournament.category
      };
      const response = await tournamentsAPI.update(editingTournament._id, payload);
      const updatedTournament = response.data?.data || response.data;
      if (updatedTournament) {
        setTournaments(prev => prev.map(t => t._id === updatedTournament._id ? updatedTournament : t));
        setShowEditDialog(false);
        setEditingTournament(null);
        toast({ title: 'Tournament updated successfully!' });
      }
    } catch (error) {
      console.error('Tournament update failed:', error);
      toast({ 
        title: 'Update Failed', 
        description: error.response?.data?.message || 'Failed to update tournament details.',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await tournamentsAPI.delete(id);
      setTournaments(tournaments.filter(t => t._id !== id));
      toast({ title: 'Tournament deleted successfully' });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({ title: 'Failed to delete tournament', variant: 'destructive' });
    }
  };

  const getStatusInfo = (status, startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let activeStatus = status;
    if (now >= start && now <= end) activeStatus = 'ongoing';
    else if (now > end) activeStatus = 'completed';
    else if (now < start) activeStatus = 'upcoming';

    switch (activeStatus) {
      case 'upcoming': return { color: 'text-blue-500 bg-blue-500/10', icon: Calendar, label: 'Upcoming' };
      case 'ongoing': return { color: 'text-emerald-500 bg-emerald-500/10', icon: Clock, label: 'Ongoing' };
      case 'completed': return { color: 'text-slate-500 bg-slate-500/10', icon: CheckCircle2, label: 'Completed' };
      default: return { color: 'text-slate-500 bg-slate-500/10', icon: AlertCircle, label: 'Draft' };
    }
  };

  const handleDeleteTournament = async () => {
    if (!tournamentToDelete) return;
    try {
      setUpdating(true);
      await tournamentsAPI.delete(tournamentToDelete._id || tournamentToDelete.id);
      setTournaments(tournaments.filter(t => (t._id !== tournamentToDelete._id && t.id !== tournamentToDelete.id)));
      setShowDeleteDialog(false);
      setTournamentToDelete(null);
      setViewingTournament(null);
      toast({ title: 'Tournament deleted successfully' });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({ title: 'Failed to delete tournament', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'cricket': return '🏏';
      case 'football': return '⚽';
      case 'basketball': return '🏀';
      case 'tennis': return '🎾';
      case 'badminton': return '🏸';
      case 'volleyball': return '🏐';
      case 'kabaddi': return '🤼';
      case 'athletics': return '🏃';
      default: return '🏆';
    }
  };

  const getCategoryName = (category) => {
    const names = {
      'cricket': 'Cricket',
      'football': 'Football',
      'basketball': 'Basketball',
      'tennis': 'Tennis',
      'badminton': 'Badminton',
      'volleyball': 'Volleyball',
      'kabaddi': 'Kabaddi',
      'athletics': 'Athletics',
      'inter-college': 'Inter-College',
      'intra-college': 'Intra-College',
      'inter-department': 'Inter-Department',
      'state-level': 'State Level',
      'national-level': 'National Level',
      'practice': 'Practice',
      'friendly': 'Friendly',
      'other': 'Other'
    };
    return names[category?.toLowerCase()] || category || 'Sports';
  };

  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = 
      (t.eventName || t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.eventType || t.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.sport || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSport = filterSport === 'all' || t.sport === filterSport || t.eventType === filterSport;
    
    return matchesSearch && matchesStatus && matchesSport;
  });

  return (
    <div className="w-full min-h-screen space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy size={30} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Tournaments</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Schedule and manage sports events</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={showAddDialog} onOpenChange={(open) => { if (!submitting) setShowAddDialog(open); }}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 gap-2">
                <Plus size={20} />
                Schedule Tournament
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white dark:bg-[#0F172A] border-none ring-1 ring-gray-200 dark:ring-slate-800 rounded-3xl p-0 overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                    🏆
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">New Tournament</h2>
                    <p className="text-orange-100 text-sm">Fill in the details to schedule a sports event</p>
                  </div>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-5">
                {/* Event Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Event Name *</label>
                  <Input
                    placeholder="e.g. Inter-College Cricket Trophy 2025"
                    value={newTournament.eventName}
                    onChange={(e) => setNewTournament({ ...newTournament, eventName: e.target.value })}
                    className="h-11 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                {/* Sport + Event Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Sport</label>
                    <select
                      value={newTournament.sport}
                      onChange={(e) => setNewTournament({ ...newTournament, sport: e.target.value })}
                      className="w-full h-11 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Sport</option>
                      <option value="cricket">🏏 Cricket</option>
                      <option value="football">⚽ Football</option>
                      <option value="basketball">🏀 Basketball</option>
                      <option value="badminton">🏸 Badminton</option>
                      <option value="tennis">🎾 Tennis</option>
                      <option value="volleyball">🏐 Volleyball</option>
                      <option value="kabaddi">🤼 Kabaddi</option>
                      <option value="athletics">🏃 Athletics</option>
                      <option value="other">🏆 Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Event Type</label>
                    <select
                      value={newTournament.eventType}
                      onChange={(e) => setNewTournament({ ...newTournament, eventType: e.target.value })}
                      className="w-full h-11 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white"
                    >
                      <option value="inter-college">Inter-College</option>
                      <option value="internal">Intra-College</option>
                      <option value="inter-department">Inter-Department</option>
                      <option value="state-level">State Level</option>
                      <option value="national-level">National Level</option>
                      <option value="practice">Practice Match</option>
                      <option value="friendly">Friendly Match</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Start Date *</label>
                    <Input
                      type="date"
                      value={newTournament.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewTournament({ ...newTournament, startDate: e.target.value })}
                      className="h-11 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">End Date *</label>
                    <Input
                      type="date"
                      value={newTournament.endDate}
                      min={newTournament.startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewTournament({ ...newTournament, endDate: e.target.value })}
                      className="h-11 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                {/* Location + Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Venue / Location</label>
                    <Input
                      placeholder="e.g. Ground A, Stadium"
                      value={newTournament.location}
                      onChange={(e) => setNewTournament({ ...newTournament, location: e.target.value })}
                      className="h-11 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Priority</label>
                    <select
                      value={newTournament.priority}
                      onChange={(e) => setNewTournament({ ...newTournament, priority: e.target.value })}
                      className="w-full h-11 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
                  <textarea
                    placeholder="Brief description about this tournament, rules, or any special notes..."
                    value={newTournament.description}
                    onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none text-gray-900 dark:text-white placeholder-slate-400"
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleAddTournament}
                  disabled={submitting}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl font-bold text-white shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all gap-2"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scheduling...</>
                  ) : (
                    <><Plus size={18} /> Schedule Tournament</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: tournaments.length, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Upcoming', value: tournaments.filter(t => t.status === 'upcoming').length, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Ongoing', value: tournaments.filter(t => t.status === 'ongoing').length, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Completed', value: tournaments.filter(t => t.status === 'completed').length, icon: CheckCircle2, color: 'text-slate-500', bg: 'bg-slate-500/10' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white dark:bg-[#0F172A] border-none ring-1 ring-gray-200 dark:ring-slate-800 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 dark:text-white leading-tight">{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <Card className="bg-white dark:bg-[#0F172A] border-none ring-1 ring-gray-200 dark:ring-slate-800 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 dark:border-slate-800 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search tournaments or venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-11 bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-11 rounded-xl gap-2 text-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800">
                    <Filter size={18} />
                    Filter
                    {(filterStatus !== 'all' || filterSport !== 'all') && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white dark:bg-[#0F172A] border-none ring-1 ring-gray-200 dark:ring-slate-800 rounded-2xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Filter Tournaments</DialogTitle>
                    <DialogDescription>Filter tournaments by status and sport type</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full h-11 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">Sport</label>
                      <select
                        value={filterSport}
                        onChange={(e) => setFilterSport(e.target.value)}
                        className="w-full h-11 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Sports</option>
                        <option value="cricket">🏏 Cricket</option>
                        <option value="football">⚽ Football</option>
                        <option value="basketball">🏀 Basketball</option>
                        <option value="badminton">🏸 Badminton</option>
                        <option value="tennis">🎾 Tennis</option>
                        <option value="volleyball">🏐 Volleyball</option>
                        <option value="kabaddi">🤼 Kabaddi</option>
                        <option value="athletics">🏃 Athletics</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => {
                          setFilterStatus('all');
                          setFilterSport('all');
                          setShowFilterDialog(false);
                        }}
                        variant="outline"
                        className="flex-1 h-11 rounded-xl"
                      >
                        Clear Filters
                      </Button>
                      <Button
                        onClick={() => setShowFilterDialog(false)}
                        className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-500 font-medium animate-pulse">Fetching tournament data...</p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6">
                <Trophy size={40} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Tournaments Found</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">Try adjusting your search or schedule a new event.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {filteredTournaments.map((tournament, index) => {
                  const statusInfo = getStatusInfo(tournament.status, tournament.startDate, tournament.endDate);
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={tournament._id}
                      className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-all p-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-2xl ${statusInfo.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                            {getCategoryIcon(tournament.sport || tournament.eventType || tournament.category)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                                {tournament.eventName || tournament.name}
                              </h3>
                              <Badge className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none ${statusInfo.color}`}>
                                {statusInfo.label}
                              </Badge>
                              {tournament.sport && (
                                <Badge variant="outline" className="px-2 py-0.5 rounded-full text-[10px] font-medium border-gray-300 dark:border-gray-600">
                                  {getCategoryName(tournament.sport)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-1 max-w-xl">
                              {tournament.description || 'No description provided for this event.'}
                            </p>
                            <div className="flex flex-wrap items-center gap-6 text-sm">
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                                <Calendar className="h-4 w-4 text-emerald-500" />
                                {new Date(tournament.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                                <MapPin className="h-4 w-4 text-orange-500" />
                                {tournament.location || 'Main Ground'}
                              </div>
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                                <Users className="h-4 w-4 text-blue-500" />
                                {tournament.participants?.length || tournament.teams || 0} Participating Teams
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setViewingTournament(tournament)}
                            className="h-10 w-10 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-200"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setEditingTournament({ ...tournament });
                              setShowEditDialog(true);
                            }}
                            className="h-10 w-10 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-all duration-200"
                            title="Edit Tournament"
                          >
                            <Edit size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setTournamentToDelete(tournament);
                              setShowDeleteDialog(true);
                            }}
                            className="h-10 w-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                            title="Delete Tournament"
                          >
                            <Trash2 size={18} />
                          </Button>
                          <div className="w-10 h-10 flex items-center justify-center text-slate-300">
                            <ChevronRight size={20} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tournament Details Modal */}
      <Dialog open={!!viewingTournament} onOpenChange={(open) => !open && setViewingTournament(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#0F172A] border-none ring-1 ring-gray-200 dark:ring-slate-800 rounded-3xl overflow-hidden p-0">
          {viewingTournament && (
            <div className="flex flex-col">
              {/* Modal Header/Banner */}
              <div className={`h-32 ${getStatusInfo(viewingTournament.status, viewingTournament.startDate, viewingTournament.endDate).color.replace('text-', 'bg-').split(' ')[1]} p-8 flex items-end justify-between relative`}>
                <div className="flex items-center gap-4 mb-[-24px]">
                  <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center text-4xl border-4 border-white dark:border-[#0F172A]">
                    {getCategoryIcon(viewingTournament.eventType || viewingTournament.category)}
                  </div>
                  <div className="pb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                      {viewingTournament.eventName || viewingTournament.name}
                    </h2>
                    <Badge className="mt-1 bg-white/20 backdrop-blur-md border-none text-gray-800 dark:text-white uppercase text-[10px] font-black tracking-widest">
                      {viewingTournament.eventType || viewingTournament.category || 'Tournament'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="pt-12 p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</p>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                      <Calendar size={16} className="text-emerald-500" />
                      {new Date(viewingTournament.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</p>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                      <Calendar size={16} className="text-orange-500" />
                      {new Date(viewingTournament.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                      <MapPin size={16} className="text-blue-500" />
                      {viewingTournament.location || 'Main Ground'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Description</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                    {viewingTournament.description || 'No detailed description available for this tournament event.'}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                      <Trophy size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Priority Level</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white capitalize">{viewingTournament.priority || 'Medium'}</p>
                    </div>
                  </div>
                  <Badge className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none ${getStatusInfo(viewingTournament.status, viewingTournament.startDate, viewingTournament.endDate).color}`}>
                    {getStatusInfo(viewingTournament.status, viewingTournament.startDate, viewingTournament.endDate).label}
                  </Badge>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={() => {
                      setTournamentToDelete(viewingTournament);
                      setShowDeleteDialog(true);
                    }}
                    className="h-12 w-12 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all"
                    title="Delete Event"
                  >
                    <Trash2 size={20} />
                  </Button>
                  <Button 
                    onClick={() => setViewingTournament(null)}
                    className="flex-[0.5] h-12 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-bold transition-all"
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditingTournament({ ...viewingTournament });
                      setShowEditDialog(true);
                      setViewingTournament(null);
                    }}
                    className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all gap-2"
                  >
                    <Edit size={18} />
                    Edit Event
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#0F172A] border-none ring-1 ring-gray-200 dark:ring-slate-800 rounded-2xl p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Delete Tournament?</DialogTitle>
            <DialogDescription>This action cannot be undone. Are you sure you want to delete this tournament?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setTournamentToDelete(null);
                }}
                variant="outline"
                className="flex-1 h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTournament}
                disabled={updating}
                className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white rounded-xl"
              >
                {updating ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tournament Modal */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#0F172A] border-none ring-1 ring-gray-200 dark:ring-slate-800 rounded-3xl overflow-hidden p-0">
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Edit className="text-emerald-500" size={24} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Edit Tournament</DialogTitle>
                <DialogDescription>Update the details for this sports event</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {editingTournament && (
            <div className="p-8 pt-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Event Name</label>
                  <Input 
                    value={editingTournament.eventName || editingTournament.name || ''} 
                    onChange={(e) => setEditingTournament({...editingTournament, eventName: e.target.value})}
                    placeholder="Inter-College Football Finals"
                    className="h-12 bg-gray-50 dark:bg-slate-800 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Start Date</label>
                  <Input 
                    type="date"
                    value={editingTournament.startDate ? editingTournament.startDate.split('T')[0] : ''} 
                    onChange={(e) => setEditingTournament({...editingTournament, startDate: e.target.value})}
                    className="h-12 bg-gray-50 dark:bg-slate-800 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">End Date</label>
                  <Input 
                    type="date"
                    value={editingTournament.endDate ? editingTournament.endDate.split('T')[0] : ''} 
                    onChange={(e) => setEditingTournament({...editingTournament, endDate: e.target.value})}
                    className="h-12 bg-gray-50 dark:bg-slate-800 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Location</label>
                  <Input 
                    value={editingTournament.location || ''} 
                    onChange={(e) => setEditingTournament({...editingTournament, location: e.target.value})}
                    placeholder="University Main Stadium"
                    className="h-12 bg-gray-50 dark:bg-slate-800 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Event Type</label>
                  <select 
                    value={editingTournament.eventType || editingTournament.category || 'inter-college'} 
                    onChange={(e) => setEditingTournament({...editingTournament, eventType: e.target.value})}
                    className="w-full h-12 bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  >
                    <option value="inter-college">Inter-College</option>
                    <option value="inter-department">Inter-Department</option>
                    <option value="state-level">State Level</option>
                    <option value="national-level">National Level</option>
                    <option value="friendly">Friendly Match</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label>
                  <textarea 
                    value={editingTournament.description || ''} 
                    onChange={(e) => setEditingTournament({...editingTournament, description: e.target.value})}
                    placeholder="Details about the tournament rules, teams, and schedule..."
                    className="w-full min-h-[100px] bg-gray-50 dark:bg-slate-800 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingTournament(null);
                  }}
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateTournament}
                  className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold shadow-lg shadow-emerald-500/20"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* View Tournament Details Modal */}
      <Dialog open={!!viewingTournament} onOpenChange={(open) => !open && setViewingTournament(null)}>
        <DialogContent className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Trophy className="text-amber-500" />
              Tournament Details
            </DialogTitle>
          </DialogHeader>
          {viewingTournament && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Event Name</label>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{viewingTournament.eventName || viewingTournament.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                    <p className="text-slate-700 dark:text-slate-300 capitalize">{viewingTournament.eventType || viewingTournament.category}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Location</label>
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <MapPin size={14} />
                      <p>{viewingTournament.location}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                    <div className="mt-1">
                      {(() => {
                        const info = getStatusInfo(viewingTournament.status, viewingTournament.startDate, viewingTournament.endDate);
                        const StatusIcon = info.icon;
                        return (
                          <Badge className={`${info.color} border-none flex items-center w-fit gap-1 px-3 py-1`}>
                            <StatusIcon size={12} />
                            {info.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Dates</label>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Calendar size={14} />
                      <p>{format(new Date(viewingTournament.startDate), 'MMM dd, yyyy')} - {format(new Date(viewingTournament.endDate), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {viewingTournament.description || 'No description provided for this event.'}
                    </p>
                  </div>
                </div>
              </div>

              {viewingTournament.kits && viewingTournament.kits.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Allocated Kits</label>
                  <div className="flex flex-wrap gap-2">
                    {viewingTournament.kits.map((kit, idx) => (
                      <Badge key={idx} variant="outline" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {kit.name} ({kit.quantity})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button variant="outline" onClick={() => setViewingTournament(null)}>
                  Close
                </Button>
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => {
                    const tournamentToEdit = { ...viewingTournament };
                    setViewingTournament(null);
                    setEditingTournament(tournamentToEdit);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit size={14} className="mr-2" />
                  Edit Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-red-500">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{tournamentToDelete?.eventName || tournamentToDelete?.name}</span>? 
              This action cannot be undone and will cancel all kit reservations for this event.
            </p>
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)} 
                className="flex-1"
                disabled={updating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteTournament}
                disabled={updating}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
              >
                {updating ? 'Deleting...' : 'Delete Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tournaments;
