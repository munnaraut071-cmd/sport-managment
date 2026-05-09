import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, MapPin, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { tournamentsAPI } from '@/services/api';

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    startDate: '',
    endDate: '',
    location: '',
    description: ''
  });
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
    try {
      const response = await tournamentsAPI.create({
        ...newTournament,
        status: 'draft',
        teams: 0
      });
      setTournaments([...tournaments, response.data.data]);
      setShowAddDialog(false);
      setNewTournament({ name: '', startDate: '', endDate: '', location: '', description: '' });
      toast({ title: 'Tournament added successfully!' });
    } catch (error) {
      toast({ title: 'Failed to add tournament', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this tournament?')) {
      try {
        await tournamentsAPI.delete(id);
        setTournaments(tournaments.filter(t => t._id !== id));
        toast({ title: 'Tournament deleted' });
      } catch (error) {
        toast({ title: 'Failed to delete tournament', variant: 'destructive' });
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'ongoing': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'completed': return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400';
      default: return '';
    }
  };

  const filteredTournaments = tournaments.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-emerald-500" />
            Tournaments
          </h1>
          <p className="text-slate-500 mt-1">Manage sports tournaments and events</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Tournament Name"
                value={newTournament.name}
                onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                className="bg-gray-50 dark:bg-slate-800"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={newTournament.startDate}
                  onChange={(e) => setNewTournament({ ...newTournament, startDate: e.target.value })}
                  className="bg-gray-50 dark:bg-slate-800"
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={newTournament.endDate}
                  onChange={(e) => setNewTournament({ ...newTournament, endDate: e.target.value })}
                  className="bg-gray-50 dark:bg-slate-800"
                />
              </div>
              <Input
                placeholder="Location"
                value={newTournament.location}
                onChange={(e) => setNewTournament({ ...newTournament, location: e.target.value })}
                className="bg-gray-50 dark:bg-slate-800"
              />
              <Input
                placeholder="Description"
                value={newTournament.description}
                onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                className="bg-gray-50 dark:bg-slate-800"
              />
              <Button onClick={handleAddTournament} className="w-full bg-emerald-500 hover:bg-emerald-600">
                Create Tournament
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: tournaments.length, icon: Trophy },
          { label: 'Upcoming', value: tournaments.filter(t => t.status === 'upcoming').length, icon: Calendar },
          { label: 'Ongoing', value: tournaments.filter(t => t.status === 'ongoing').length, icon: Eye },
          { label: 'Completed', value: tournaments.filter(t => t.status === 'completed').length, icon: Trophy }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                  <stat.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder="Search tournaments..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800"
      />

      {/* Tournaments List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
          </div>
        ) : filteredTournaments.length === 0 ? (
          <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
            <CardContent className="p-12 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-500">No tournaments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTournaments.map((tournament, index) => (
            <motion.div
              key={tournament._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{tournament.name}</h3>
                        <Badge className={getStatusColor(tournament.status)}>
                          {tournament.status}
                        </Badge>
                      </div>
                      <p className="text-slate-500 mb-4">{tournament.description}</p>
                      <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {tournament.location}
                        </span>
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {tournament.teams} Teams
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tournament._id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tournaments;
