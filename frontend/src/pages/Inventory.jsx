import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Filter, Plus, Edit, Trash2, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { kitsAPI } from '@/services/api';

const Inventory = () => {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
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

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this kit?')) {
      try {
        await kitsAPI.delete(id);
        setKits(kits.filter(k => k._id !== id));
        toast({ title: 'Kit deleted successfully' });
      } catch (error) {
        toast({ title: 'Failed to delete kit', variant: 'destructive' });
      }
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
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="h-4 w-4 mr-2" />
          Add New Kit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Kits', value: stats.total, icon: Package, color: 'blue' },
          { label: 'Available', value: stats.available, icon: CheckCircle, color: 'emerald' },
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
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-500`} />
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
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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
                      <span className="text-3xl">{kit.emoji || '📦'}</span>
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
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(kit._id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;
