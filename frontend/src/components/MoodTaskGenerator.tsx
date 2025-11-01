'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AIUpgradeModal from './AIUpgradeModal';

const moods = [
  { id: 'energized', emoji: '⚡️', label: 'Energized', color: 'from-yellow-500 to-orange-600' },
  { id: 'focused', emoji: '🎯', label: 'Focused', color: 'from-blue-500 to-blue-700' },
  { id: 'creative', emoji: '🎨', label: 'Creative', color: 'from-purple-500 to-pink-600' },
  { id: 'calm', emoji: '🧘‍♂️', label: 'Calm', color: 'from-green-500 to-emerald-600' },
  { id: 'motivated', emoji: '🚀', label: 'Motivated', color: 'from-red-500 to-orange-600' },
  { id: 'tired', emoji: '😪', label: 'Tired', color: 'from-gray-500 to-gray-700' },
];

interface MoodTaskGeneratorProps {
  currentTasks: Array<{ id: number; title: string; completed: boolean; }>;
  onTaskAdded: (task: string) => void;
  onMoodSelected?: (mood: {id: string, emoji: string, label: string, color: string}) => void;
}

export default function MoodTaskGenerator({ currentTasks, onTaskAdded, onMoodSelected }: MoodTaskGeneratorProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [usesRemaining, setUsesRemaining] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const checkRemainingUses = useCallback(async () => {
    try {
      const response = await fetch('/api/progress/check-mood-limit', {
        method: 'POST'
      });
      const data = await response.json();

      setIsPro(data.isPro || false);
      setMaxUses(data.limit || 1);
      setUsesRemaining(data.limit - data.dailyMoodChecks);

      // Load last generated tasks if available
      const lastMood = localStorage.getItem('moodTaskGenerator_mood');
      const lastTasks = localStorage.getItem('moodTaskGenerator_tasks');
      const lastDate = localStorage.getItem('moodTaskGenerator_lastUsed');
      const today = new Date().toDateString();

      if (lastMood && lastTasks && lastDate === today) {
        setSelectedMood(lastMood);
        setGeneratedTasks(JSON.parse(lastTasks));

        const savedMoodData = moods.find(m => m.id === lastMood);
        if (savedMoodData && onMoodSelected) {
          onMoodSelected(savedMoodData);
        }
      }
    } catch (error) {
      console.error('Failed to check mood limit:', error);
    }
  }, [onMoodSelected]);

  // Check remaining uses on mount and periodically
  useEffect(() => {
    checkRemainingUses();

    // Check periodically for updates (every 30 seconds)
    const interval = setInterval(checkRemainingUses, 30000);
    return () => clearInterval(interval);
  }, [checkRemainingUses]);

  const handleMoodSelect = async (moodId: string) => {
    setSelectedMood(moodId);
    setIsGenerating(true);

    try {
      // CHECK MOOD LIMIT FIRST
      const limitCheck = await fetch('/api/progress/check-mood-limit', {
        method: 'POST'
      });

      const limitData = await limitCheck.json();

      if (!limitData.canCheckMood) {
        // USER HIT LIMIT - SHOW UPGRADE
        toast.error(limitData.message || 'Daily AI mood limit reached');
        setShowUpgradePrompt(true);
        setIsGenerating(false);
        setSelectedMood(null);
        return;
      }

      // First, save the mood to the database
      const moodResponse = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: moodId })
      });

      if (!moodResponse.ok) {
        throw new Error('Failed to save mood to database');
      }

      // Then generate tasks based on the mood
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

        // Save to localStorage for UI state consistency
        const today = new Date().toDateString();
        localStorage.setItem('moodTaskGenerator_lastUsed', today);
        localStorage.setItem('moodTaskGenerator_mood', moodId);
        localStorage.setItem('moodTaskGenerator_tasks', JSON.stringify(data.tasks));

        // Refresh the remaining uses count from server (API already incremented the counter)
        await checkRemainingUses();

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

  const handleChangeMood = () => {
    setSelectedMood(null);
    setGeneratedTasks([]);
  };

  const selectedMoodData = moods.find(m => m.id === selectedMood);

  // Show generated tasks with option to change mood if still have uses
  if (selectedMood && generatedTasks.length > 0) {
    return (
      <div className="liquid-glass-strong glass-gradient-pink rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${selectedMoodData?.color} flex items-center justify-center shadow-lg border border-white/20`}>
              <span className="text-lg">{selectedMoodData?.emoji}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-white">AI Tasks for {selectedMoodData?.label}</span>
              <p className="text-xs text-white/60">
                {usesRemaining > 0
                  ? `${usesRemaining} ${usesRemaining === 1 ? 'use' : 'uses'} remaining today`
                  : 'All uses completed for today'}
              </p>
            </div>
          </div>
          {usesRemaining > 0 && (
            <button
              onClick={handleChangeMood}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-xs font-medium"
            >
              Change Mood
            </button>
          )}
        </div>

        {/* Show generated tasks with individual add buttons */}
        <div className="space-y-2">
          {generatedTasks.map((task, index) => (
            <div key={index} className="flex items-center justify-between p-3 liquid-glass-subtle rounded-lg">
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
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-white/80" />
            <span className="text-lg font-semibold text-white">What would you like to do today?</span>
          </div>
          <span className="text-xs font-medium text-white/60 px-2 py-1 bg-white/10 rounded-full">
            {usesRemaining > 0 ? `${usesRemaining}/${maxUses}` : '0'} left
          </span>
        </div>
        <p className="text-sm text-white/60 ml-7">
          {usesRemaining > 0
            ? 'Select your current mood to get AI-powered task suggestions'
            : isPro
            ? 'You\'ve used all 3 mood generations today. Resets tomorrow!'
            : 'You\'ve used your daily mood generation. Upgrade to Pro for 3 per day!'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {moods.map((mood) => (
          <motion.button
            key={mood.id}
            onClick={() => handleMoodSelect(mood.id)}
            disabled={isGenerating || usesRemaining === 0}
            whileHover={{ scale: usesRemaining > 0 ? 1.02 : 1 }}
            whileTap={{ scale: usesRemaining > 0 ? 0.98 : 1 }}
            className={`
              relative p-3 rounded-xl border-2 transition-all duration-200
              ${selectedMood === mood.id
                ? 'border-white/40 liquid-glass shadow-md ring-2 ring-white/20'
                : 'border-white/20 hover:border-white/30 liquid-glass-subtle hover:liquid-glass'
              }
              ${isGenerating || usesRemaining === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r ${mood.color} flex items-center justify-center shadow-lg border border-white/20`}>
                {isGenerating && selectedMood === mood.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span className="text-lg sm:text-xl">{mood.emoji}</span>
                )}
              </div>
              <span className="text-xs font-medium text-white text-center leading-tight">{mood.label}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* UNIFIED AI UPGRADE MODAL - Used across all AI features */}
      <AIUpgradeModal
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        featureName="AI mood task"
        currentLimit={maxUses}
      />
    </div>
  );
}