import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, X, Send, Sparkles, Package, Calendar, 
  TrendingUp, Search, User, HelpCircle, MessageCircle,
  ChevronRight, Lightbulb, ArrowUpCircle, RotateCcw
} from 'lucide-react';
import { kitsAPI, transactionsAPI } from '@/services/api';
const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your SPORTKITS AI Assistant 🤖\n\nI can help you:\n• Find available kits\n• Get recommendations\n• Check kit popularity\n• Answer your questions\n\nWhat would you like to know?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [availableKits, setAvailableKits] = useState([]);
  const [suggestions, setSuggestions] = useState([
    'Which cricket kits are available?',
    'Recommend football equipment',
    'What\'s the most popular kit?',
    'How do I issue a kit?'
  ]);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (isOpen) {
      fetchKits();
    }
  }, [isOpen]);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const fetchKits = async () => {
    try {
      const response = await kitsAPI.getAll();
      if (response.data.success) {
        setAvailableKits(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching kits:', error);
    }
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  // Smart response generator
  const generateResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    // Check for kit availability queries
    if (message.includes('available') || message.includes('stock') || message.includes('kit')) {
      const category = extractCategory(message);
      if (category) {
        const categoryKits = availableKits.filter(k => 
          k.category.toLowerCase() === category && k.available > 0
        );
        if (categoryKits.length > 0) {
          const kitList = categoryKits.slice(0, 5).map(k => 
            `• ${k.emoji || '📦'} ${k.name} (${k.available} available)`
          ).join('\n');
          return `Here are available ${category} kits:\n\n${kitList}\n\nWould you like to issue any of these?`;
        }
        return `Sorry, no ${category} kits are currently available. Please check back later or contact staff.`;
      }
      const availableCount = availableKits.filter(k => k.available > 0).length;
      return `We have ${availableCount} kit types available across ${new Set(availableKits.map(k => k.category)).size} categories.\n\nPopular categories:\n🏏 Cricket (${availableKits.filter(k => k.category === 'Cricket' && k.available > 0).length} types)\n⚽ Football (${availableKits.filter(k => k.category === 'Football' && k.available > 0).length} types)\n🏸 Badminton (${availableKits.filter(k => k.category === 'Badminton' && k.available > 0).length} types)\n\nAsk me about a specific category!`;
    }
    // Check for recommendations
    if (message.includes('recommend') || message.includes('suggest') || message.includes('best')) {
      const category = extractCategory(message);
      if (category === 'cricket') {
        return `🏏 Top Cricket Recommendations:\n\n1. **SG English Willow Bat** - Premium quality for professionals\n2. **Kookaburra Red Ball** - Match-grade ball\n3. **Masuri Vision Series Helmet** - Safety first!\n4. **SF Batting Gloves** - Professional grade\n\nThese are our most popular cricket items. Would you like to issue any of these?`;
      }
      if (category === 'football') {
        return `⚽ Top Football Recommendations:\n\n1. **FIFA World Cup Official Ball** - Professional match ball\n2. **Nike Mercurial Vapor Boots** - Speed boots for wingers\n3. **Adidas Predator Pro Gloves** - Goalkeeper essential\n4. **SKLZ Agility Ladder** - Training essential\n\nPopular among football enthusiasts!`;
      }
      // Most popular across all categories
      const popularKits = availableKits
        .filter(k => k.available > 0)
        .slice(0, 5)
        .map((k, i) => `${i + 1}. ${k.emoji || '📦'} ${k.name}`)
        .join('\n');
      return `🌟 Most Popular Kits:\n\n${popularKits}\n\nThese kits are in high demand. I recommend issuing them quickly!`;
    }
    // Check for popularity/trends
    if (message.includes('popular') || message.includes('trending') || message.includes('most issued')) {
      return `📊 Current Trends:\n\n🏏 **Cricket**: Most popular sport (54 kits available)\n⚽ **Football**: Second most popular (53 kits available)\n🏸 **Badminton**: Growing popularity\n\n📈 **This Week's Hot Items:**\n• Cricket Bats (High demand)\n• Football Boots (Popular)\n• Tennis Rackets (Limited stock)\n\nWould you like to see availability for any specific category?`;
    }
    // Help with issuing
    if (message.includes('issue') || message.includes('borrow') || message.includes('how to')) {
      return `📤 **How to Issue a Kit:**\n\n1. Go to **Issue Kits** page\n2. Search or browse available kits\n3. Click **Issue** on your desired kit\n4. Enter your name/email\n5. Select quantity (1-${Math.max(...availableKits.map(k => k.available), 5)})\n6. Choose due date (1-30 days)\n7. Click **Confirm Issue**\n\n💡 **Pro Tip:** Use the QR scanner for quick kit lookup!\n\nNeed help with something else?`;
    }
    // Check for return process
    if (message.includes('return') || message.includes('give back')) {
      return `📥 **How to Return a Kit:**\n\n1. Go to **Return** page or **History**\n2. Find your issued kit\n3. Click **Return** button\n4. Confirm kit condition\n5. Submit return request\n\n⚠️ **Important:**\n• Return before due date to avoid fines\n• Check kit condition before returning\n• Late returns may incur penalties\n\nNeed help finding your issued kits?`;
    }
    // Check for search help
    if (message.includes('search') || message.includes('find')) {
      return `🔍 **Search Tips:**\n\nYou can search by:\n• **Kit Name** - e.g., "SG Bat", "Nike Boots"\n• **Category** - e.g., "Cricket", "Football"\n• **Brand** - e.g., "Adidas", "Kookaburra"\n• **Availability** - Shows only in-stock items\n\n💡 Use filters on the Kits page to narrow down results!\n\nWhat are you looking for?`;
    }
    // Default greeting
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return `Hello there! 👋\n\nI'm here to help you with:\n🔍 Finding kits\n💡 Getting recommendations\n📊 Viewing statistics\n❓ Answering questions\n\nWhat can I assist you with today?`;
    }
    // Default response
    return `🤔 I'm not sure I understood that correctly.\n\nHere are some things I can help with:\n\n• "Which cricket kits are available?"\n• "Recommend football equipment"\n• "What's the most popular kit?"\n• "How do I issue a kit?"\n• "Show me badminton rackets"\n\nOr ask me anything about SPORTKITS!`;
  };
  const extractCategory = (message) => {
    const categories = ['cricket', 'football', 'badminton', 'basketball', 'tennis', 'hockey', 'volleyball', 'table tennis'];
    return categories.find(cat => message.includes(cat));
  };
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse = generateResponse(userMsg.content);
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };
  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: 'Hello! I\'m your SPORTKITS AI Assistant 🤖\n\nI can help you:\n• Find available kits\n• Get recommendations\n• Check kit popularity\n• Answer your questions\n\nWhat would you like to know?',
        timestamp: new Date(),
      }
    ]);
  };
  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        )}
      </motion.button>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">AI Assistant</h3>
                    <p className="text-emerald-50 text-xs">Always here to help</p>
                  </div>
                </div>
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.type === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-200 rounded-bl-md border border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {msg.type === 'bot' && (
                        <Bot className="w-4 h-4 mt-0.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                      )}
                      <div className="whitespace-pre-line text-sm">{msg.content}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-2xl rounded-bl-md border border-gray-200 dark:border-slate-700">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Suggestions */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-800">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex-shrink-0 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs rounded-full border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Lightbulb className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
export default AIChatbot;


