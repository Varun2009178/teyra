'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertCircle, Plus, Check } from 'lucide-react';
import { Cactus } from './Cactus';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
  due_date?: string | null;
  subtasks?: any[] | null;
  tags?: string[] | null;
}

interface BetaFocusModeProps {
  isActive: boolean;
  onEnd: () => void;
  tasks?: Task[];
  onAddTask?: (title: string) => Promise<void>;
  onToggleTask?: (taskId: number) => Promise<void>;
  isPro?: boolean;
}

const FOCUS_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Educational keywords that are acceptable
const EDUCATIONAL_KEYWORDS = [
  'research', 'study', 'learning', 'reading', 'work', 'project', 'assignment',
  'homework', 'essay', 'paper', 'document', 'email', 'meeting', 'call',
  'presentation', 'code', 'programming', 'development', 'design', 'analysis',
  'report', 'documentation', 'planning', 'organizing', 'productivity'
];

// Distracting keywords that trigger Mike's response
const DISTRACTING_KEYWORDS = [
  'youtube', 'tiktok', 'instagram', 'facebook', 'twitter', 'reddit',
  'netflix', 'spotify', 'music', 'video', 'game', 'gaming', 'entertainment',
  'fun', 'bored', 'procrastinate', 'waste time', 'kill time', 'nothing',
  'just browsing', 'checking', 'scrolling', 'watching', 'listening'
];

