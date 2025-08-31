"use client";
import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Check, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button";
import { useUser, useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Cactus } from '@/components/Cactus';
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";
import { BeRealModal } from '@/components/BeRealModal';
import ResetCountdown from '@/components/ResetCountdown';

// Simple Task Card - minimal design
const SimpleTaskCard = ({ 
  task, 
  onToggle, 
  onAISplit,
  isLocked 
}: { 
  task: any;
  onToggle: (id: number) => void;
  onAISplit: (task: any) => void;
  isLocked: boolean;
}) => {
  return (
    <div className="bg-white rounded-lg border p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={() => onToggle(task.id)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              task.completed 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {task.completed && <Check className="w-3 h-3" />}
          </button>
          <span className={`flex-1 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {task.title}
          </span>
        </div>
        {!task.hasBeenSplit && !task.completed && !isLocked && (
          <button
            onClick={() => onAISplit(task)}
            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
            title="AI Split Task"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default function SimplifiedDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [userProgress, setUserProgress] = useState<any>(null);
  const [showBeReal, setShowBeReal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSplitting, setIsSplitting] = useState(false);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await getToken();
      const [tasksRes, progressRes] = await Promise.all([
        fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [tasksData, progressData] = await Promise.all([
        tasksRes.json(),
        progressRes.json()
      ]);

      setTasks(Array.isArray(tasksData) ? tasksData : tasksData.tasks || []);
      setUserProgress(progressData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Add task
  const handleAddTask = async () => {
    if (!newTask.trim() || !user) return;

    try {
      const token = await getToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTask })
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => [data, ...prev]);
        setNewTask('');
        toast.success('Task added!');
        fetchUserData(); // Refresh to get updated lock status
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add task');
      }
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  // Toggle task completion
  const handleToggleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const token = await getToken();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !task.completed })
      });

      if (response.ok) {
        setTasks(prev => 
          prev.map(t => 
            t.id === taskId ? { ...t, completed: !t.completed } : t
          )
        );
        toast.success(task.completed ? 'Task unmarked' : 'Great job! 🎉');
      } else {
        toast.error('Failed to update task');
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  // Update mood
  const handleMoodUpdate = async (mood: string) => {
    if (!user || isLocked) return;

    try {
      const token = await getToken();
      const response = await fetch('/api/mood', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mood })
      });

      if (response.ok) {
        toast.success(`Mood updated to ${mood}!`);
        fetchUserData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update mood');
      }
    } catch (error) {
      toast.error('Failed to update mood');
    }
  };

  // AI Split Task
  const handleAISplit = async (task: any) => {
    setIsSplitting(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/ai-task-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskTitle: task.title, originalTaskId: task.id })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Task broken down by AI!');
        fetchUserData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to split task');
      }
    } catch (error) {
      toast.error('Failed to split task');
    } finally {
      setIsSplitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  const isLocked = userProgress?.isLocked;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Teyra</h1>
          {isLocked && userProgress?.dailyStartTime && (
            <ResetCountdown 
              dailyStartTime={userProgress.dailyStartTime}
              className="text-sm"
            />
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Mood & Cactus Section */}
        <div className="bg-white rounded-xl border p-6 mb-6 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">How are you feeling?</h2>
            {/* BeReal button in corner */}
            <button
              onClick={() => setShowBeReal(true)}
              className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-medium hover:bg-yellow-200 transition-colors"
            >
              Be Real
            </button>
          </div>
          <div className="flex items-center justify-center space-x-8">
            <div className="flex-shrink-0">
              <Cactus mood={userProgress?.currentMood || 'neutral'} />
            </div>
            {/* Simple Mood Selector */}
            <div className="flex space-x-4">
              {['happy', 'neutral', 'sad'].map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleMoodUpdate(mood)}
                  disabled={isLocked}
                  className={`w-12 h-12 rounded-full text-2xl transition-all ${
                    userProgress?.currentMood === mood
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {mood === 'happy' ? '😊' : mood === 'neutral' ? '😐' : '😔'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Progress</h2>
          </div>
          <div className="flex items-center justify-center space-x-8">
            {(() => {
              const completedTasks = (tasks || []).filter(t => t?.completed).length;
              let progressMax, currentValue, progressMood;
              
              if (completedTasks < 10) {
                progressMax = 10;
                currentValue = completedTasks;
                progressMood = 'sad';
              } else if (completedTasks < 15) {
                progressMax = 15;
                currentValue = completedTasks - 10;
                progressMood = 'neutral';
              } else {
                progressMax = 20;
                currentValue = Math.min(completedTasks - 15, 5);
                progressMood = 'happy';
              }
              
              return (
                <>
                  <div className="flex-shrink-0">
                    <Cactus mood={progressMood} />
                  </div>
                  <AnimatedCircularProgressBar
                    max={progressMax === 10 ? 10 : progressMax === 15 ? 5 : 5}
                    value={currentValue}
                    gaugePrimaryColor="#10b981"
                    gaugeSecondaryColor="#e5e7eb"
                    className="size-32"
                  />
                </>
              );
            })()}
          </div>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-500">
              {(tasks || []).filter(t => t?.completed).length} tasks completed
            </span>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Today's Tasks</h2>
            <span className="text-sm text-gray-500">
              {(tasks || []).filter(t => t?.completed).length} / {(tasks || []).length} complete
            </span>
          </div>

          {/* Add Task Input */}
          {!isLocked && (
            <div className="mb-6">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs to be done?"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <Button 
                  onClick={handleAddTask}
                  disabled={!newTask.trim()}
                  className="px-4"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Locked Message */}
          {isLocked && (
            <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 text-sm">
                🔒 You're locked in for the day! Tasks and mood are set until your next reset.
              </p>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks yet. Add one to get started!</p>
              </div>
            ) : (
              tasks.map((task) => (
                <SimpleTaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onAISplit={handleAISplit}
                  isLocked={isLocked}
                />
              ))
            )}
          </div>

          {/* AI Splitting Status */}
          {isSplitting && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-800 text-sm">
                ✨ AI is breaking down your task into smaller steps...
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Be Real Modal */}
      {showBeReal && (
        <BeRealModal
          isOpen={showBeReal}
          onClose={() => setShowBeReal(false)}
          userProgress={userProgress}
        />
      )}
    </div>
  );
}