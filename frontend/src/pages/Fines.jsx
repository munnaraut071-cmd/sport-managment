import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, AlertCircle, CheckCircle, Clock, CreditCard, 
  ShieldAlert, User, Package, AlertTriangle, Loader2, RefreshCw 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { finesAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function Fines() {
  const [fines, setFines] = useState([]);
  const [myFines, setMyFines] = useState([]);
  const [outstanding, setOutstanding] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payDialog, setPayDialog] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Get all fines (admin) or user's fines
      const finesRes = await finesAPI.getAll();
      setFines(finesRes.data.data || []);

      // Get my outstanding fines
      const outstandingRes = await finesAPI.getMyFines();
      setOutstanding(outstandingRes.data.data);
      setMyFines(outstandingRes.data.data.fines || []);

      // Get statistics (admin only)
      if (user?.role === 'admin') {
        const statsRes = await finesAPI.getStats();
        setStatistics(statsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch fines:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch fines data', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (fineId, paymentMethod) => {
    try {
      await finesAPI.markPaid(fineId);
      toast({ 
        title: 'Success', 
        description: `Payment of ₹${myFines.find(f => f._id === fineId)?.fineAmount} processed successfully`,
        variant: 'success'
      });
      setPayDialog(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Payment failed', variant: 'destructive' });
    }
  };

  const handleDispute = async (fineId, reason) => {
    try {
      await api.post(`/fines/${fineId}/dispute`, { reason });
      toast({ title: 'Dispute Raised', description: 'Your dispute has been submitted for review' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to raise dispute', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
      paid: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
      waived: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
      disputed: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30'
    };
    return badges[status] || 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="w-full h-full space-y-8 bg-slate-50 dark:bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Fine & Payment System
            </h1>
            <p className="text-base text-slate-500 dark:text-gray-400">Manage late return fines and payments</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchData}
          className="bg-white dark:bg-[#111827] hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw size={16} />
          Refresh
        </motion.button>
      </div>

      {/* Outstanding Summary */}
      {outstanding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-500/20 dark:to-orange-500/20 border-red-200 dark:border-red-500/30 shadow-sm dark:shadow-none">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-gray-400">Your Outstanding Fines</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{outstanding.totalOutstanding}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">{outstanding.fineCount} pending fine(s)</p>
                  </div>
                </div>
                {outstanding.totalOutstanding > 0 && (
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Admin Statistics */}
      {user?.role === 'admin' && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: 'Total Fines', value: statistics.total || 0, subtitle: `₹${statistics.totalAmount || 0} total`, color: 'from-blue-500 to-blue-600' },
            { title: 'Pending', value: statistics.byStatus?.pending?.count || 0, subtitle: `₹${statistics.byStatus?.pending?.amount || 0}`, color: 'from-amber-500 to-amber-600' },
            { title: 'Paid', value: statistics.byStatus?.paid?.count || 0, subtitle: `₹${statistics.byStatus?.paid?.amount || 0}`, color: 'from-emerald-500 to-emerald-600' },
            { title: 'Disputed', value: statistics.byStatus?.disputed?.count || 0, subtitle: 'Awaiting review', color: 'from-orange-500 to-orange-600' },
          ].map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                <CardContent className="p-6">
                  <p className="text-slate-500 dark:text-gray-400 text-sm">{stat.title}</p>
                  <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
                  <p className="text-sm text-slate-400 dark:text-gray-500">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Tabs defaultValue="my-fines" className="w-full">
        <TabsList className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-800">
          <TabsTrigger value="my-fines" className="data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400">My Fines</TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="all-fines" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400">All Fines</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-fines" className="mt-6">
          <AnimatePresence mode="popLayout">
            {myFines.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 p-8 text-center shadow-sm dark:shadow-none">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-gray-900 dark:text-gray-300 text-lg font-semibold">No fines!</p>
                  <p className="text-slate-500 dark:text-gray-500">You have a clean record. Keep returning kits on time!</p>
                </Card>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {myFines.map((fine, index) => (
                  <motion.div
                    key={fine._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-colors shadow-sm dark:shadow-none">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                              <Package className="w-6 h-6 text-red-500 dark:text-red-400" />
                            </div>
                            <div>
                              <h3 className="text-gray-900 dark:text-white font-semibold">{fine.kit?.name || 'Unknown Kit'}</h3>
                              <p className="text-slate-500 dark:text-gray-400 text-sm">{fine.daysLate} days late</p>
                              <p className="text-slate-400 dark:text-gray-500 text-xs">Due: {fine.transaction?.dueDate ? new Date(fine.transaction.dueDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-500 dark:text-red-400">₹{fine.fineAmount}</p>
                            <Badge className={`${getStatusBadge(fine.status)} border text-xs capitalize`}>
                              {fine.status}
                            </Badge>
                          </div>
                        </div>

                        {fine.status === 'pending' && (
                          <div className="mt-4 flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Pay Now
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-gray-900 dark:text-white">Pay Fine</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <p className="text-slate-600 dark:text-gray-400">Fine Amount: <span className="text-gray-900 dark:text-white font-bold">₹{fine.fineAmount}</span></p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button onClick={() => handlePay(fine._id, 'upi')} className="bg-blue-500 hover:bg-blue-600 text-white">
                                      Pay via UPI
                                    </Button>
                                    <Button onClick={() => handlePay(fine._id, 'online')} className="bg-purple-500 hover:bg-purple-600 text-white">
                                      Pay Online
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" className="border-orange-300 dark:border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Dispute
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        {user?.role === 'admin' && (
          <TabsContent value="all-fines" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              {fines.slice(0, 20).map((fine, index) => (
                <motion.div
                  key={fine._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-colors shadow-sm dark:shadow-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-gray-900 dark:text-white font-semibold">{fine.user?.name || 'Unknown User'}</h3>
                            <p className="text-slate-500 dark:text-gray-400 text-sm">{fine.kit?.name || 'Unknown Kit'} • {fine.daysLate} days late</p>
                            <p className="text-slate-400 dark:text-gray-500 text-xs">{fine.user?.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900 dark:text-white">₹{fine.fineAmount}</p>
                          <Badge className={`${getStatusBadge(fine.status)} border text-xs capitalize`}>
                            {fine.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
