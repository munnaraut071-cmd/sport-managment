import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Trophy, AlertCircle, CheckCircle, User, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    
    if (field === 'name' && !formData.name) {
      newErrors.name = 'Full name is required';
    } else if (field === 'name' && formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
    if (field === 'email' && !formData.email) {
      newErrors.email = 'Email is required';
    } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (field === 'password' && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (field === 'password' && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (field === 'password' && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (field === 'confirmPassword' && !formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (field === 'confirmPassword' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      if (result.success) {
        toast({ 
          title: 'Registration Successful!', 
          description: 'Your account has been created successfully'
        });
        navigate('/dashboard');
      } else {
        toast({ 
          title: 'Registration Failed', 
          description: result.message || 'Failed to create account',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({ 
        title: 'Unexpected Error', 
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    const strengthLevels = [
      { text: 'Very Weak', color: 'text-red-500' },
      { text: 'Weak', color: 'text-orange-500' },
      { text: 'Fair', color: 'text-yellow-500' },
      { text: 'Good', color: 'text-emerald-500' },
      { text: 'Strong', color: 'text-green-500' }
    ];
    
    return {
      strength: (strength / 5) * 100,
      text: strengthLevels[strength - 1]?.text || '',
      color: strengthLevels[strength - 1]?.color || ''
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500 rounded-full blur-3xl" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg lg:max-w-2xl relative z-10"
      >
        <Card className="bg-[#111827]/95 backdrop-blur-xl border-slate-700/50 shadow-2xl p-6 sm:p-8 lg:p-12">
          <CardHeader className="space-y-3 text-center mb-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-6 lg:mb-8 shadow-xl"
            >
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                Create Account
              </CardTitle>
              <CardDescription className="text-slate-400 text-lg sm:text-xl lg:text-2xl mt-2 lg:mt-3">
                Join SPORTKITS to manage sports equipment
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
                <Label htmlFor="name" className="text-lg sm:text-xl lg:text-2xl text-slate-300 font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-slate-400" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={`pl-12 sm:pl-14 h-12 sm:h-14 lg:h-16 text-base sm:text-lg lg:text-xl bg-slate-800/50 border-slate-600/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl ${
                      errors.name && touched.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    required
                  />
                  <AnimatePresence>
                    {errors.name && touched.name && (
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
                  {errors.name && touched.name && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-sm sm:text-base lg:text-lg mt-2"
                    >
                      {errors.name}
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
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <Label htmlFor="password" className="text-lg sm:text-xl lg:text-2xl text-slate-300 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
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
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Password Strength:</span>
                      <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength.strength}%` }}
                        className={`h-2 rounded-full transition-all ${
                          passwordStrength.strength < 40 ? 'bg-red-500' :
                          passwordStrength.strength < 60 ? 'bg-orange-500' :
                          passwordStrength.strength < 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                    </div>
                  </motion.div>
                )}
                
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
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-4"
              >
                <Label htmlFor="confirmPassword" className="text-lg sm:text-xl lg:text-2xl text-slate-300 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`pl-12 sm:pl-14 pr-12 sm:pr-14 h-12 sm:h-14 lg:h-16 text-base sm:text-lg lg:text-xl bg-slate-800/50 border-slate-600/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl ${
                      errors.confirmPassword && touched.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" /> : <Eye className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />}
                  </button>
                  <AnimatePresence>
                    {errors.confirmPassword && touched.confirmPassword && (
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
                  {errors.confirmPassword && touched.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-sm sm:text-base lg:text-lg mt-2"
                    >
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="space-y-4"
              >
                <Label htmlFor="role" className="text-lg sm:text-xl lg:text-2xl text-slate-300 font-medium">Account Type</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger className={`h-12 sm:h-14 lg:h-16 text-base sm:text-lg lg:text-xl bg-slate-800/50 border-slate-600/50 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl`}>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 border-slate-700/50 backdrop-blur-xl rounded-lg">
                    <SelectItem value="user" className="text-base p-3">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-cyan-400" />
                        <span>Student/User</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="staff" className="text-base p-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-emerald-400" />
                        <span>Staff Member</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 sm:h-14 lg:h-16 text-base sm:text-lg lg:text-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 font-semibold rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-6 sm:mt-8 lg:mt-10 text-center text-sm sm:text-base lg:text-lg"
            >
              <span className="text-slate-400">Already have an account?</span>{' '}
              <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors">
                Sign in
              </Link>
            </motion.div>

            {/* Password Requirements */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="mt-6 sm:mt-8 lg:mt-10 p-4 sm:p-6 lg:p-8 rounded-xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm"
            >
              <p className="text-base sm:text-lg lg:text-xl text-slate-400 mb-4 sm:mb-6 font-semibold">Password Requirements:</p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
                    formData.password.length >= 6 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                  }`}>
                    {formData.password.length >= 6 && <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg text-slate-300">At least 6 characters</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
                    /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                  }`}>
                    {/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) && <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg text-slate-300">Uppercase and lowercase letters</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
                    /\d/.test(formData.password) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                  }`}>
                    {/\d/.test(formData.password) && <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg text-slate-300">At least one number</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
                    /[^a-zA-Z\d]/.test(formData.password) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                  }`}>
                    {/[^a-zA-Z\d]/.test(formData.password) && <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg text-slate-300">Special character (optional)</span>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
