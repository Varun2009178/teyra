import { motion } from "framer-motion";
import { TrendingUp, Calendar, Star } from "lucide-react";

interface GentleAnalyticsProps {
  completedToday: number;
  completedThisWeek: number;
  currentStreak: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const GentleAnalytics: React.FC<GentleAnalyticsProps> = ({
  completedToday,
  completedThisWeek,
  currentStreak,
  isVisible,
  onToggleVisibility,
}) => {
  if (!isVisible) return null;

  const getPositiveMessage = () => {
    if (currentStreak >= 7) {
      return "You're on fire! 🔥";
    } else if (currentStreak >= 3) {
      return "Great momentum! 🚀";
    } else if (completedToday > 0) {
      return "You're making progress! ✨";
    } else {
      return "Ready to start? 🌱";
    }
  };

  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak === 1) return "1 day streak!";
    return `${currentStreak} day streak!`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg mx-2 sm:mx-0"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Your Progress
          </span>
        </div>
        <button
          onClick={onToggleVisibility}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        >
          Hide
        </button>
      </div>

      <div className="space-y-3">
        {/* Positive Message */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {getPositiveMessage()}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Today */}
          <div className="text-center p-2 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {completedToday}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Today
            </div>
          </div>

          {/* This Week */}
          <div className="text-center p-2 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {completedThisWeek}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              This Week
            </div>
          </div>

          {/* Streak */}
          <div className="text-center p-2 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {currentStreak}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {getStreakMessage()}
            </div>
          </div>
        </div>

        {/* Encouraging Note */}
        <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Every task completed is a step forward! 🌟
          </p>
        </div>
      </div>
    </motion.div>
  );
}; 