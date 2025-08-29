'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const moods = [
  { id: 'energized', emoji: '⚡', label: 'Energized', color: 'from-orange-400 to-red-400' },
  { id: 'focused', emoji: '🎯', label: 'Focused', color: 'from-blue-400 to-purple-400' },
  { id: 'creative', emoji: '✨', label: 'Creative', color: 'from-purple-400 to-pink-400' },
  { id: 'calm', emoji: '🌊', label: 'Calm', color: 'from-green-400 to-blue-400' },
  { id: 'motivated', emoji: '🚀', label: 'Motivated', color: 'from-yellow-400 to-orange-400' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'from-indigo-400 to-blue-400' },
];

interface MoodTaskGeneratorProps {
  currentTasks: Array<{ id: number; title: string; completed: boolean; }>;
  onTaskAdded: (task: string) => void;
  onMoodSelected?: (mood: {id: string, emoji: string, label: string, color: string}) => void;
}

export default function MoodTaskGenerator({ currentTasks, onTaskAdded, onMoodSelected }: MoodTaskGeneratorProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isUsedToday, setIsUsedToday] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);

  // Check if already used today and listen for storage changes (resets)
  useEffect(() => {
    const checkUsageStatus = () => {
      const lastUsed = localStorage.getItem('moodTaskGenerator_lastUsed');
      const today = new Date().toDateString();
      
      if (lastUsed === today) {
        setIsUsedToday(true);
        const savedMood = localStorage.getItem('moodTaskGenerator_mood');
        const savedTasks = localStorage.getItem('moodTaskGenerator_tasks');
        
        if (savedMood) {
          setSelectedMood(savedMood);
          // Notify parent component about saved mood
          const savedMoodData = moods.find(m => m.id === savedMood);
          if (savedMoodData && onMoodSelected) {
            onMoodSelected(savedMoodData);
          }
        }
        if (savedTasks) setGeneratedTasks(JSON.parse(savedTasks));
      } else {
        // Reset state if not used today or localStorage was cleared
        setIsUsedToday(false);
        setSelectedMood(null);
        setGeneratedTasks([]);
      }
    };

    // Initial check
    checkUsageStatus();

    // Listen for storage changes (including when reset clears localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'moodTaskGenerator_lastUsed' || e.key === null) {
        checkUsageStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case localStorage was cleared in same tab
    const interval = setInterval(checkUsageStatus, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [onMoodSelected]);

  const handleMoodSelect = async (moodId: string) => {
    if (isUsedToday) return;
    
    setSelectedMood(moodId);
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/mood-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mood: moodId,
          existingTasks: currentTasks 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedTasks(data.tasks);
        
        // Save to localStorage
        const today = new Date().toDateString();
        localStorage.setItem('moodTaskGenerator_lastUsed', today);
        localStorage.setItem('moodTaskGenerator_mood', moodId);
        localStorage.setItem('moodTaskGenerator_tasks', JSON.stringify(data.tasks));
        
        setIsUsedToday(true);
        
        // Notify parent component about mood selection
        const selectedMoodData = moods.find(m => m.id === moodId);
        if (selectedMoodData && onMoodSelected) {
          onMoodSelected(selectedMoodData);
        }
        
        toast.success(`Generated ${data.tasks.length} tasks for your ${selectedMoodData?.label.toLowerCase()} mood!`);
      } else {
        throw new Error('Failed to generate tasks');
      }
    } catch (error) {
      toast.error('Failed to generate mood-based tasks');
      setSelectedMood(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedMoodData = moods.find(m => m.id === selectedMood);

  if (isUsedToday && selectedMood) {
    return (
      <div className="glass-dark-modern border-precise rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${selectedMoodData?.color} flex items-center justify-center text-white text-sm`}>
              {selectedMoodData?.emoji}
            </div>
            <div>
              <span className="text-sm font-medium text-white">AI Tasks for {selectedMoodData?.label}</span>
              <p className="text-xs text-white/60">Choose which tasks to add</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-green-400">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Done</span>
          </div>
        </div>

        {/* Show generated tasks with individual add buttons */}
        <div className="space-y-2">
          {generatedTasks.map((task, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20">
              <span className="text-sm text-white flex-1 font-medium">{task}</span>
              <button
                onClick={() => {
                  onTaskAdded(task);
                  toast.success('Task added!');
                }}
                className="ml-3 px-3 py-1.5 bg-white hover:bg-white/90 text-black rounded-lg transition-colors text-xs font-medium"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-dark-modern border-precise rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-4 h-4 text-white/60" />
        <span className="text-sm font-medium text-white">How are you feeling?</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {moods.map((mood) => (
          <motion.button
            key={mood.id}
            onClick={() => handleMoodSelect(mood.id)}
            disabled={isGenerating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-3 rounded-xl border-2 transition-all duration-200
              ${selectedMood === mood.id 
                ? 'border-white/40 bg-white/10 shadow-md ring-2 ring-white/20' 
                : 'border-white/20 hover:border-white/30 bg-white/5 hover:bg-white/10'
              }
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${mood.color} flex items-center justify-center text-white text-sm`}>
                {isGenerating && selectedMood === mood.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  mood.emoji
                )}
              </div>
              <span className="text-xs font-medium text-white">{mood.label}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}