import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Calendar, Zap, TrendingUp, CheckCircle } from "lucide-react";
import { suggestDailyPlanning, prioritizeTasks, reflectOnProgress } from "@/lib/groq";

interface AIDailyPlannerProps {
  tasks: string[];
  completedToday: number;
  subscriptionLevel: 'free' | 'basic' | 'pro';
  onAddTasks: (tasks: string[]) => void;
  onPrioritizeTasks: (prioritizedTasks: string[]) => void;
}

export const AIDailyPlanner: React.FC<AIDailyPlannerProps> = ({
  tasks,
  completedToday,
  subscriptionLevel,
  onAddTasks,
  onPrioritizeTasks,
}) => {
  const [dailyPlan, setDailyPlan] = useState<{
    suggestedTasks: string[];
    message: string;
  } | null>(null);
  const [prioritizedTasks, setPrioritizedTasks] = useState<string[]>([]);
  const [progressReflection, setProgressReflection] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);

  // Auto-generate daily plan when tasks change (Pro feature)
  useEffect(() => {
    if (subscriptionLevel === 'pro' && tasks.length > 3) {
      const generatePlan = async () => {
        setIsLoading(true);
        try {
          const plan = await suggestDailyPlanning(tasks, 'neutral', completedToday);
          setDailyPlan(plan);
          setShowPlanner(true);
        } catch (error) {
          console.error("Error generating daily plan:", error);
        } finally {
          setIsLoading(false);
        }
      };

      // Only generate plan every 5 minutes to avoid API spam
      const timeoutId = setTimeout(generatePlan, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [tasks, completedToday, subscriptionLevel]);

  // Prioritize tasks when there are many incomplete tasks
  useEffect(() => {
    if (subscriptionLevel !== 'free' && tasks.length > 5) {
      const prioritize = async () => {
        try {
          const prioritized = await prioritizeTasks(tasks, 'neutral', completedToday);
          setPrioritizedTasks(prioritized);
        } catch (error) {
          console.error("Error prioritizing tasks:", error);
        }
      };

      prioritize();
    }
  }, [tasks, completedToday, subscriptionLevel]);

  // Generate progress reflection when tasks are completed
  useEffect(() => {
    if (subscriptionLevel === 'pro' && completedToday > 0) {
      const reflect = async () => {
        try {
          const completedTaskTexts = tasks.filter((_, index) => index < completedToday);
          const reflection = await reflectOnProgress(completedTaskTexts, tasks.length, 1);
          setProgressReflection(reflection);
        } catch (error) {
          console.error("Error reflecting on progress:", error);
        }
      };

      reflect();
    }
  }, [completedToday, tasks, subscriptionLevel]);

  const handleAddDailyPlan = () => {
    if (dailyPlan?.suggestedTasks.length) {
      onAddTasks(dailyPlan.suggestedTasks);
      setShowPlanner(false);
    }
  };

  const handleApplyPrioritization = () => {
    if (prioritizedTasks.length) {
      onPrioritizeTasks(prioritizedTasks);
    }
  };

  if (subscriptionLevel === 'free') {
    return null;
  }

  return (
    <AnimatePresence>
      {/* Daily Plan Suggestion - Simplified */}
      {showPlanner && dailyPlan && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg mx-2 sm:mx-0"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-blue-500">Today's Focus</span>
            </div>
            <motion.button
              onClick={handleAddDailyPlan}
              className="text-xs text-blue-500 hover:text-blue-600 transition-colors font-bold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add →
            </motion.button>
          </div>
          
          <p className="text-sm text-foreground/70 mb-2">{dailyPlan.message}</p>
          
          <div className="space-y-1">
            {dailyPlan.suggestedTasks.slice(0, 3).map((task, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="text-blue-500 text-xs font-bold bg-blue-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-xs sm:text-sm leading-relaxed">{task}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Simple Progress Reflection */}
      {progressReflection && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-2 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg mx-2 sm:mx-0"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-foreground/70 font-medium">{progressReflection}</span>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-foreground/5 border border-foreground/10 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
            />
            <span className="text-sm text-foreground/60">Planning your perfect day...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 