export function BetaFocusMode({ isActive, onEnd, tasks = [], onAddTask, onToggleTask, isPro = false }: BetaFocusModeProps) {
  const [timeRemaining, setTimeRemaining] = useState(FOCUS_DURATION);
  const [showPrompt, setShowPrompt] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [mikeResponse, setMikeResponse] = useState('');
  const [mikeMood, setMikeMood] = useState<'happy' | 'neutral' | 'sad' | 'angry'>('neutral');
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pauseStartTimeRef = useRef<number | null>(null);
  const pendingTabSwitchRef = useRef(false);

  // Format time remaining
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Analyze user response
  const analyzeResponse = (response: string): 'educational' | 'distracting' => {
    const lowerResponse = response.toLowerCase();
    
    // Check for educational keywords
    const hasEducational = EDUCATIONAL_KEYWORDS.some(keyword => 
      lowerResponse.includes(keyword)
    );
    
    // Check for distracting keywords
    const hasDistracting = DISTRACTING_KEYWORDS.some(keyword => 
      lowerResponse.includes(keyword)
    );
    
    // If response is very short or empty, consider it distracting
    if (response.trim().length < 5) {
      return 'distracting';
    }
    
    // If it has educational keywords and no distracting keywords, it's educational
    if (hasEducational && !hasDistracting) {
      return 'educational';
    }
    
    // If it has distracting keywords, it's distracting
    if (hasDistracting) {
      return 'distracting';
    }
    
    // Default to educational if response is substantial
    return response.trim().length > 20 ? 'educational' : 'distracting';
  };

  // Handle tab visibility change - show prompt AFTER user comes back
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      
      if (!isVisible && isTabVisible) {
        // User switched away from tab - mark that they switched
        setIsTabVisible(false);
        pendingTabSwitchRef.current = true;
        
        // Pause timer immediately and track pause start time
        setIsTimerPaused(true);
        pauseStartTimeRef.current = Date.now();
      } else if (isVisible && !isTabVisible && pendingTabSwitchRef.current) {
        // User came back to tab - NOW show the prompt
        setIsTabVisible(true);
        setTabSwitchCount(prev => prev + 1);
        pendingTabSwitchRef.current = false;
        
        // Show prompt immediately when they come back
        setShowPrompt(true);
        setUserResponse('');
        setMikeResponse('');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current);
      }
    };
  }, [isActive, isTabVisible]);

  // Check if a site is whitelisted (free feature)
  const isSiteWhitelisted = (response: string): boolean => {
    try {
      const whitelist = JSON.parse(localStorage.getItem('focusModeWhitelist') || '[]') as string[];
      const lowerResponse = response.toLowerCase().trim();
      
      if (!lowerResponse || whitelist.length === 0) return false;
      
      return whitelist.some(site => {
        const lowerSite = site.toLowerCase().trim();
        if (!lowerSite) return false;
        
        // Remove common TLDs and www for flexible matching
        const domainName = lowerSite
          .replace(/^www\./, '')
          .replace(/\.(com|org|net|edu|gov|io|co|app|dev|uk|ca|au|de|fr|jp|cn)$/, '');
        
        // Check multiple ways:
        // 1. Exact match of full site
        if (lowerResponse.includes(lowerSite)) return true;
        
        // 2. Domain name match (e.g., "youtube" from "youtube.com")
        if (lowerResponse.includes(domainName)) return true;
        
        // 3. Common abbreviations (e.g., "yt" for youtube)
        if (domainName === 'youtube' && (lowerResponse.includes(' yt ') || lowerResponse.includes('yt ') || lowerResponse.startsWith('yt'))) {
          return true;
        }
        
        return false;
      });
    } catch (error) {
      console.error('Error checking whitelist:', error);
      return false;
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // Reset timer when starting
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      setTimeRemaining(FOCUS_DURATION);
      setPausedTime(0);
    }
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current && !isTimerPaused) {
        // Calculate elapsed time minus paused time
        const now = Date.now();
        const elapsed = now - startTimeRef.current - pausedTime;
        
        const remaining = Math.max(0, FOCUS_DURATION - elapsed);
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          setSessionCompleted(true);
          setShowCompletionModal(true);
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isTimerPaused, pausedTime, onEnd]);

  // Handle response submission with AI
  const handleSubmitResponse = async () => {
    if (!userResponse.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Check if site is whitelisted (free feature)
    const whitelisted = isSiteWhitelisted(userResponse);
    
    // Debug logging
    console.log('Focus mode response check:', {
      userResponse: userResponse,
      whitelisted: whitelisted,
      whitelist: JSON.parse(localStorage.getItem('focusModeWhitelist') || '[]')
    });
    
    try {
      // Call AI endpoint to get Mike's response
      const response = await fetch('/api/ai/focus-mode-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userResponse: userResponse.trim(),
          tabSwitchCount: tabSwitchCount,
          isWhitelisted: whitelisted
        })
      });

      let currentMood: 'happy' | 'neutral' | 'sad' | 'angry' = 'neutral';
      
      if (response.ok) {
        const data = await response.json();
        setMikeResponse(data.response || "GET BACK TO WORK");
        currentMood = data.mood || 'angry';
        setMikeMood(currentMood);
      } else {
        // Fallback to simple analysis
        if (whitelisted) {
          setMikeResponse("ok, that's whitelisted. stay focused!");
          currentMood = 'happy';
          setMikeMood('happy');
        } else {
          const analysis = analyzeResponse(userResponse);
          if (analysis === 'educational') {
            setMikeResponse("ok, that's fine. stay focused!");
            currentMood = 'happy';
            setMikeMood('happy');
          } else {
            setMikeResponse("GET BACK TO WORK");
            currentMood = 'angry';
            setMikeMood('angry');
          }
        }
      }
      
      // Wait for state to update, then handle cleanup
      const finalMood = currentMood;
      setTimeout(() => {
        setShowPrompt(false);
        setUserResponse('');
        setMikeResponse('');
        setIsSubmitting(false);
        // Resume timer after justification - add pause duration to pausedTime
        if (pauseStartTimeRef.current !== null) {
          const pauseDuration = Date.now() - pauseStartTimeRef.current;
          setPausedTime(prev => prev + pauseDuration);
          pauseStartTimeRef.current = null;
        }
        setIsTimerPaused(false);
        setMikeMood('neutral');
      }, 3000);
      
      // Force focus back to tab if angry (do this immediately)
      if (finalMood === 'angry') {
        setTimeout(() => {
          window.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setIsSubmitting(false);
      // Fallback to simple analysis
      const analysis = analyzeResponse(userResponse);
      let currentMood: 'happy' | 'neutral' | 'sad' | 'angry' = 'neutral';
      if (analysis === 'educational') {
        setMikeResponse("ok, that's fine. stay focused!");
        currentMood = 'happy';
        setMikeMood('happy');
      } else {
        setMikeResponse("GET BACK TO WORK");
        currentMood = 'angry';
        setMikeMood('angry');
      }
      
      // Wait for state to update, then handle cleanup
      const finalMood = currentMood;
      setTimeout(() => {
        setShowPrompt(false);
        setUserResponse('');
        setMikeResponse('');
        setIsSubmitting(false);
        // Resume timer after justification - add pause duration to pausedTime
        if (pauseStartTimeRef.current !== null) {
          const pauseDuration = Date.now() - pauseStartTimeRef.current;
          setPausedTime(prev => prev + pauseDuration);
          pauseStartTimeRef.current = null;
        }
        setIsTimerPaused(false);
        setMikeMood('neutral');
      }, 3000);
      
      // Force focus back to tab if angry (do this immediately)
      if (finalMood === 'angry') {
        setTimeout(() => {
          window.focus();
        }, 100);
      }
    }
  };

  // Handle adding task in focus mode
  const handleAddTaskInFocus = async () => {
    if (!newTaskTitle.trim() || !onAddTask) return;
    
    try {
      await onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
      setShowTaskInput(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  // Handle toggling task in focus mode
  const handleToggleTaskInFocus = async (taskId: number) => {
    if (!onToggleTask) return;
    
    try {
      await onToggleTask(taskId);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  // Check if first time using focus mode
  useEffect(() => {
    if (isActive) {
      const hasSeenOverview = localStorage.getItem('betaFocusModeOverviewSeen');
      if (!hasSeenOverview) {
        setShowOverview(true);
        localStorage.setItem('betaFocusModeOverviewSeen', 'true');
      }
    }
  }, [isActive]);

  // Handle session completion
  const handleEndSession = () => {
    if (timeRemaining > 0) {
      // User manually ended
      onEnd();
    } else {
      // Timer completed
      setSessionCompleted(true);
      setShowCompletionModal(true);
    }
  };

  // Reset state when session ends
  useEffect(() => {
    if (!isActive) {
      setTabSwitchCount(0);
      setTimeRemaining(FOCUS_DURATION);
      setIsTimerPaused(false);
      setPausedTime(0);
      setShowPrompt(false);
      setUserResponse('');
      setMikeResponse('');
      setMikeMood('neutral');
      setNewTaskTitle('');
      setShowTaskInput(false);
      setShowCompletionModal(false);
      setSessionCompleted(false);
      startTimeRef.current = null;
      pauseStartTimeRef.current = null;
      pendingTabSwitchRef.current = false;
    }
  }, [isActive]);

  // Filter incomplete tasks for display - maintain original order
  const incompleteTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      // Sort by creation date (oldest first) to maintain dashboard order
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  if (!isActive) return null;

  return (
    <>
      {/* Overview Modal - First Time Only */}
      <AnimatePresence>
        {showOverview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 backdrop-blur-xl z-[10000] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full liquid-glass glass-gradient-purple rounded-xl p-6 space-y-4 border border-white/20"
            >
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-white">beta focus mode</h2>
                <div className="text-white/80 text-sm space-y-2 text-left">
                  <p>• Lock in for 30 minutes of focused work</p>
                  <p>• Add and complete tasks while focused</p>
                  <p>• Tab switches require justification</p>
                  <p>• Mike gets progressively angrier with more switches</p>
                </div>
              </div>
              <button
                onClick={() => setShowOverview(false)}
                className="w-full px-6 py-3 bg-white hover:bg-white/90 text-black rounded-lg font-medium transition-all"
              >
                got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 backdrop-blur-xl z-[10000] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full liquid-glass glass-gradient-green rounded-xl p-6 space-y-4 border border-white/20"
            >
              <div className="text-center space-y-4">
                <Cactus mood="happy" size="lg" />
                <h2 className="text-2xl font-bold text-white">congrats! 🎉</h2>
                <p className="text-white/80">
                  {sessionCompleted 
                    ? "you completed your 30-minute focus session!"
                    : "great job staying focused!"}
                </p>
                <p className="text-white/60 text-sm">
                  start another one for peak productivity
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    onEnd();
                  }}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all"
                >
                  close
                </button>
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    // Restart session
                    setTimeRemaining(FOCUS_DURATION);
                    setTabSwitchCount(0);
                    setIsTimerPaused(false);
                    setPausedTime(0);
                    startTimeRef.current = Date.now();
                    setSessionCompleted(false);
                  }}
                  className="flex-1 px-6 py-3 bg-white hover:bg-white/90 text-black rounded-lg font-medium transition-all"
                >
                  start another
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Mode Overlay */}
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9998] flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-3xl px-6 py-8 space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-6">
            {/* Cactus - Centered */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <Cactus mood="focused" size="xl" />
            </motion.div>

            {/* Timer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="text-7xl font-bold text-white font-mono text-center">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-white/60 text-lg">
                beta focus mode active
              </div>
              {tabSwitchCount > 0 && (
                <div className="text-red-400 text-sm">
                  tab switches: {tabSwitchCount}
                </div>
              )}
            </motion.div>
          </div>

          {/* Tasks Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white text-xl font-semibold">tasks</h3>
              {onAddTask && (
                <button
                  onClick={() => setShowTaskInput(!showTaskInput)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  add task
                </button>
              )}
            </div>

            {/* Add Task Input */}
            <AnimatePresence>
              {showTaskInput && onAddTask && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddTaskInFocus();
                        }
                        if (e.key === 'Escape') {
                          setShowTaskInput(false);
                          setNewTaskTitle('');
                        }
                      }}
                      placeholder="what needs to get done?"
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                      autoFocus
                    />
                    <button
                      onClick={handleAddTaskInFocus}
                      disabled={!newTaskTitle.trim()}
                      className="px-4 py-3 bg-white hover:bg-white/90 text-black rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tasks List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {incompleteTasks.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  no tasks yet. add one to get started!
                </div>
              ) : (
                incompleteTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
                  >
                    <button
                      onClick={() => handleToggleTaskInFocus(task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        task.completed 
                          ? 'bg-white border-white' 
                          : 'border-white/30 group-hover:border-white/50'
                      }`}
                    >
                      {task.completed && (
                        <Check className="w-3 h-3 text-black" />
                      )}
                    </button>
                    <span className="flex-1 text-white text-sm">{task.title}</span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* End Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={handleEndSession}
            className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-all"
          >
            end focus session
          </motion.button>
        </div>
      </div>

      {/* Prompt Modal */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 backdrop-blur-xl z-[9999] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full space-y-6"
            >
              {/* Mike's Question */}
              <div className="text-center space-y-4">
                <Cactus mood={tabSwitchCount >= 3 ? "stressed" : "neutral"} size="lg" />
                <h2 className="text-2xl font-bold text-white">
                  give me one good reason why i shouldn't yell @ you
                </h2>
              </div>

              {/* User Input */}
              <div className="space-y-4">
                <textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitResponse();
                    }
                  }}
                  placeholder="explain what you're doing..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 resize-none"
                  rows={3}
                  autoFocus
                />

                {/* Mike's Response */}
                {mikeResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg text-center font-semibold ${
                      mikeMood === 'angry' || mikeMood === 'sad'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : mikeMood === 'happy'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    }`}
                  >
                    {mikeResponse}
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmitResponse}
                  disabled={!userResponse.trim() || isSubmitting}
                  className="w-full px-6 py-3 bg-white hover:bg-white/90 text-black rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'submitting...' : 'submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

