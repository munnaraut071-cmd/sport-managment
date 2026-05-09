import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, ArrowUpCircle, ArrowDownCircle, History, 
  Sparkles, Users, FileText, Brain, Settings, LogOut, MessageCircle, 
  X, Send, Bot, User, Calendar, Bell, Shield, ChevronRight, Trophy,
  DollarSign, ChevronDown, AlertTriangle, Loader2
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! I\'m your AI assistant. How can I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    logout();
    setShowLogoutConfirm(false);
    setIsLoggingOut(false);
    navigate('/login');
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setMessages([...messages, { type: 'user', text: inputMessage }]);
    setInputMessage('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "I can help you with that! To issue a kit, go to the 'Issue Kit' page and select the kit you want to issue.",
        "You can check stock levels in the Dashboard or go to the Kits page for detailed inventory.",
        "To return a kit, visit the 'Return Kit' page and select the kit to process the return.",
        "For support, you can email us at support@sportkits.com or call +91 98765 43210.",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { type: 'bot', text: randomResponse }]);
    }, 1500);
  };

  const handleQuickReply = (reply) => {
    setMessages([...messages, { type: 'user', text: reply }]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const quickResponses = {
        'How to issue kit?': "To issue a kit: 1) Go to 'Issue Kit' page 2) Select the kit 3) Enter student details 4) Click 'Issue'",
        'Check stock': "Current stock available in Dashboard > Kits. Low stock items are highlighted in red.",
        'Return kit': "To return: 1) Go to 'Return Kit' page 2) Find the issued kit 3) Click 'Return' 4) Confirm",
        'Support': "📧 support@sportkits.com\n📞 +91 98765 43210\n🕐 Mon-Fri 9AM-6PM",
      };
      setMessages(prev => [...prev, { type: 'bot', text: quickResponses[reply] || "How else can I help you?" }]);
    }, 1000);
  };

  // Navigation Item Component
  const NavItem = ({ to, icon: Icon, label, active, badge, count, emoji }) => (
    <Link 
      to={to} 
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden ${
        active 
          ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
          : 'text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/50 border border-transparent'
      }`}
    >
      {/* Active indicator */}
      {active && (
        <motion.div 
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full"
        />
      )}
      
      <div className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
        active ? 'bg-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-700/50'
      }`}>
        {emoji ? (
          <span className="text-lg">{emoji}</span>
        ) : (
          <Icon size={18} className={active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-white'} />
        )}
      </div>
      
      <span className={`relative z-10 font-medium text-sm flex-1 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
        {label}
      </span>
      
      {badge && (
        <span className="relative z-10 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
          {badge}
        </span>
      )}
      
      {count !== undefined && count > 0 && (
        <span className="relative z-10 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] text-center">
          {count}
        </span>
      )}
      
      {active && <ChevronRight size={14} className="relative z-10 text-emerald-600 dark:text-emerald-400" />}
    </Link>
  );

  // Section Header Component
  const SectionHeader = ({ title, expanded, onToggle }) => (
    <button 
      onClick={onToggle}
      className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
    >
      <span>{title}</span>
      <ChevronDown 
        size={14} 
        className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
      />
    </button>
  );

  return (
    <div className="w-[280px] bg-white dark:bg-[#020617] h-screen flex flex-col border-r border-gray-200 dark:border-slate-800/50 relative transition-colors duration-300">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Logo Section */}
      <div className="relative z-10 flex items-center gap-3 px-5 py-6">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Package className="text-white" size={24} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center border-2 border-white dark:border-[#020617]">
            <span className="text-[10px] font-bold text-white dark:text-[#020617]">✓</span>
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">SPORTKITS</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Sports Inventory System</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-3 space-y-1 scrollbar-hide">
        
        {/* Main Menu */}
        <div className="space-y-0.5">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive('/dashboard')} emoji="📊" />
          <NavItem to="/kits" icon={Package} label="All Kits" active={isActive('/kits')} emoji="🎒" />
          <NavItem to="/issue" icon={ArrowUpCircle} label="Issue Kit" active={isActive('/issue')} emoji="📤" />
          <NavItem to="/return" icon={ArrowDownCircle} label="Return Kit" active={isActive('/return')} emoji="📥" />
          <NavItem to="/history" icon={History} label="My History" active={isActive('/history')} emoji="📜" />
          <NavItem to="/calendar" icon={Calendar} label="Calendar" active={isActive('/calendar')} emoji="📅" />
          <NavItem to="/tournaments" icon={Trophy} label="Tournaments" active={isActive('/tournaments')} badge="New" emoji="🏆" />
          <NavItem to="/inventory" icon={Package} label="Inventory" active={isActive('/inventory')} emoji="📦" />
        </div>

        {/* AI Features Section */}
        <div className="mt-6">
          <SectionHeader 
            title="AI Features" 
            expanded={true} 
            onToggle={() => {}} 
          />
          <div className="space-y-0.5 mt-1">
            <NavItem to="/ai-insights" icon={Sparkles} label="AI Insights" active={isActive('/ai-insights')} emoji="✨" />
            <NavItem to="/ai-dashboard" icon={Brain} label="AI Dashboard" active={isActive('/ai-dashboard')} emoji="🧠" />
          </div>
        </div>

        {/* Admin Section */}
        <div className="mt-6">
          <SectionHeader 
            title="Administration" 
            expanded={adminExpanded} 
            onToggle={() => setAdminExpanded(!adminExpanded)} 
          />
          <AnimatePresence>
            {adminExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-0.5 mt-1 overflow-hidden"
              >
                <NavItem to="/admin" icon={LayoutDashboard} label="Admin Overview" active={isActive('/admin')} emoji="⚙️" />
                <NavItem to="/users" icon={Users} label="User Management" active={isActive('/users')} emoji="👥" />
                <NavItem to="/reports" icon={FileText} label="Reports" active={isActive('/reports')} emoji="📈" />
                <NavItem to="/fines" icon={DollarSign} label="Fines & Payments" active={isActive('/fines')} emoji="💰" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* System Section */}
        <div className="mt-6">
          <SectionHeader 
            title="System" 
            expanded={true} 
            onToggle={() => {}} 
          />
          <div className="space-y-0.5 mt-1">
            <NavItem to="/notifications" icon={Bell} label="Notifications" active={isActive('/notifications')} count={3} emoji="🔔" />
            <NavItem to="/settings" icon={Settings} label="Settings" active={isActive('/settings')} emoji="🔧" />
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="relative z-10 p-4 border-t border-slate-800/50 space-y-3">
        
        {/* AI Help Card */}
        <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-900/10 to-slate-800/30 border border-emerald-500/20 rounded-2xl relative overflow-hidden group cursor-pointer min-h-[120px]" onClick={() => setChatOpen(true)}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-teal-500/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <span className="text-xl">🤖</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base mb-1">Need Help?</h3>
              <p className="text-xs text-slate-400 mb-3">Ask our AI Assistant anything about sports kits</p>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/30 transition-all group-hover:scale-105">
                <MessageCircle size={14} />
                Start Chat
              </button>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full group border border-transparent hover:border-red-500/20"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-800/50 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
            <LogOut size={18} />
          </div>
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>

      {/* Floating Chat Widget */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-96 bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">AI Assistant</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-100 text-xs">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900/30">
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.type === 'bot' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-blue-500/20 border border-blue-500/30'
                  }`}>
                    {msg.type === 'bot' ? <Bot size={14} className="text-emerald-400" /> : <User size={14} className="text-blue-400" />}
                  </div>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                    msg.type === 'bot' 
                      ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-200 dark:border-slate-700' 
                      : 'bg-emerald-600 text-white rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Bot size={14} className="text-emerald-400" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-slate-700">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            <div className="px-4 py-3 bg-gray-100 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {['How to issue?', 'Check stock', 'Return kit', 'Support'].map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-600 dark:text-slate-300 hover:text-emerald-400 text-xs rounded-full border border-gray-200 dark:border-slate-700 hover:border-emerald-500/30 transition-all"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-gray-100 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="w-11 h-11 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Send size={18} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 text-center border-b border-gray-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Confirm Logout
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Are you sure you want to log out? You will need to sign in again to access your account.
                </p>
              </div>

              {/* User Info */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-700 shadow-md">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-gray-900 dark:text-white font-medium">{user?.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 flex gap-3">
                <motion.button
                  whileHover={{ scale: isLoggingOut ? 1 : 1.02 }}
                  whileTap={{ scale: isLoggingOut ? 1 : 0.98 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: isLoggingOut ? 1 : 1.02 }}
                  whileTap={{ scale: isLoggingOut ? 1 : 0.98 }}
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut size={18} />
                      Logout
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
