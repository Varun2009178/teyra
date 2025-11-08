'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserButton } from '@clerk/nextjs';
import { Calendar, FileText, Sparkles, Clock, Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface TimelineItem {
  time: string;
  duration: string;
  activity: string;
  category: string;
  description: string;
  tips: string[];
  checkIn: string;
}

interface Routine {
  title: string;
  description: string;
  timeline: TimelineItem[];
  weeklyCheckIns: Array<{ day: string; checkIn: string }>;
  metrics: {
    dailyFocusTime: string;
    weeklyGoalHours: string;
    targetStreak: string;
  };
  aiCoachTips: string[];
}

export default function RoutinesPage() {
  const [goal, setGoal] = useState('');
  const [currentHabits, setCurrentHabits] = useState('');
  const [wakeUpTime, setWakeUpTime] = useState('7:00 AM');
  const [sleepTime, setSleepTime] = useState('11:00 PM');
  const [workHours, setWorkHours] = useState('9 AM - 5 PM');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRoutine = async () => {
    if (!goal.trim()) {
      toast.error('please enter a goal');
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('teyra brain is designing your perfect routine...');

    try {
      const response = await fetch('/api/ai/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          currentHabits,
          wakeUpTime,
          sleepTime,
          workHours,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate routine');
      }

      setRoutine(data.routine);
      toast.success('your routine is ready!', { id: loadingToast });
    } catch (error: any) {
      console.error('error generating routine:', error);
      toast.error(error.message || 'failed to generate routine', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      morning: 'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
      work: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      exercise: 'from-red-500/20 to-pink-500/20 border-red-500/30',
      learning: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
      evening: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
      sleep: 'from-slate-500/20 to-gray-500/20 border-slate-500/30',
    };
    return colors[category] || 'from-white/5 to-white/10 border-white/20';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-light">teyra</h1>

            {/* Navigation links */}
            <nav className="flex items-center gap-4 md:gap-6">
              <Link href="/dashboard" className="text-white/50 hover:text-white text-xs md:text-sm font-light flex items-center">
                dashboard
              </Link>
              <Link href="/dashboard/calendar" className="text-white/50 hover:text-white text-xs md:text-sm font-light flex items-center gap-1 md:gap-2">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">calendar</span>
              </Link>
              <Link href="/dashboard/notes" className="text-white/50 hover:text-white text-xs md:text-sm font-light flex items-center gap-1 md:gap-2">
                <FileText className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">notes</span>
              </Link>
              <Link href="/dashboard/routines" className="text-white/90 text-xs md:text-sm font-light flex items-center gap-1 md:gap-2">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">routines</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border border-white/10"
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {!routine ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 font-light">powered by teyra brain</span>
              </div>
              <h1 className="text-4xl font-light mb-4">ai routines</h1>
              <p className="text-white/60 font-light">
                tell me your goals, and i'll design a complete daily routine tailored perfectly for you
              </p>
            </div>

            <div className="space-y-6">
              {/* Main goal */}
              <div>
                <label className="block text-sm text-white/60 font-light mb-2">
                  what do you want to achieve?
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., study 2 hours daily, go to gym 3x a week, learn spanish, meditate every morning..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-light placeholder:text-white/20 min-h-[120px]"
                  style={{
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                />
              </div>

              {/* Current habits */}
              <div>
                <label className="block text-sm text-white/60 font-light mb-2">
                  what are your current habits? (optional)
                </label>
                <input
                  type="text"
                  value={currentHabits}
                  onChange={(e) => setCurrentHabits(e.target.value)}
                  placeholder="e.g., wake up late, skip breakfast, work from home..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-light placeholder:text-white/20"
                  style={{
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                />
              </div>

              {/* Time preferences */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/60 font-light mb-2">
                    wake up time
                  </label>
                  <input
                    type="text"
                    value={wakeUpTime}
                    onChange={(e) => setWakeUpTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-light"
                    style={{
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 font-light mb-2">
                    sleep time
                  </label>
                  <input
                    type="text"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-light"
                    style={{
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 font-light mb-2">
                    work hours
                  </label>
                  <input
                    type="text"
                    value={workHours}
                    onChange={(e) => setWorkHours(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-light"
                    style={{
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerateRoutine}
                disabled={isGenerating || !goal.trim()}
                className="w-full bg-white text-black py-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ outline: 'none' }}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    generating your routine...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    generate my routine
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-light mb-2">{routine.title}</h1>
                <p className="text-white/60 font-light max-w-2xl">{routine.description}</p>
              </div>
              <button
                onClick={() => setRoutine(null)}
                className="text-sm text-white/40 font-light"
                style={{ outline: 'none' }}
              >
                create new routine
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-white/60 font-light">daily focus time</span>
                </div>
                <p className="text-2xl font-light">{routine.metrics.dailyFocusTime}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-white/60 font-light">weekly goal hours</span>
                </div>
                <p className="text-2xl font-light">{routine.metrics.weeklyGoalHours}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-white/60 font-light">target streak</span>
                </div>
                <p className="text-2xl font-light">{routine.metrics.targetStreak} days</p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h2 className="text-xl font-light mb-6">your daily timeline</h2>
              <div className="space-y-4">
                {routine.timeline.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-gradient-to-r ${getCategoryColor(item.category)} border rounded-xl p-6`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="text-sm text-white/60 font-light">{item.time}</div>
                        <div className="text-xs text-white/40 font-light">{item.duration}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-light mb-2">{item.activity}</h3>
                        <p className="text-white/70 text-sm font-light mb-3">{item.description}</p>
                        {item.tips.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {item.tips.map((tip, tipIndex) => (
                              <div key={tipIndex} className="flex items-start gap-2 text-xs text-white/60 font-light">
                                <span className="text-white/40">•</span>
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.checkIn && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs text-white/40 font-light mb-1">check-in</div>
                              <div className="text-sm text-white/80 font-light">{item.checkIn}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Coach Tips */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-light">ai coach tips</h2>
              </div>
              <div className="space-y-3">
                {routine.aiCoachTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-white/80 font-light">
                    <span className="text-purple-400">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Check-ins */}
            <div>
              <h2 className="text-xl font-light mb-4">weekly check-ins</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routine.weeklyCheckIns.map((checkIn, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-white/60 font-light mb-2">{checkIn.day}</div>
                    <p className="text-white/90 text-sm font-light">{checkIn.checkIn}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
