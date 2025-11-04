// TEMPORARY TEST COMPONENT - Add this to your dashboard to test 24-hour reset
// Copy this into your dashboard page component

'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function TestResetButton() {
  const { getToken } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);

  const showResetPopup = (result: any) => {
    setResetResult(result);
    setShowPopup(true);
  };

  const handleTestReset = async () => {
    if (!confirm('🧪 This will delete ALL tasks from today and add completed ones to your cactus progress. Continue with test reset?')) {
      return;
    }

    setIsResetting(true);
    
    try {
      const token = await getToken();
      
      const response = await fetch('/api/test-reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        // Progress data is now preserved via archived tasks - no localStorage needed
        console.log('✅ TEST: Progress preserved via task archiving:', result.progressData);
        
        // Clear mood-related localStorage to reset mood system
        localStorage.removeItem(`moodTaskGenerator_lastUsed`);
        localStorage.removeItem(`moodTaskGenerator_mood`);
        localStorage.removeItem(`moodTaskGenerator_tasks`);
        localStorage.removeItem(`aiSuggestionsUsedDate`);
        localStorage.removeItem(`selectedAITasks`);
        
        // Get user ID from current user for clearing user-specific items
        const userId = localStorage.getItem('clerk-user-id'); // Or however user ID is stored
        if (userId) {
          localStorage.removeItem(`last_mood_check_${userId}`);
        }
        
        // Create and show a styled popup instead of basic alert
        showResetPopup(result);
        
        // Reload page to show reset state after user closes popup
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        alert(`❌ Test reset failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test reset error:', error);
      alert('❌ Test reset failed - check console for details');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleTestReset}
          disabled={isResetting}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
          size="sm"
        >
          {isResetting ? '🔄 Testing Reset...' : '🧪 Test 24hr Reset'}
        </Button>
      </div>

      {/* Reset Completion Popup */}
      <AnimatePresence>
        {showPopup && resetResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🧪</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Test Reset Complete!
                </h3>
                
                {/* Task Summary */}
                {resetResult?.taskSummary && (
                  <div className="text-left bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 text-center">📊 Reset Summary</h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{resetResult.taskSummary.total}</div>
                        <div className="text-xs text-gray-600">Total Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{resetResult.taskSummary.completed_count}</div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{resetResult.taskSummary.incomplete_count}</div>
                        <div className="text-xs text-gray-600">Incomplete</div>
                      </div>
                    </div>

                    {/* Completed Tasks */}
                    {resetResult.taskSummary.completed.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-700 mb-2">✅ Completed Tasks:</h5>
                        <div className="space-y-1">
                          {resetResult.taskSummary.completed.slice(0, 5).map((task: string, index: number) => (
                            <div key={index} className="text-sm text-gray-700 bg-green-50/60 border border-green-100 px-3 py-1 rounded-lg">
                              {task}
                            </div>
                          ))}
                          {resetResult.taskSummary.completed.length > 5 && (
                            <div className="text-xs text-gray-500 italic">
                              +{resetResult.taskSummary.completed.length - 5} more completed
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Data */}
                    {resetResult.progressData && (
                      <div className="mt-4 p-3 bg-purple-50/60 border border-purple-100 rounded-lg">
                        <h5 className="font-medium text-purple-700 mb-2">📈 Progress Added:</h5>
                        <div className="text-sm">
                          <p>• Tasks saved to history: {resetResult.progressData.completedTasks}</p>
                          <p>• Points earned: {resetResult.progressData.pointsEarned}</p>
                          <p>• Reset time: {new Date(resetResult.progressData.resetDate).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Email Status */}
                <div className="bg-blue-50/60 backdrop-blur-sm rounded-xl border border-blue-100/50 p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">📧 Email Status</h4>
                  <p className="text-sm text-gray-700">
                    {resetResult.emailSent ? '✅ Reset email sent successfully!' : '⚠️ Email sending failed - check logs'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowPopup(false);
                    setTimeout(() => window.location.reload(), 500);
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all font-semibold text-lg"
                >
                  Got it! Reload Page 🚀
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}