import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Filter, Plus, Edit, Trash2, AlertTriangle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { kitsAPI } from '@/services/api';

const Inventory = () => {
  const { isAdmin } = useAuth();
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingKit, setEditingKit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [kitToDelete, setKitToDelete] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [newKit, setNewKit] = useState({
    name: '',
    category: 'Cricket',
    quantity: 1,
    available: 1,
    condition: 'good',
    status: 'active'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchKits();
  }, []);

  const fetchKits = async () => {
    try {
      setLoading(true);
      const response = await kitsAPI.getAll();
      setKits(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching kits:', error);
      toast({ title: 'Failed to load inventory', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!isAdmin) {
      toast({ title: 'Admin access required', variant: 'destructive' });
      return;
    }
    if (!editingKit.name) {
      toast({ title: 'Kit name is required', variant: 'destructive' });
      return;
    }

    try {
      setUpdating(true);
      const response = await kitsAPI.update(editingKit._id, editingKit);
      const updatedKit = response.data?.data || response.data;
      if (updatedKit) {
        setKits(prev => prev.map(k => k._id === updatedKit._id ? updatedKit : k));
        setShowEditModal(false);
        setEditingKit(null);
        toast({ title: 'Kit updated successfully!' });
      }
    } catch (error) {
      console.error('Update failed:', error);
      toast({ title: 'Failed to update kit', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleCreate = async () => {
    if (!isAdmin) {
      toast({ title: 'Admin access required', variant: 'destructive' });
      return;
    }
    if (!newKit.name) {
      toast({ title: 'Kit name is required', variant: 'destructive' });
      return;
    }

    try {
      setUpdating(true);
      const response = await kitsAPI.create(newKit);
      const createdKit = response.data?.data || response.data;
      if (createdKit) {
        setKits(prev => [createdKit, ...prev]);
        setShowCreateModal(false);
        setNewKit({
          name: '',
          category: 'Cricket',
          quantity: 1,
          available: 1,
          condition: 'good',
          status: 'active'
        });
        toast({ title: 'Kit created successfully!' });
      }
    } catch (error) {
      console.error('Create failed:', error);
      toast({ title: 'Failed to create kit', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!isAdmin) {
      toast({ title: 'Admin access required', variant: 'destructive' });
      return;
    }
    if (!kitToDelete) return;
    try {
      setUpdating(true);
      await kitsAPI.delete(kitToDelete._id);
      setKits(kits.filter(k => k._id !== kitToDelete._id));
      setShowDeleteDialog(false);
      setKitToDelete(null);
      toast({ title: 'Kit deleted successfully' });
    } catch (error) {
      toast({ title: 'Failed to delete kit', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const filteredKits = kits.filter(kit => {
    const matchesSearch = kit.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         kit.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || kit.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(kits.map(k => k.category))];

  const stats = {
    total: kits.length,
    available: kits.reduce((sum, k) => sum + (k.available || 0), 0),
    lowStock: kits.filter(k => (k.available || 0) < 5).length,
    outOfStock: kits.filter(k => (k.available || 0) === 0).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-emerald-500" />
            Inventory Management
          </h1>
          <p className="text-slate-500 mt-1">Manage all sports kits and equipment</p>
        </div>
          <motion.button
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            onClick={() => isAdmin && setShowCreateModal(true)}
            disabled={!isAdmin}
            aria-label="Add New Kit"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Kit
          </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Kits', value: stats.total, icon: Package, color: 'blue' },
          { label: 'Available', value: stats.available, icon: null, color: 'emerald' },
          { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'amber' },
          { label: 'Out of Stock', value: stats.outOfStock, icon: Package, color: 'red' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-500/10`}>
                  {stat.icon && (
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-500`} />
                  )}
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

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search kits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px] bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kits Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKits.map((kit, index) => (
            <motion.div
              key={kit._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{
                        kit.emoji || (
                          kit.category === 'Cricket' ? '🏏' :
                          kit.category === 'Football' ? '⚽' :
                          kit.category === 'Badminton' ? '🏸' :
                          kit.category === 'Basketball' ? '🏀' : '📦'
                        )
                      }</span>
                      <div>
                        <h3 className="font-semibold">{kit.name}</h3>
                        <p className="text-sm text-slate-500">{kit.category}</p>
                      </div>
                    </div>
                    <Badge className={`
                      ${kit.available === 0 ? 'bg-red-100 text-red-700' : ''}
                      ${kit.available < 5 ? 'bg-amber-100 text-amber-700' : ''}
                      ${kit.available >= 5 ? 'bg-emerald-100 text-emerald-700' : ''}
                    `}>
                      {kit.available} / {kit.quantity}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Condition</span>
                      <span className="capitalize">{kit.condition}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Status</span>
                      <span className="capitalize">{kit.status}</span>
                    </div>
                  </div>

                  <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full ${
                        kit.available === 0 ? 'bg-red-500' :
                        kit.available < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(kit.available / kit.quantity) * 100}%` }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setEditingKit({ ...kit });
                        setShowEditModal(true);
                      }}
                      disabled={!isAdmin}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setKitToDelete(kit);
                        setShowDeleteDialog(true);
                      }}
                      disabled={!isAdmin}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      {/* Create Kit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Add New Kit</DialogTitle>
            <DialogDescription>Create a new kit for the inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kit Name</label>
              <Input
                value={newKit.name}
                onChange={(e) => setNewKit({ ...newKit, name: e.target.value })}
                placeholder="Kit Name"
                className="bg-gray-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={newKit.category} onValueChange={(val) => setNewKit({ ...newKit, category: val })}>
                <SelectTrigger className="bg-gray-50 dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cricket">Cricket</SelectItem>
                  <SelectItem value="Football">Football</SelectItem>
                  <SelectItem value="Badminton">Badminton</SelectItem>
                  <SelectItem value="Basketball">Basketball</SelectItem>
                  <SelectItem value="Tennis">Tennis</SelectItem>
                  <SelectItem value="Hockey">Hockey</SelectItem>
                  <SelectItem value="Volleyball">Volleyball</SelectItem>
                  <SelectItem value="Table Tennis">Table Tennis</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  value={newKit.quantity}
                  onChange={(e) => setNewKit({ ...newKit, quantity: parseInt(e.target.value) || 0 })}
                  className="bg-gray-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Available</label>
                <Input
                  type="number"
                  value={newKit.available}
                  onChange={(e) => setNewKit({ ...newKit, available: parseInt(e.target.value) || 0 })}
                  className="bg-gray-50 dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Condition</label>
              <Select value={newKit.condition} onValueChange={(val) => setNewKit({ ...newKit, condition: val })}>
                <SelectTrigger className="bg-gray-50 dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newKit.status} onValueChange={(val) => setNewKit({ ...newKit, status: val })}>
                <SelectTrigger className="bg-gray-50 dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={updating}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {updating ? 'Creating...' : 'Create Kit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Kit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Edit Kit Details</DialogTitle>
            <DialogDescription>Update the information for this kit</DialogDescription>
          </DialogHeader>
          {editingKit && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kit Name</label>
                <Input
                  value={editingKit.name}
                  onChange={(e) => setEditingKit({ ...editingKit, name: e.target.value })}
                  placeholder="Kit Name"
                  className="bg-gray-50 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    value={editingKit.quantity}
                    onChange={(e) => setEditingKit({ ...editingKit, quantity: parseInt(e.target.value) || 0 })}
                    className="bg-gray-50 dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Available</label>
                  <Input
                    type="number"
                    value={editingKit.available}
                    onChange={(e) => setEditingKit({ ...editingKit, available: parseInt(e.target.value) || 0 })}
                    className="bg-gray-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Condition</label>
                <Select 
                  value={editingKit.condition} 
                  onValueChange={(val) => setEditingKit({ ...editingKit, condition: val })}
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={editingKit.status} 
                  onValueChange={(val) => setEditingKit({ ...editingKit, status: val })}
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate} 
                  disabled={updating}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>This action cannot be undone. Are you sure you want to delete this kit?</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{kitToDelete?.name}</span>? 
              This action cannot be undone and will remove all associated records.
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
                onClick={handleConfirmDelete}
                disabled={updating}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
              >
                {updating ? 'Deleting...' : 'Delete Kit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
