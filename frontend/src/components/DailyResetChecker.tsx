'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

interface DailyResetCheckerProps {
  onResetCompleted?: () => void;
}

export default function DailyResetChecker({ onResetCompleted }: DailyResetCheckerProps = {}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [showResetPopup, setShowResetPopup] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasStarted = useRef(false);
  const [resetData, setResetData] = useState<{
    hoursRemaining: number;
    nextResetTime: string;
    taskSummary?: {
      total: number;
      completed_count: number;
      incomplete_count: number;
      completed: string[];
      incomplete: string[];
    };
  } | null>(null);

  useEffect(() => {
    if (!user?.id || hasStarted.current) return;
    hasStarted.current = true;

    // Check if there's a pending reset popup from a recent reset
    const storedResetData = localStorage.getItem(`reset_popup_data_${user.id}`);
    if (storedResetData) {
      try {
        const parsedData = JSON.parse(storedResetData);
        const now = Date.now();
        // Show popup if the reset happened within the last 5 minutes
        if (parsedData.timestamp && (now - parsedData.timestamp) < 5 * 60 * 1000) {
          setResetData({
            hoursRemaining: parsedData.hoursRemaining,
            nextResetTime: parsedData.nextResetTime,
            taskSummary: parsedData.taskSummary
          });
          setShowResetPopup(true);
          console.log('🔄 Showing reset popup from localStorage');
        } else {
          // Clean up old data
          localStorage.removeItem(`reset_popup_data_${user.id}`);
        }
      } catch (e) {
        console.warn('Failed to parse stored reset data:', e);
        localStorage.removeItem(`reset_popup_data_${user.id}`);
      }
    }

    const checkForDailyReset = async () => {
      if (isChecking) return;
      console.log('🔍 Daily reset check starting for user:', user?.id?.slice(-8));
      setIsChecking(true);
      
      try {
        const token = await getToken();
        
        // Check with server if reset is needed
        const response = await fetch('/api/daily-reset', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.needsReset) {
            console.log('🔄 Daily reset needed! Triggering reset...');
            
            // Trigger the reset via API
            const resetResponse = await fetch('/api/daily-reset', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (resetResponse.ok) {
              const resetResult = await resetResponse.json();
              console.log('✅ Daily reset completed:', resetResult);
              
              // Progress data is now preserved in archived tasks - no localStorage needed
              console.log('✅ Progress preserved via task archiving:', resetResult.progressData);
              
              // Clear localStorage for consistency - Reset mood system
              if (user.id) {
                localStorage.removeItem(`current_mood_${user.id}`);
                localStorage.removeItem(`mood_selections_${user.id}`);
                localStorage.removeItem(`hasCommittedToday_${user.id}`);
                localStorage.removeItem(`dailyTaskLimit_${user.id}`);
                localStorage.removeItem(`last_mood_check_${user.id}`); // Reset mood check timestamp
                localStorage.removeItem(`moodTaskGenerator_lastUsed`); // Reset mood task generator
                localStorage.removeItem(`moodTaskGenerator_mood`); // Reset saved mood
                localStorage.removeItem(`moodTaskGenerator_tasks`); // Reset saved mood tasks
                localStorage.setItem(`dailyCommitmentDate_${user.id}`, new Date().toDateString());
              }
              
              // Store task summary for popup
              const resetDataToStore = {
                hoursRemaining: 0,
                nextResetTime: resetResult.nextResetTime,
                taskSummary: resetResult.taskSummary
              };
              
              setResetData(resetDataToStore);
              
              // Store reset data in localStorage to persist across page reloads
              if (user.id) {
                localStorage.setItem(`reset_popup_data_${user.id}`, JSON.stringify({
                  ...resetDataToStore,
                  timestamp: Date.now() // Add timestamp to avoid stale data
                }));
              }
              
              // Show detailed popup with task summary
              setShowResetPopup(true);
              
              // Notify parent component
              onResetCompleted?.();
              
            } else {
              console.error('Failed to trigger daily reset:', await resetResponse.text());
            }
          } else {
            // Store reset data for potential display
            setResetData({
              hoursRemaining: data.hoursRemaining,
              nextResetTime: data.nextResetTime
            });
            console.log(`⏰ ${data.hoursRemaining.toFixed(1)} hours until daily reset`);
          }
        } else {
          const errorText = await response.text();
          if (response.status === 404) {
            console.log('🆕 User progress not found - will be created on next check');
          } else {
            console.error('Failed to check reset status:', response.status, errorText);
          }
        }
        
      } catch (error) {
        console.error('Error during daily reset check:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Check immediately when component mounts
    // Cron job handles the actual reset every 6 hours - frontend just checks once on load
    checkForDailyReset();

    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      hasStarted.current = false;
    };
  }, [user?.id, getToken, onResetCompleted]);

  const handleResetPopupClose = () => {
    setShowResetPopup(false);
    
    // Clean up the stored reset data
    if (user?.id) {
      localStorage.removeItem(`reset_popup_data_${user.id}`);
    }
    
    // Refresh after closing popup
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <>
      {/* Daily Reset Completion Popup */}
      <AnimatePresence>
        {showResetPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🌅</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  24-Hour Cycle Complete!
                </h3>
                
                {/* Task Summary */}
                {resetData?.taskSummary && (
                  <div className="text-left bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 text-center">📊 Yesterday's Performance</h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{resetData.taskSummary.total}</div>
                        <div className="text-xs text-gray-600">Total Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{resetData.taskSummary.completed_count}</div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{resetData.taskSummary.incomplete_count}</div>
                        <div className="text-xs text-gray-600">Incomplete</div>
                      </div>
                    </div>

                    {/* Completed Tasks */}
                    {resetData.taskSummary.completed.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-700 mb-2">✅ Completed Tasks:</h5>
                        <div className="space-y-1">
                          {resetData.taskSummary.completed.slice(0, 5).map((task, index) => (
                            <div key={index} className="text-sm text-gray-700 bg-green-50/60 border border-green-100 px-3 py-1 rounded-lg">
                              {task}
                            </div>
                          ))}
                          {resetData.taskSummary.completed.length > 5 && (
                            <div className="text-xs text-gray-500 italic">
                              +{resetData.taskSummary.completed.length - 5} more completed
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Incomplete Tasks */}
                    {resetData.taskSummary.incomplete.length > 0 && (
                      <div>
                        <h5 className="font-medium text-orange-700 mb-2">⏸️ Didn't Complete:</h5>
                        <div className="space-y-1">
                          {resetData.taskSummary.incomplete.slice(0, 3).map((task, index) => (
                            <div key={index} className="text-sm text-gray-700 bg-orange-50/60 border border-orange-100 px-3 py-1 rounded-lg">
                              {task}
                            </div>
                          ))}
                          {resetData.taskSummary.incomplete.length > 3 && (
                            <div className="text-xs text-gray-500 italic">
                              +{resetData.taskSummary.incomplete.length - 3} more incomplete
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Reset Message */}
                <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl border border-purple-100/50 p-4 mb-6">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">🤖</span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">AI System Reset</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Your AI companion has analyzed your behavior patterns from yesterday and is now ready to provide even better suggestions and reminders.
                  </p>
                  <div className="text-xs text-purple-700 bg-purple-100/70 border border-purple-200/50 px-3 py-2 rounded-lg">
                    <strong>🎯 Ready to Lock In:</strong> Mood system reset • Smart notifications learning • Behavior patterns analyzed
                  </div>
                </div>

                {/* Action Items */}
                <div className="text-left bg-blue-50/60 backdrop-blur-sm rounded-xl border border-blue-100/50 p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-3 text-center">🚀 What's Next</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                      <span>Set your mood for today</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                      <span>Add new tasks that excite you</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                      <span>Enable smart notifications for perfect timing</span>
                    </div>
                  </div>
                </div>

                {/* Support Contact */}
                <div className="text-center bg-gray-50/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-3 mb-6">
                  <p className="text-xs text-gray-600">
                    Having issues? Email us at{' '}
                    <a 
                      href="mailto:greenteyra@gmail.com" 
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      greenteyra@gmail.com
                    </a>
                  </p>
                </div>

                <button
                  onClick={handleResetPopupClose}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all font-semibold text-lg"
                >
                  Let's Lock In! 💪
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}