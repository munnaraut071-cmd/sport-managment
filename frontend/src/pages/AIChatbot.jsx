import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, Loader2, Lightbulb, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/services/api';

export default function AIChatbot() {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I\'m your SPORTKITS AI assistant. Ask me about kits, inventory, your history, or anything else!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const scrollRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/chatbot/suggestions');
      setSuggestions(res.data.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to load suggestions');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/query', { query: userMessage });
      const { response, intent, data } = res.data.data;
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: response,
        intent,
        data
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'Sorry, I encountered an error. Please try again.',
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion.query);
  };

  const renderMessageContent = (msg) => {
    if (msg.type === 'user') {
      return <p className="text-gray-900 dark:text-white">{msg.text}</p>;
    }

    return (
      <div className="space-y-2">
        <p className="text-gray-900 dark:text-gray-200 whitespace-pre-line">{msg.text}</p>
        {msg.intent && (
          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs border-emerald-200 dark:border-emerald-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            {msg.intent}
          </Badge>
        )}
      </div>
    );
  };

  const clearChat = () => {
    setMessages([
      { type: 'bot', text: 'Hello! I\'m your SPORTKITS AI assistant. Ask me about kits, inventory, your history, or anything else!' }
    ]);
    setInput('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-transparent">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            AI Assistant
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">Ask me anything about your sports inventory</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearChat}
          className="bg-white dark:bg-[#111827] hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <RotateCcw size={16} />
          Clear Chat
        </motion.button>
      </div>

      <Card className="flex-1 bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-5">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start gap-3 max-w-[80%] ${
                    msg.type === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.type === 'user'
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                    }`}
                  >
                    {msg.type === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <Card
                    className={`${
                      msg.type === 'user'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    <CardContent className="p-4">
                      {renderMessageContent(msg)}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <Card className="bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-500 dark:text-emerald-400" />
                      <span className="text-slate-500 dark:text-slate-400 text-sm">AI is thinking...</span>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {suggestions.length > 0 && messages.length < 3 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-transparent">
            <div className="flex items-center gap-2 mb-2 text-sm text-slate-500 dark:text-slate-400">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Try asking:
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <motion.div key={idx} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.query}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-transparent flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about kits, inventory, your history..."
            className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-500"
            disabled={loading}
          />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 px-6 shadow-lg shadow-emerald-500/30"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        </form>
      </Card>
    </div>
  );
}
