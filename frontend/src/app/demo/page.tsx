'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, CheckCircle, Circle } from 'lucide-react';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export default function DemoPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Complete morning routine", completed: false },
    { id: 2, text: "Review project goals", completed: false },
    { id: 3, text: "Schedule team meeting", completed: false },
    { id: 4, text: "Update documentation", completed: false },
    { id: 5, text: "Plan tomorrow's tasks", completed: false },
  ]);
  const [newTask, setNewTask] = useState('');

  const completedCount = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = (completedCount / totalTasks) * 100;

  // Determine cactus mood based on progress
  const getCactusMood = () => {
    if (progressPercentage === 0) return 'sad';
    if (progressPercentage < 60) return 'neutral';
    return 'happy';
  };

  const getCactusGif = () => {
    const mood = getCactusMood();
    switch (mood) {
      case 'sad':
        return '/Sad With Tears 2.gif';
      case 'neutral':
        return '/Neutral Calm.gif';
      case 'happy':
        return '/Happy.gif';
      default:
        return '/Neutral Calm.gif';
    }
  };

  const toggleTask = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (newTask.trim()) {
      const newTaskItem: Task = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false
      };
      setTasks([...tasks, newTaskItem]);
      setNewTask('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

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

      {/* Demo Section */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              See Teyra in Action
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600"
            >
              Complete tasks and watch your cactus companion grow happier!
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Todo List */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Tasks</h2>
                <div className="text-sm text-gray-500">
                  {completedCount}/{totalTasks} completed
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Add Task */}
              <div className="flex mb-6">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <Button
                  onClick={addTask}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-l-none"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleTask(task.id)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {task.completed ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400" />
                        )}
                      </motion.div>
                      <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.text}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Cactus Companion */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col items-center justify-center"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Cactus Companion</h3>
                <p className="text-gray-600">
                  {progressPercentage === 0 && "I'm feeling a bit down... Can you help me grow?"}
                  {progressPercentage > 0 && progressPercentage < 60 && "I'm starting to feel better! Keep going!"}
                  {progressPercentage >= 60 && "I'm thriving! You're doing amazing!"}
                </p>
              </div>

              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <Image
                  src={getCactusGif()}
                  alt={`Cactus - ${getCactusMood()}`}
                  width={300}
                  height={300}
                  className="rounded-full shadow-2xl"
                />
                
                {/* Mood indicator */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg"
                >
                  <span className="text-2xl">
                    {getCactusMood() === 'sad' && '😢'}
                    {getCactusMood() === 'neutral' && '😐'}
                    {getCactusMood() === 'happy' && '😊'}
                  </span>
                </motion.div>
              </motion.div>

              {/* Progress Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-8 text-center"
              >
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className="text-gray-600">Tasks Completed</div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-center mt-16"
          >
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to grow together?</h2>
              <p className="text-xl mb-6 opacity-90">
                Join thousands building better habits with their cactus companions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-4">
                  <Link href="/sign-up">Start Your Journey</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-red-500">
                  <Link href="/features">Learn More</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">
            © 2024 Teyra. Made with 🌵 and ❤️
          </p>
        </div>
      </footer>
    </div>
  );
} 