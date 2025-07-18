import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Sparkles, Heart } from "lucide-react";

interface CactusSuggestionsProps {
  taskCount: number;
  completedCount: number;
  userMood?: string;
  onAddTask: (text: string) => void;
  subscriptionLevel: 'free' | 'basic' | 'pro';
  isNewUser?: boolean;
}

export const CactusSuggestions: React.FC<CactusSuggestionsProps> = ({
  taskCount,
  completedCount,
  userMood,
  onAddTask,
  subscriptionLevel,
  isNewUser
}) => {
  const [suggestion, setSuggestion] = useState<string>("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Generate suggestions based on context
  const generateSuggestion = () => {
    const hour = new Date().getHours();
    const isMorning = hour < 12;
    const isAfternoon = hour >= 12 && hour < 17;
    const isEvening = hour >= 17;
    
    const suggestions = [
      // Morning suggestions
      ...(isMorning ? [
        "Refill your water bottle",
        "Open the curtains and let in some light",
        "Take 3 deep breaths",
        "Stretch your arms and legs"
      ] : []),
      
      // Afternoon suggestions
      ...(isAfternoon ? [
        "Stand up and walk around for 2 minutes",
        "Check if you need to reply to any messages",
        "Tidy up your workspace",
        "Take a quick break to look out the window"
      ] : []),
      
      // Evening suggestions
      ...(isEvening ? [
        "Reflect on one good thing that happened today",
        "Plan something nice for tomorrow",
        "Put away any items that are out of place",
        "Take a moment to relax and breathe"
      ] : []),
      
      // Universal suggestions
      "Drink a glass of water",
      "Check your posture and adjust if needed",
      "Send a quick message to someone you care about",
      "Take a moment to appreciate something around you",
      "Do a quick 30-second stretch",
      "Organize one small thing in your space"
    ];

    // Filter based on mood
    let moodFiltered = suggestions;
    if (userMood === 'tired' || userMood === 'stressed') {
      moodFiltered = suggestions.filter(s => 
        !s.includes('stretch') && !s.includes('walk') && 
        !s.includes('organize') && !s.includes('tidy')
      );
    } else if (userMood === 'energized') {
      moodFiltered = suggestions.filter(s => 
        s.includes('stretch') || s.includes('walk') || 
        s.includes('organize') || s.includes('tidy')
      );
    }

    return moodFiltered[Math.floor(Math.random() * moodFiltered.length)];
  };

  // Show suggestions when appropriate
  useEffect(() => {
    const shouldShow = (
      subscriptionLevel !== 'free' && 
      !dismissed && 
      (taskCount === 0 || (taskCount <= 2 && completedCount >= taskCount * 0.5))
    );

    if (shouldShow && !showSuggestion) {
      // Show immediately for new users, with delay for others
      const delay = isNewUser ? 500 : 2000;
      const timer = setTimeout(() => {
        setSuggestion(generateSuggestion());
        setShowSuggestion(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [taskCount, completedCount, dismissed, subscriptionLevel, showSuggestion, userMood, isNewUser]);

  const handleAddSuggestion = () => {
    onAddTask(suggestion);
    setShowSuggestion(false);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setShowSuggestion(false);
    setDismissed(true);
  };

  if (subscriptionLevel === 'free') {
    return null;
  }

  return (
    <AnimatePresence>
      {showSuggestion && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`mt-6 p-4 border rounded-lg ${
            isNewUser 
              ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 shadow-lg" 
              : "bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Heart className="w-5 h-5 text-emerald-500" />
              </motion.div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 font-medium mb-2">
                {isNewUser && taskCount === 0 
                  ? "🎉 Welcome! Here's your first daily win:" 
                  : taskCount === 0 
                    ? "Ready for a quick win?" 
                    : "Need a small victory? Here's an easy one."
                }
              </p>
              
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-300">{suggestion}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddSuggestion}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                >
                  Add Win
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 