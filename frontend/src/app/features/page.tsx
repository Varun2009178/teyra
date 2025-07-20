'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, CheckCircle, Circle, Sparkles, Brain, Target } from 'lucide-react';
import { Cactus } from '@/components/Cactus';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  mood?: string;
}

export default function FeaturesPage() {
  const [currentMood, setCurrentMood] = useState<'energized' | 'focused' | 'neutral' | 'tired' | 'stressed'>('neutral');
  const [moodTasks, setMoodTasks] = useState<Task[]>([]);
  const [splitResult, setSplitResult] = useState<string[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Auto-demo for mood-based tasks
  useEffect(() => {
    const moodSequence = ['tired', 'stressed', 'neutral', 'focused', 'energized'] as const;
    const tasksByMood = {
      energized: [
        { id: 1, text: "Start a creative project you've been thinking about", completed: false, mood: "energized" },
        { id: 2, text: "Tackle a challenging task that requires high energy", completed: false, mood: "energized" },
        { id: 3, text: "Plan something exciting for the future", completed: false, mood: "energized" }
      ],
      focused: [
        { id: 1, text: "Deep work session on your most important project", completed: false, mood: "focused" },
        { id: 2, text: "Review and organize your long-term goals", completed: false, mood: "focused" },
        { id: 3, text: "Make important decisions that require concentration", completed: false, mood: "focused" }
      ],
      neutral: [
        { id: 1, text: "Check off a few quick wins to build momentum", completed: false, mood: "neutral" },
        { id: 2, text: "Make steady progress on ongoing projects", completed: false, mood: "neutral" },
        { id: 3, text: "Build good habits with simple daily tasks", completed: false, mood: "neutral" }
      ],
      tired: [
        { id: 1, text: "Simple organization tasks that won't drain you", completed: false, mood: "tired" },
        { id: 2, text: "Gentle self-care activities to recharge", completed: false, mood: "tired" },
        { id: 3, text: "Light planning for tomorrow when you have more energy", completed: false, mood: "tired" }
      ],
      stressed: [
        { id: 1, text: "Declutter your physical and digital space", completed: false, mood: "stressed" },
        { id: 2, text: "Write down your thoughts and concerns", completed: false, mood: "stressed" },
        { id: 3, text: "Take a mindful break to reduce anxiety", completed: false, mood: "stressed" }
      ]
    };

    const runMoodDemo = () => {
      let step = 0;
      const interval = setInterval(() => {
        if (step >= moodSequence.length) {
          clearInterval(interval);
          // Restart the demo after a pause
          setTimeout(() => {
            setCurrentMood('neutral');
            setMoodTasks([]);
            setTimeout(runMoodDemo, 1000);
          }, 2000);
          return;
        }
        
        const mood = moodSequence[step];
        setCurrentMood(mood);
        setMoodTasks(tasksByMood[mood]);
        
        // Auto-complete tasks with staggered timing
        setTimeout(() => {
          setMoodTasks(tasks => tasks.map((task, index) => ({ 
            ...task, 
            completed: true 
          })));
        }, 1500);
        
        step++;
      }, 4000);
    };

    runMoodDemo();
  }, []);

  // Auto-demo for task splitting
  useEffect(() => {
    const runSplitDemo = () => {
      setIsSplitting(true);
      
      // Longer, more realistic task
      setTimeout(() => {
        const splits = [
          "Research and compare different project management methodologies",
          "Create a detailed project timeline with milestones and deadlines",
          "Set up the development environment and required tools",
          "Establish communication channels and team collaboration protocols",
          "Define success metrics and key performance indicators"
        ];
        setSplitResult(splits);
        setIsSplitting(false);
        
        // Restart the demo after showing results
        setTimeout(() => {
          setSplitResult([]);
          setIsSplitting(false);
          setTimeout(runSplitDemo, 2000);
        }, 8000);
      }, 3000);
    };

    const timer = setTimeout(runSplitDemo, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <Button asChild className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
          <motion.h1
              initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
              Powerful Features
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600"
          >
              See how Teyra adapts to your needs with intelligent features
          </motion.p>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mood-Based Task Generation */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Mood-Based Tasks</h2>
                  <p className="text-gray-600">AI generates tasks based on your current mood</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">Watch how Teyra adapts to your mood:</p>
                <div className="flex flex-wrap gap-2">
                  {(['tired', 'stressed', 'neutral', 'focused', 'energized'] as const).map((mood) => (
                    <div
                      key={mood}
                      className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all duration-300 ${
                        currentMood === mood 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {mood}
                </div>
                  ))}
                </div>
              </div>

              {moodTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Suggested Tasks:</h3>
                                     {moodTasks.map((task, index) => (
                     <motion.div
                       key={task.id}
                       initial={{ opacity: 0, x: -30, y: 10 }}
                       animate={{ opacity: 1, x: 0, y: 0 }}
                       transition={{ 
                         delay: index * 0.3,
                         duration: 0.6,
                         ease: "easeOut"
                       }}
                       className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:bg-gray-50"
                     >
            <motion.div
                         className="w-5 h-5"
                         initial={{ scale: 0, rotate: -180 }}
                         animate={{ 
                           scale: task.completed ? 1 : 0.8,
                           rotate: task.completed ? 0 : -180
                         }}
                         transition={{ 
                           delay: index * 0.3 + 1.5,
                           duration: 0.5,
                           ease: "backOut"
                         }}
                       >
                         {task.completed ? (
                           <CheckCircle className="w-5 h-5 text-green-500" />
                         ) : (
                           <Circle className="w-5 h-5 text-gray-400" />
                         )}
                       </motion.div>
                       <motion.span 
                         className={`flex-1 transition-all duration-500 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                         animate={{ 
                           opacity: task.completed ? 0.6 : 1,
                           x: task.completed ? 5 : 0
                         }}
                         transition={{ 
                           delay: index * 0.3 + 1.5,
                           duration: 0.4
                         }}
                       >
                         {task.text}
                       </motion.span>
                     </motion.div>
                   ))}
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <motion.div
                  key={currentMood}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeInOut",
                    scale: { duration: 0.6, ease: "backOut" }
                  }}
                  className="flex justify-center"
                >
                  <Cactus mood={
                    currentMood === 'energized' ? 'happy' :
                    currentMood === 'focused' ? 'happy' :
                    currentMood === 'neutral' ? 'neutral' :
                    currentMood === 'tired' ? 'sad' :
                    currentMood === 'stressed' ? 'sad' : 'neutral'
                  } />
                </motion.div>
              </div>
            </motion.div>

            {/* AI Task Splitting */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">AI Task Splitting</h2>
                  <p className="text-gray-600">Break down complex tasks into manageable steps</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">AI automatically breaks down complex tasks:</p>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-700 font-medium">"Launch a new software product from concept to market"</p>
                </div>
                {isSplitting && (
                  <div className="mt-3 flex items-center justify-center space-x-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">AI is analyzing the complex task...</span>
                </div>
                )}
              </div>

              {splitResult.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Split into steps:</h3>
                                     {splitResult.map((step, index) => (
                     <motion.div
                       key={index}
                       initial={{ opacity: 0, y: 20, x: -10 }}
                       animate={{ opacity: 1, y: 0, x: 0 }}
                       transition={{ 
                         duration: 0.6, 
                         delay: index * 0.2,
                         ease: "easeOut"
                       }}
                       className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors duration-300"
                     >
            <motion.div
                         className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold"
                         initial={{ scale: 0, rotate: -180 }}
                         animate={{ scale: 1, rotate: 0 }}
                         transition={{ 
                           duration: 0.5, 
                           delay: index * 0.2 + 0.3,
                           ease: "backOut"
                         }}
                       >
                         {index + 1}
                       </motion.div>
                       <motion.span 
                         className="text-gray-900"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ 
                           duration: 0.4, 
                           delay: index * 0.2 + 0.5
                         }}
                       >
                         {step}
                       </motion.span>
                     </motion.div>
                   ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Additional Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Daily Reset</h3>
              <p className="text-gray-600">Fresh start every 24 hours to keep you focused</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Reminders</h3>
              <p className="text-gray-600">Gentle nudges that actually help, not nag</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Life Autopilot</h3>
              <p className="text-gray-600">Dump your thoughts, get a smart calendar</p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="text-center mt-16"
          >
            <Button 
              size="lg" 
              asChild
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
                             <Link href="/sign-up">
                 <span className="flex items-center space-x-2">
                   <span>Get Started Free</span>
                   <ArrowLeft className="w-5 h-5 rotate-180" />
                 </span>
               </Link>
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 