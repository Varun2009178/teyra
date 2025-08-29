'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { suggestTask, generateTasksFromMood } from '@/lib/ai';
import { Smile, Frown, Meh, X, Lightbulb, Send, Loader2 } from 'lucide-react';

interface MoodCheckInProps {
  onMoodSelect: (mood: string) => void;
  onTaskSuggestion: (task: string) => void;
  onDismiss?: () => void;
  existingTasks: string[];
}

export function MoodCheckIn({ onMoodSelect, onTaskSuggestion, onDismiss, existingTasks }: MoodCheckInProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [moodExplanation, setMoodExplanation] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [hasUsedAISuggestionsToday, setHasUsedAISuggestionsToday] = useState(false);

  // Check if user has already used AI suggestions today
  React.useEffect(() => {
    const today = new Date().toDateString();
    const lastUsedDate = localStorage.getItem('aiSuggestionsUsedDate');
    if (lastUsedDate === today) {
      setHasUsedAISuggestionsToday(true);
    }
  }, []);

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setShowMoodPopup(true);
  };

  const handleExplainMood = async () => {
    if (!moodExplanation.trim()) return;
    
    setIsGeneratingTasks(true);
    try {
      // Generate multiple task suggestions based on mood and explanation
      const suggestions = await generateTasksFromMood(selectedMood!, moodExplanation, existingTasks);
      setSuggestedTasks(suggestions);
    } catch (error) {
      console.error('Error generating tasks:', error);
      // Fallback suggestions
      setSuggestedTasks([
        "Take a moment to breathe and center yourself",
        "Write down your thoughts in a journal",
        "Complete one small, manageable task"
      ]);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleToggleTask = (task: string) => {
    setSelectedTasks(prev => 
      prev.includes(task) 
        ? prev.filter(t => t !== task)
        : [...prev, task]
    );
  };

  const handleAddSelectedTasks = () => {
    selectedTasks.forEach(task => {
      onTaskSuggestion(task);
    });
    
    // Save that user used AI suggestions today
    const today = new Date().toDateString();
    localStorage.setItem('aiSuggestionsUsedDate', today);
    localStorage.setItem('selectedAITasks', JSON.stringify(selectedTasks));
    setHasUsedAISuggestionsToday(true);
    
    setShowMoodPopup(false);
    setMoodExplanation('');
    setSuggestedTasks([]);
    setSelectedTasks([]);
    setIsOpen(false);
    
    // Call onMoodSelect with the selected mood when user finishes
    if (selectedMood) {
      onMoodSelect(selectedMood);
    }
  };

  const handleJustSaveMood = () => {
    setShowMoodPopup(false);
    setMoodExplanation('');
    setSuggestedTasks([]);
    setIsOpen(false);
    // Call onMoodSelect with the selected mood when user finishes
    if (selectedMood) {
      onMoodSelect(selectedMood);
    }
  };

  const handleClosePopup = () => {
    setShowMoodPopup(false);
    setMoodExplanation('');
    setSuggestedTasks([]);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    // Auto-save the selected mood when dismissing
    if (selectedMood) {
      onMoodSelect(selectedMood);
    }
    onDismiss?.();
  };

  if (!isOpen) return null;

  const getMoodSpecificTitle = (mood: string) => {
    switch (mood) {
      case 'overwhelmed':
        return 'Oh no! Why are you overwhelmed? 😔';
      case 'tired':
        return 'Why are you tired? 😴';
      case 'stressed':
        return 'Why are you stressed? 😰';
      case 'neutral':
        return 'Why are you feeling okay? 🤔';
      case 'focused':
        return 'Why are you focused? 🎯';
      case 'excited':
        return 'Yay! Why are you excited? 🎉';
      case 'energized':
        return 'Awesome! Why are you energized? ⚡';
      default:
        return 'Why are you feeling this way?';
    }
  };

  const getMoodSpecificMessage = (mood: string) => {
    switch (mood) {
      case 'overwhelmed':
        return 'I understand feeling overwhelmed can be really tough. Tell me what\'s going on, and I\'ll suggest some tasks that might help you feel more in control.';
      case 'tired':
        return 'Being tired can make everything feel harder. Tell me what\'s draining your energy, and I\'ll suggest some gentle tasks that might help you recharge.';
      case 'stressed':
        return 'Stress can be really challenging to deal with. Tell me what\'s stressing you out, and I\'ll suggest some tasks that might help you feel more relaxed.';
      case 'neutral':
        return 'Sometimes being okay is perfectly fine! Tell me what\'s on your mind, and I\'ll suggest some tasks that might help you make the most of this balanced state.';
      case 'focused':
        return 'That\'s great! Being focused is such a productive state. Tell me what\'s keeping you engaged, and I\'ll suggest some tasks that can help you make the most of this momentum.';
      case 'excited':
        return 'Yay! I love when you\'re excited! Tell me what\'s got you feeling this way, and let\'s channel that energy into something amazing!';
      case 'energized':
        return 'Awesome! You\'re full of energy and ready to tackle anything! Tell me what\'s fueling this energy, and let\'s put it to good use!';
      default:
        return 'Tell me more about what\'s on your mind. I\'ll suggest tasks that can help.';
    }
  };

  const getMoodSpecificPlaceholder = (mood: string) => {
    switch (mood) {
      case 'overwhelmed':
        return 'I\'m overwhelmed because...';
      case 'tired':
        return 'I\'m tired because...';
      case 'stressed':
        return 'I\'m stressed because...';
      case 'neutral':
        return 'I\'m feeling okay because...';
      case 'focused':
        return 'I\'m focused because...';
      case 'excited':
        return 'I\'m excited because...';
      case 'energized':
        return 'I\'m energized because...';
      default:
        return 'I\'m feeling this way because...';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl border border-gray-200 shadow-md p-6 sm:p-8 md:p-10 lg:p-12 mb-6"
      >
        <div className="flex justify-between items-start mb-8 md:mb-10 mt-2 md:mt-4">
          <div className="flex-1">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 md:mb-4">
              How are you feeling today?
            </h3>
            <p className="text-gray-600 sm:text-lg md:text-xl">
              This helps Mike suggest the perfect tasks for your current state
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 rounded-full ml-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
          <MoodButton 
            mood="overwhelmed" 
            icon={<Frown />} 
            label="Overwhelmed" 
            isSelected={selectedMood === 'overwhelmed'} 
            onClick={() => handleMoodSelect('overwhelmed')} 
          />
          <MoodButton 
            mood="tired" 
            icon={<Frown />} 
            label="Tired" 
            isSelected={selectedMood === 'tired'} 
            onClick={() => handleMoodSelect('tired')} 
          />
          <MoodButton 
            mood="stressed" 
            icon={<Frown />} 
            label="Stressed" 
            isSelected={selectedMood === 'stressed'} 
            onClick={() => handleMoodSelect('stressed')} 
          />
          <MoodButton 
            mood="neutral" 
            icon={<Meh />} 
            label="Okay" 
            isSelected={selectedMood === 'neutral'} 
            onClick={() => handleMoodSelect('neutral')} 
          />
          <MoodButton 
            mood="focused" 
            icon={<Smile />} 
            label="Focused" 
            isSelected={selectedMood === 'focused'} 
            onClick={() => handleMoodSelect('focused')} 
          />
          <MoodButton 
            mood="excited" 
            icon={<Smile />} 
            label="Excited" 
            isSelected={selectedMood === 'excited'} 
            onClick={() => handleMoodSelect('excited')} 
          />
          <MoodButton 
            mood="energized" 
            icon={<Smile />} 
            label="Energized" 
            isSelected={selectedMood === 'energized'} 
            onClick={() => handleMoodSelect('energized')} 
          />
        </div>
      </motion.div>

      {/* Mood Explanation Popup */}
      <AnimatePresence>
        {showMoodPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleClosePopup}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 sm:p-8 md:p-10 max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 md:mb-8">
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">
                  {getMoodSpecificTitle(selectedMood!)}
                </h3>
              </div>
              
              <p className="text-gray-600 sm:text-lg md:text-xl mb-6 md:mb-8">
                {getMoodSpecificMessage(selectedMood!)}
              </p>
              
              <div className="space-y-6 md:space-y-8">
                <Input
                  placeholder={getMoodSpecificPlaceholder(selectedMood!)}
                  value={moodExplanation}
                  onChange={(e) => setMoodExplanation(e.target.value)}
                  className="w-full"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isGeneratingTasks) {
                      handleExplainMood();
                    }
                  }}
                />
                
                {hasUsedAISuggestionsToday ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm mb-3">
                      ⚡ You've already used AI task suggestions today! Come back tomorrow for fresh ideas.
                    </p>
                    <Button
                      onClick={handleJustSaveMood}
                      className="w-full bg-gradient-to-r from-green-500 to-lime-600 hover:from-green-600 hover:to-lime-700 text-white"
                    >
                      Just Save Mood
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleExplainMood}
                      disabled={!moodExplanation.trim() || isGeneratingTasks}
                      className="flex-1 bg-black hover:bg-gray-800 text-white"
                    >
                      {isGeneratingTasks ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating tasks...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Get Task Suggestions
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={handleJustSaveMood}
                      className="flex-1 bg-gradient-to-r from-green-500 to-lime-600 hover:from-green-600 hover:to-lime-700 text-white"
                    >
                      Just Save Mood
                    </Button>
                  </div>
                )}
              </div>

              {/* Suggested Tasks with Checkboxes */}
              {suggestedTasks.length > 0 && (
                <div className="mt-8 md:mt-10">
                  {hasUsedAISuggestionsToday ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                      <p className="text-yellow-800 text-sm">
                        ⚡ You've already used AI task suggestions today! Come back tomorrow for fresh ideas.
                      </p>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">
                        Suggested tasks for you:
                      </h4>
                      <div className="space-y-3 md:space-y-4">
                        {suggestedTasks.map((task, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center p-4 md:p-5 rounded-lg border transition-all cursor-pointer ${
                              selectedTasks.includes(task)
                                ? 'bg-purple-50 border-purple-300'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={() => handleToggleTask(task)}
                          >
                            <div className="flex items-center mr-3">
                              <input
                                type="checkbox"
                                checked={selectedTasks.includes(task)}
                                onChange={() => handleToggleTask(task)}
                                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                              />
                            </div>
                            <span className="text-sm md:text-base text-gray-700 flex-1">{task}</span>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="mt-6 md:mt-8 flex gap-3 md:gap-4">
                        <Button
                          onClick={handleAddSelectedTasks}
                          disabled={selectedTasks.length === 0}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300"
                        >
                          Add Selected Tasks ({selectedTasks.length})
                        </Button>
                        <Button
                          onClick={handleJustSaveMood}
                          className="flex-1 bg-gradient-to-r from-green-500 to-lime-600 hover:from-green-600 hover:to-lime-700 text-white"
                        >
                          Just Save Mood
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleClosePopup}
                          className="flex-1"
                        >
                          Close
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface MoodButtonProps {
  mood: string;
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function MoodButton({ mood, icon, label, isSelected, onClick }: MoodButtonProps) {
  const moodColors = {
    overwhelmed: {
      bg: 'bg-purple-100',
      border: 'border-purple-200',
      selectedBg: 'bg-purple-500',
      text: 'text-purple-500',
      selectedText: 'text-white',
      hoverBg: 'hover:bg-purple-200'
    },
    tired: {
      bg: 'bg-orange-100',
      border: 'border-orange-200',
      selectedBg: 'bg-orange-500',
      text: 'text-orange-500',
      selectedText: 'text-white',
      hoverBg: 'hover:bg-orange-200'
    },
    stressed: {
      bg: 'bg-purple-100',
      border: 'border-purple-200',
      selectedBg: 'bg-purple-500',
      text: 'text-purple-500',
      selectedText: 'text-white',
      hoverBg: 'hover:bg-purple-200'
    },
    neutral: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-200',
      selectedBg: 'bg-yellow-500',
      text: 'text-yellow-500',
      selectedText: 'text-white',
      hoverBg: 'hover:bg-yellow-200'
    },
    focused: {
      bg: 'bg-green-100',
      border: 'border-green-200',
      selectedBg: 'bg-green-500',
      text: 'text-green-500',
      selectedText: 'text-white',
      hoverBg: 'hover:bg-green-200'
    },
    excited: {
      bg: 'bg-pink-100',
      border: 'border-pink-200',
      selectedBg: 'bg-pink-500',
      text: 'text-pink-500',
      selectedText: 'text-white',
      hoverBg: 'hover:bg-pink-200'
    },
    energized: {
      bg: 'bg-green-100',
      border: 'border-green-200',
      selectedBg: 'bg-green-500',
      text: 'text-green-500',
      selectedText: 'text-white',
      hoverBg: 'hover:bg-green-200'
    }
  };
  
  const colors = moodColors[mood as keyof typeof moodColors];
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex flex-col items-center p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl border-2 transition-all duration-200 min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px] xl:min-h-[200px] justify-center w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] xl:w-[220px] ${
        isSelected 
          ? `${colors.selectedBg} border-transparent shadow-lg transform scale-105` 
          : `${colors.bg} ${colors.border} ${colors.hoverBg} hover:shadow-md hover:scale-102`
      }`}
    >
      <div className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-3 sm:mb-4 md:mb-5 ${isSelected ? colors.selectedText : colors.text}`}>
        {icon}
      </div>
      <span className={`text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-center leading-tight px-2 break-words hyphens-auto ${isSelected ? colors.selectedText : 'text-gray-700'}`}>
        {label}
      </span>
    </motion.button>
  );
}