import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Calendar, Clock, Brain, MessageCircle, X, Plus, Check, Zap } from 'lucide-react';
import { createLifeAutopilot } from '@/lib/groq';
import { Cactus } from '@/components/Cactus';

interface AILifeAutopilotProps {
  onAddTasks: (tasks: string[]) => void;
  userMood: string;
  existingTasks?: string[];
  isOpen: boolean;
  onClose: () => void;
}

interface CalendarBlock {
  time: string;
  title: string;
  type: 'focus' | 'social' | 'break' | 'buffer';
  duration: number;
  description?: string;
}

interface AutopilotResponse {
  tasks: string[];
  calendarBlocks: CalendarBlock[];
  message: string;
}

export default function AILifeAutopilot({ 
  onAddTasks, 
  userMood, 
  existingTasks = [], 
  isOpen, 
  onClose 
}: AILifeAutopilotProps) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<AutopilotResponse | null>(null);
  const [messages, setMessages] = useState<Array<{
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isProcessing) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsProcessing(true);

    // Add user message to chat
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      // Get current time for context
      const now = new Date();
      const currentTime = now.getHours() < 12 ? 'morning' : 
                         now.getHours() < 17 ? 'afternoon' : 'evening';

      // Call AI Life Autopilot
      const autopilotResponse = await createLifeAutopilot(
        userMessage,
        userMood,
        currentTime,
        existingTasks
      );

      setResponse(autopilotResponse);

      // Add AI response to chat
      setMessages(prev => [...prev, {
        type: 'ai',
        content: autopilotResponse.message,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error in AI Life Autopilot:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: "I'm having trouble processing that right now. Can you try again? 🌵",
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddTasks = () => {
    if (response?.tasks) {
      onAddTasks(response.tasks);
      setResponse(null);
      onClose();
    }
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'focus': return 'bg-indigo-50 border-indigo-200 text-indigo-900';
      case 'social': return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'break': return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'buffer': return 'bg-slate-50 border-slate-200 text-slate-900';
      default: return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'focus': return <Brain className="w-4 h-4" />;
      case 'social': return <MessageCircle className="w-4 h-4" />;
      case 'break': return <Clock className="w-4 h-4" />;
      case 'buffer': return <Sparkles className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 min-h-[80px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Life Autopilot</h2>
                  <p className="text-slate-300 text-sm">AI-powered task planning</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-2 backdrop-blur-sm">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <div className="text-lg">
                      {userMood === 'energized' || userMood === 'focused' ? '🌵' : 
                       userMood === 'neutral' ? '🌵' : '🌵'}
                    </div>
                  </div>
                  <span className="text-xs capitalize">{userMood}</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex h-[calc(80vh-100px)]">
            {/* Chat Section */}
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-slate-400 py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-slate-700">Ready to organize your thoughts?</h3>
                    <p className="text-sm text-slate-500">Share what's on your mind and I'll create a smart plan</p>
                  </div>
                )}
                
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                      message.type === 'user' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-50 text-slate-900 border border-slate-200'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-sm text-slate-600">Creating your plan...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <form onSubmit={handleSubmit} className="flex space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="What's on your mind? Share your thoughts, deadlines, or random ideas..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none bg-white"
                      rows={2}
                      disabled={isProcessing}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={!userInput.trim() || isProcessing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-sm font-medium">Send</span>
                  </motion.button>
                </form>
              </div>
            </div>

            {/* Results Section */}
            {response && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto"
              >
                <div className="space-y-6">
                  {/* Tasks */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      Tasks
                    </h3>
                    <div className="space-y-2">
                      {response.tasks.map((task, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                        >
                          <p className="text-sm text-slate-900">{task}</p>
                        </motion.div>
                      ))}
                    </div>
                    <motion.button
                      onClick={handleAddTasks}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full mt-4 bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Add Tasks</span>
                    </motion.button>
                  </div>

                  {/* Calendar Blocks */}
                  {response.calendarBlocks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        Schedule
                      </h3>
                      <div className="space-y-2">
                        {response.calendarBlocks.map((block, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-3 rounded-lg border ${getBlockColor(block.type)}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                {getBlockIcon(block.type)}
                                <span className="font-medium text-sm">{block.title}</span>
                              </div>
                              <span className="text-xs bg-white/60 px-2 py-1 rounded-full">{block.duration}m</span>
                            </div>
                            {block.description && (
                              <p className="text-xs opacity-80 mt-1">{block.description}</p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 