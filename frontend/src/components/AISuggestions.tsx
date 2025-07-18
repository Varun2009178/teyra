import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Lightbulb, Clock, Zap, Settings } from "lucide-react";
import { breakDownTask, suggestTaskClarification, estimateTaskEffort, checkTaskClarity } from "@/lib/groq";

interface AISuggestionsProps {
  submittedTask: string | null; // Only analyze after task is submitted
  onAddTask: (text: string) => void;
  onAddMultipleTasks: (tasks: string[], isSplitTasks?: boolean) => void;
  onRemoveOriginalTask: (taskText?: string) => void; // Add function to remove original task
  subscriptionLevel: 'free' | 'basic' | 'pro';
  onShowSubscription: () => void;
  isEnabled: boolean;
  onToggleEnabled: () => void;
  taskCount: number;
  userMood?: string;
  canPerformAISplit?: boolean;
  onIncrementAISplit?: () => void;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  submittedTask,
  onAddTask,
  onAddMultipleTasks,
  onRemoveOriginalTask,
  subscriptionLevel,
  onShowSubscription,
  isEnabled,
  onToggleEnabled,
  taskCount,
  userMood,
  canPerformAISplit = true,
  onIncrementAISplit,
}) => {
  const [suggestions, setSuggestions] = useState<{
    breakdown: string[];
    clarification: string;
    effort: { effort: string; timeEstimate: string };
    clarity: { needsClarification: boolean; reason: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [originalTaskText, setOriginalTaskText] = useState<string>("");

  // Reset dismissed state when new task is submitted
  useEffect(() => {
    if (submittedTask) {
      setDismissed(false);
      setOriginalTaskText(submittedTask); // Store the original task text
    }
  }, [submittedTask]);

  // Auto-trigger AI analysis when a task is submitted (but only every 3rd task to avoid overworking Groq)
  useEffect(() => {
    console.log("AISuggestions useEffect triggered:", {
      isEnabled,
      subscriptionLevel,
      submittedTask,
      dismissed,
      taskCount
    });

    if (!isEnabled || subscriptionLevel === 'free' || !submittedTask || dismissed) {
      console.log("AISuggestions early return:", {
        isEnabled,
        subscriptionLevel,
        submittedTask: !!submittedTask,
        dismissed
      });
      return;
    }

    // Show AI suggestions for every task
    // if (taskCount % 2 !== 0) {
    //   console.log("AISuggestions skipped - not the right task count:", taskCount);
    //   return;
    // }

    const triggerAnalysis = async () => {
      if (submittedTask.trim().length > 25) { // Only analyze longer tasks (more meaningful)
        console.log("Starting AI analysis for:", submittedTask);
        setIsLoading(true);
        try {
          const [breakdown, clarification, effort, clarity] = await Promise.all([
            breakDownTask(submittedTask, userMood),
            suggestTaskClarification(submittedTask),
            estimateTaskEffort(submittedTask),
            checkTaskClarity(submittedTask)
          ]);

          console.log("AI suggestions received:", { breakdown, clarification, effort, clarity });

          setSuggestions({
            breakdown,
            clarification,
            effort,
            clarity
          });
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error analyzing task:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("Task too short for AI analysis:", submittedTask.length, "characters");
      }
    };

    triggerAnalysis();
  }, [submittedTask, subscriptionLevel, isEnabled, dismissed, taskCount]);

  const handleBreakdown = () => {
    if (!canPerformAISplit) {
      // Show upgrade message
      onShowSubscription();
      return;
    }
    
    if (suggestions?.breakdown.length) {
      onAddMultipleTasks(suggestions.breakdown, true); // Pass true for isSplitTasks
      // Remove the original task by passing the stored text
      if (originalTaskText) {
        console.log("Removing original task:", originalTaskText);
        onRemoveOriginalTask(originalTaskText);
      }
      
      // Increment AI split count
      if (onIncrementAISplit) {
        onIncrementAISplit();
      }
      
      setShowSuggestions(false);
      setDismissed(true);
    }
  };

  const handleClarification = () => {
    if (suggestions?.clarification) {
      onAddTask(suggestions.clarification);
      setShowSuggestions(false);
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setShowSuggestions(false);
    setDismissed(true);
  };

  if (!isEnabled || subscriptionLevel === 'free') {
    return null;
  }

  return (
    <AnimatePresence>
      {showSuggestions && suggestions && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mt-4 space-y-3"
        >
          {/* Clean Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-200">Quick Wins</span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Linear/Notion Style Card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="p-4 sm:p-5 bg-black/90 border-2 border-gray-700 rounded-lg shadow-lg mx-2 sm:mx-0"
          >
                          {/* Quick Wins - Linear Style */}
              {suggestions.breakdown.length > 0 && (
                                <div className="space-y-2 mb-3 sm:mb-4">
                  {suggestions.breakdown.map((step, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-900/80 border-2 border-gray-700 rounded-lg hover:bg-gray-900 hover:border-gray-600 transition-all duration-200 shadow-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="text-blue-400 text-xs sm:text-sm font-semibold bg-blue-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-blue-500/30 flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-100 font-medium leading-relaxed">{step}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <motion.button
                onClick={handleBreakdown}
                className="w-full text-sm font-semibold py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg border border-blue-500/30 transition-all duration-200 shadow-sm"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Add Quick Wins
              </motion.button>

              {/* Effort Estimate - Clean */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400">
                <span className="truncate">{suggestions.effort.timeEstimate}</span>
                <span className="capitalize truncate ml-2">{suggestions.effort.effort}</span>
              </div>
          </motion.div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-foreground/5 border border-foreground/10 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full"
            />
            <span className="text-sm text-foreground/60">Analyzing task with AI...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 