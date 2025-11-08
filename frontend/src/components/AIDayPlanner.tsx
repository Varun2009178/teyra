'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Clock, Calendar, Target, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AIDayPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTasks: Array<{ id: string; title: string; completed: boolean }>;
  onCreateTasks: (tasks: string[]) => Promise<void>;
}

interface TimeBlock {
  id: string;
  time: string;
  activity: string;
}

export function AIDayPlanner({ isOpen, onClose, currentTasks, onCreateTasks }: AIDayPlannerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [context, setContext] = useState('');
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [preferences, setPreferences] = useState({
    workHours: '8',
    breakFrequency: 'moderate',
    priorityLevel: 'balanced',
    includeBreaks: true,
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    const loadingToast = toast.loading('ai is planning your day...');

    try {
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTasks: currentTasks.filter(t => !t.completed).map(t => t.title),
          context: context || 'general productivity',
          preferences,
        }),
      });

      const data = await response.json();

      if (data.suggestedTasks && Array.isArray(data.suggestedTasks)) {
        // Generate time blocks
        const blocks: TimeBlock[] = [];
        let currentTime = 9; // Start at 9 AM

        data.suggestedTasks.forEach((task: string, index: number) => {
          const hour = currentTime + Math.floor(index * 1.5);
          const minutes = (index % 2) * 30;
          blocks.push({
            id: `block-${index}`,
            time: `${hour > 12 ? hour - 12 : hour}:${minutes.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
            activity: task,
          });
        });

        setSchedule(blocks);
        toast.success('your day is planned!', { id: loadingToast });
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('error generating plan:', error);
      toast.error('failed to generate plan', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToTasks = async () => {
    if (schedule.length === 0) {
      toast.error('generate a plan first');
      return;
    }

    const tasks = schedule.map(block => `${block.time} - ${block.activity}`);
    await onCreateTasks(tasks);
    toast.success('added to your tasks!');
    onClose();
  };

  const addTimeBlock = () => {
    setSchedule([...schedule, {
      id: `block-${Date.now()}`,
      time: '',
      activity: '',
    }]);
  };

  const updateTimeBlock = (id: string, field: 'time' | 'activity', value: string) => {
    setSchedule(schedule.map(block =>
      block.id === id ? { ...block, [field]: value } : block
    ));
  };

  const removeTimeBlock = (id: string) => {
    setSchedule(schedule.filter(block => block.id !== id));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-zinc-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-white/60" />
              <h3 className="text-white font-light text-lg">ai day planner</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Context Input */}
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-light">what's your context for today?</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., Working on project deadline, need to prep for meeting, want to focus on deep work..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-light resize-none h-24"
                disabled={isGenerating}
              />
            </div>

            {/* Preferences */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-white/60 text-sm font-light flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  available hours
                </label>
                <select
                  value={preferences.workHours}
                  onChange={(e) => setPreferences({ ...preferences, workHours: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-light"
                  disabled={isGenerating}
                >
                  <option value="4">4 hours</option>
                  <option value="6">6 hours</option>
                  <option value="8">8 hours</option>
                  <option value="10">10 hours</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-white/60 text-sm font-light flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  priority level
                </label>
                <select
                  value={preferences.priorityLevel}
                  onChange={(e) => setPreferences({ ...preferences, priorityLevel: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-light"
                  disabled={isGenerating}
                >
                  <option value="relaxed">relaxed</option>
                  <option value="balanced">balanced</option>
                  <option value="intense">intense</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full px-6 py-3 bg-white text-black rounded-lg font-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'generating...' : 'generate plan'}
            </button>

            {/* Schedule Display */}
            {schedule.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white/60 text-sm font-light uppercase tracking-wider">your schedule</h4>
                  <button
                    onClick={addTimeBlock}
                    className="text-white/40 hover:text-white text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    add block
                  </button>
                </div>

                <div className="space-y-3">
                  {schedule.map((block) => (
                    <motion.div
                      key={block.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <input
                        type="text"
                        value={block.time}
                        onChange={(e) => updateTimeBlock(block.id, 'time', e.target.value)}
                        placeholder="9:00 AM"
                        className="w-24 bg-transparent border-b border-white/20 text-white/90 font-light text-sm px-2 py-1"
                      />
                      <input
                        type="text"
                        value={block.activity}
                        onChange={(e) => updateTimeBlock(block.id, 'activity', e.target.value)}
                        placeholder="Activity"
                        className="flex-1 bg-transparent border-b border-white/20 text-white/90 font-light text-sm px-2 py-1"
                      />
                      <button
                        onClick={() => removeTimeBlock(block.id)}
                        className="text-white/30 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Add to Tasks Button */}
                <button
                  onClick={handleAddToTasks}
                  className="w-full px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-light hover:bg-white/20 transition-colors"
                >
                  add all to tasks
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
