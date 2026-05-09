import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Trophy, AlertCircle, CheckCircle, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }));
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    
    // Validate this field on blur
    const newErrors = { ...errors };
    
    if (field === 'email' && !formData.email) {
      newErrors.email = 'Email is required';
    } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (field === 'password' && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (field === 'password' && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fix the errors in the form',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast({ 
          title: 'Login Successful!', 
          description: 'Welcome back to Sports Kits Management'
        });
        
        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem('rememberEmail', formData.email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
        
        navigate('/dashboard');
      } else {
        toast({ 
          title: 'Login Failed', 
          description: result.message || 'Please check your credentials',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ 
        title: 'Unexpected Error', 
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (type) => {
    const credentials = {
      admin: { email: 'admin@sportkits.com', password: 'admin23' },
      user: { email: 'user@sportkits.com', password: 'user23' }
    };
    
    setFormData({
      ...formData,
      ...credentials[type]
    });
    
    setErrors({});
    toast({ 
      title: 'Demo Credentials', 
      description: `Demo credentials filled for ${type}`
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
            rotate: [0, 45, 0]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, -30, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 3
          }}
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-violet-500 to-purple-600 rounded-full blur-[80px]" 
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)
            }}
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg lg:max-w-2xl relative z-10"
      >
        <Card className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 shadow-2xl shadow-emerald-500/10 p-6 sm:p-8 lg:p-12 relative overflow-hidden">
          <CardHeader className="space-y-3 text-center mb-6">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-500 flex items-center justify-center mb-6 lg:mb-8 shadow-xl shadow-emerald-500/30 relative group cursor-pointer"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white drop-shadow-lg" />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent leading-tight drop-shadow-lg">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-400 text-lg sm:text-xl lg:text-2xl mt-2 lg:mt-3 font-light">
                Sign in to manage your sports inventory
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <Label htmlFor="email" className="text-lg sm:text-xl lg:text-2xl text-slate-300 font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={`pl-12 sm:pl-14 h-12 sm:h-14 lg:h-16 text-base sm:text-lg lg:text-xl bg-slate-800/50 border-slate-600/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl ${
                      errors.email && touched.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    required
                  />
                  <AnimatePresence>
                    {errors.email && touched.email && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2"
                      >
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-red-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence>
                  {errors.email && touched.email && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-sm sm:text-base lg:text-lg mt-2"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <Label htmlFor="password" className="text-lg sm:text-xl lg:text-2xl text-slate-300 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`pl-12 sm:pl-14 pr-12 sm:pr-14 h-12 sm:h-14 lg:h-16 text-base sm:text-lg lg:text-xl bg-slate-800/50 border-slate-600/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl ${
                      errors.password && touched.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" /> : <Eye className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />}
                  </button>
                  <AnimatePresence>
                    {errors.password && touched.password && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-12 sm:right-14 top-1/2 -translate-y-1/2"
                      >
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-red-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence>
                  {errors.password && touched.password && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-sm sm:text-base lg:text-lg mt-2"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-between text-sm sm:text-base lg:text-lg"
              >
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-md border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                  />
                  <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                  Forgot password?
                </Link>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 sm:h-14 lg:h-16 text-base sm:text-lg lg:text-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-cyan-500 hover:from-emerald-600 hover:via-emerald-700 hover:to-cyan-600 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-semibold rounded-xl relative overflow-hidden group"
                  disabled={loading}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {loading ? (
                    <span className="flex items-center gap-3 relative z-10">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center gap-2">
                      Sign In
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >→</motion.span>
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 sm:mt-8 lg:mt-10 text-center text-sm sm:text-base lg:text-lg"
            >
              <span className="text-slate-400">Don&apos;t have an account?</span>{' '}
              <Link to="/register" className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors">
                Create account
              </Link>
            </motion.div>

            {/* Demo Credentials */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-6 sm:mt-8 lg:mt-10 p-4 sm:p-6 lg:p-8 rounded-xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm"
            >
              <p className="text-base sm:text-lg lg:text-xl text-slate-400 mb-4 sm:mb-6 font-semibold">Quick Demo Access:</p>
              <div className="space-y-3 sm:space-y-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between p-3 sm:p-4 lg:p-5 rounded-lg bg-slate-900/50 border border-slate-700/50 cursor-pointer hover:border-emerald-500/50 transition-all"
                  onClick={() => fillDemoCredentials('admin')}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-emerald-400 font-semibold text-sm sm:text-base lg:text-lg">Admin Access</p>
                      <p className="text-slate-500 text-xs sm:text-sm lg:text-base mt-1">admin@sportkits.com / Admin@123</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-slate-600" />
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between p-3 sm:p-4 lg:p-5 rounded-lg bg-slate-900/50 border border-slate-700/50 cursor-pointer hover:border-cyan-500/50 transition-all"
                  onClick={() => fillDemoCredentials('user')}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-cyan-400 font-semibold text-sm sm:text-base lg:text-lg">User Access</p>
                      <p className="text-slate-500 text-xs sm:text-sm lg:text-base mt-1">user@sportkits.com / User@123</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-slate-600" />
                </motion.div>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm lg:text-base mt-4 sm:mt-6 text-center">Click any card to auto-fill credentials</p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
