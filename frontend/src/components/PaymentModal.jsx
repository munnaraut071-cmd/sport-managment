import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, Smartphone, CheckCircle, Loader2, ShieldCheck, 
  AlertCircle, Lock, QrCode
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, amount, onSuccess, title = "Secure Payment" }) {
  const [method, setMethod] = useState('card'); // 'card' or 'upi'
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  // UPI details
  const [upiId, setUpiId] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setProcessing(false);
      setSuccess(false);
      setError(null);
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setName('');
      setUpiId('');
    }
  }, [isOpen]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    // Simulate network delay and payment processing
    setTimeout(() => {
      setProcessing(false);
      
      // Simulate validation (e.g., CVV must be 3 digits)
      if (method === 'card' && cvv.length !== 3 && cvv.length !== 4) {
        setError('Invalid CVV number');
        return;
      }
      if (method === 'upi' && !upiId.includes('@')) {
        setError('Invalid UPI ID');
        return;
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        onSuccess(method);
      }, 1500); // Wait for success animation before closing
    }, 2000);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !processing && !success) onClose();
    }}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              {title}
            </h2>
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{amount}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Successful</h3>
                  <p className="text-slate-500 dark:text-gray-400 mt-2">Thank you! Your payment of ₹{amount} has been processed.</p>
                </div>
              </motion.div>
            ) : processing ? (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                  <Loader2 className="w-16 h-16 text-emerald-500 animate-spin relative z-10" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Processing Payment...</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Please do not close this window</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Tabs value={method} onValueChange={setMethod} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-800">
                    <TabsTrigger value="card" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <CreditCard className="w-4 h-4 mr-2" /> Card
                    </TabsTrigger>
                    <TabsTrigger value="upi" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                      <Smartphone className="w-4 h-4 mr-2" /> UPI
                    </TabsTrigger>
                  </TabsList>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  <form onSubmit={handlePayment}>
                    <TabsContent value="card" className="space-y-4 outline-none">
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input 
                          id="cardName" 
                          placeholder="John Doe" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <div className="relative">
                          <Input 
                            id="cardNumber" 
                            placeholder="0000 0000 0000 0000" 
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            required
                            className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 pl-10"
                          />
                          <CreditCard className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                          <Input 
                            id="expiry" 
                            placeholder="MM/YY" 
                            maxLength={5}
                            value={expiry}
                            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                            required
                            className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input 
                            id="cvv" 
                            type="password" 
                            placeholder="•••" 
                            maxLength={4}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                            required
                            className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="upi" className="space-y-6 outline-none">
                      <div className="flex justify-center py-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
                          <QrCode className="w-32 h-32 text-slate-800" />
                          <p className="text-xs font-mono text-slate-500">Scan to pay ₹{amount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-px bg-gray-200 dark:bg-slate-800 flex-1"></div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Or enter UPI ID</span>
                        <div className="h-px bg-gray-200 dark:bg-slate-800 flex-1"></div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="upiId">UPI ID</Label>
                        <Input 
                          id="upiId" 
                          placeholder="username@bank" 
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          required={method === 'upi'}
                          className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
                        />
                      </div>
                    </TabsContent>

                    <button 
                      type="submit" 
                      className="relative w-full mt-8 h-14 rounded-xl font-bold text-white text-base overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 group-hover:from-emerald-600 group-hover:to-teal-600 transition-all duration-300" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12" />
                      </div>
                      <div className="absolute inset-0 rounded-xl shadow-lg shadow-emerald-500/40" />
                      <span className="relative flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        Pay ₹{amount} Securely
                        <ShieldCheck className="w-4 h-4 opacity-80" />
                      </span>
                    </button>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      256-bit SSL Encrypted · Safe &amp; Secure
                    </div>
                  </form>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
