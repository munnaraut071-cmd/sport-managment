import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Plus, Edit, Trash2, Shield, User, Mail, Filter, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { usersAPI, authAPI } from '@/services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await authAPI.register(newUser);
      if (response.data.success) {
        setUsers([...users, response.data.data]);
        setShowAddDialog(false);
        setNewUser({ name: '', email: '', password: '', role: 'user' });
        toast({ title: 'User added successfully!' });
      }
    } catch (error) {
      toast({ title: 'Failed to add user', variant: 'destructive' });
    }
  };



  const handleUpdateUser = async () => {
    try {
      const response = await usersAPI.update(editingUser._id, editingUser);
      // Check if response.data.success or just response.data
      const updatedUser = response.data.data || response.data;
      if (updatedUser) {
        setUsers(users.map(u => u._id === editingUser._id ? updatedUser : u));
        setShowEditDialog(false);
        setEditingUser(null);
        toast({ title: 'User updated successfully!' });
      }
    } catch (error) {
      console.error('User update failed:', error);
      toast({ title: 'Failed to update user', variant: 'destructive' });
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await usersAPI.update(id, { role: newRole });
      setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
      toast({ title: 'Role updated' });
    } catch (error) {
      toast({ title: 'Failed to update role', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      setUpdating(true);
      await usersAPI.delete(userToDelete._id);
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setShowDeleteDialog(false);
      setUserToDelete(null);
      toast({ title: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({ title: 'Failed to delete user', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    staff: users.filter(u => u.role === 'staff').length,
    students: users.filter(u => u.role === 'user').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-500" />
            User Management
          </h1>
          <p className="text-slate-500 mt-1">Manage all system users and permissions</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account with appropriate permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="bg-gray-50 dark:bg-slate-800"
              />
              <Input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="bg-gray-50 dark:bg-slate-800"
              />
              <Input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="bg-gray-50 dark:bg-slate-800"
              />
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger className="bg-gray-50 dark:bg-slate-800">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Student/User</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddUser} className="w-full bg-emerald-500 hover:bg-emerald-600">
                Add User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users },
          { label: 'Admins', value: stats.admins, icon: Shield },
          { label: 'Staff', value: stats.staff, icon: User },
          { label: 'Students', value: stats.students, icon: User }
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

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="user">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user._id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="user">Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={`
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : ''}
                      ${user.role === 'staff' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : ''}
                      ${user.role === 'user' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}
                    `}>
                      {user.role}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingUser({ ...user });
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setUserToDelete(user);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="Full Name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="bg-gray-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="Email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="bg-gray-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">System Role</label>
                <Select value={editingUser.role} onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}>
                  <SelectTrigger className="bg-gray-50 dark:bg-slate-800">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Student/User</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete User Modal */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-red-500">Confirm Deletion</DialogTitle>
            <DialogDescription>This action cannot be undone. Are you sure you want to delete this user?</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{userToDelete?.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1" disabled={updating}>
                Cancel
              </Button>
              <Button 
                onClick={handleDelete} 
                disabled={updating}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {updating ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
