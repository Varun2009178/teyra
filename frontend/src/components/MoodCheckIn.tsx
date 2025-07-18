import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Cloud, CloudRain, Zap, Heart } from "lucide-react";

type Mood = 'energized' | 'focused' | 'neutral' | 'tired' | 'stressed';

interface MoodCheckInProps {
  currentMood: Mood;
  onMoodChange: (mood: Mood) => void;
  isOpen: boolean;
  onClose: () => void;
}

const moodOptions: { mood: Mood; icon: React.ReactNode; label: string; color: string }[] = [
  { mood: 'energized', icon: <Zap className="w-5 h-5" />, label: 'Energized', color: 'text-yellow-500' },
  { mood: 'focused', icon: <Sun className="w-5 h-5" />, label: 'Focused', color: 'text-orange-500' },
  { mood: 'neutral', icon: <Cloud className="w-5 h-5" />, label: 'Neutral', color: 'text-blue-500' },
  { mood: 'tired', icon: <CloudRain className="w-5 h-5" />, label: 'Tired', color: 'text-gray-500' },
  { mood: 'stressed', icon: <Heart className="w-5 h-5" />, label: 'Stressed', color: 'text-red-500' },
];

export const MoodCheckIn: React.FC<MoodCheckInProps> = ({
  currentMood,
  onMoodChange,
  isOpen,
  onClose,
}) => {
  const [selectedMood, setSelectedMood] = useState<Mood>(currentMood);

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    onMoodChange(mood);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              How are you feeling today?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This helps me suggest the right tasks for you
            </p>
          </div>

          <div className="space-y-2">
            {moodOptions.map((option) => (
              <motion.button
                key={option.mood}
                onClick={() => handleMoodSelect(option.mood)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedMood === option.mood
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={option.color}>
                  {option.icon}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {option.label}
                </span>
              </motion.button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 