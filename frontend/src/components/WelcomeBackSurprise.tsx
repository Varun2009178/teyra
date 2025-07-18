'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Gift, Target, TrendingUp, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeBackSurpriseProps {
  isOpen: boolean
  onClose: () => void
  onAddTask: (task: string) => void
  userMood: string
  completedTasks: number
}

const surpriseMessages = {
  energized: {
    title: "⚡ You're on fire!",
    message: "Your energy is contagious! Here are some high-impact tasks to keep that momentum going:",
    tasks: [
      "Tackle your biggest challenge of the day",
      "Start that project you've been thinking about",
      "Reach out to someone you admire",
      "Learn something completely new",
      "Push your comfort zone with a bold goal"
    ]
  },
  focused: {
    title: "🎯 Laser focus mode!",
    message: "Your concentration is perfect! Here are some tasks that need your undivided attention:",
    tasks: [
      "Deep work on your most important project",
      "Review and optimize your workflow",
      "Create a detailed plan for the week",
      "Analyze data or research thoroughly",
      "Practice a skill that requires precision"
    ]
  },
  neutral: {
    title: "😐 Steady as you go!",
    message: "You're in a great balanced state! Here are some tasks to build momentum:",
    tasks: [
      "Organize your workspace or digital files",
      "Complete a few small tasks to build confidence",
      "Review your goals and progress",
      "Connect with a friend or colleague",
      "Try something new but not overwhelming"
    ]
  },
  tired: {
    title: "😴 Take it easy!",
    message: "You deserve some gentle tasks! Here are some low-energy but meaningful activities:",
    tasks: [
      "Declutter one small area",
      "Send a kind message to someone",
      "Listen to a podcast or audiobook",
      "Plan tomorrow's priorities",
      "Do some light stretching or walking"
    ]
  },
  stressed: {
    title: "😰 You've got this!",
    message: "Let's help you find some calm! Here are some stress-relieving tasks:",
    tasks: [
      "Take 5 deep breaths and meditate",
      "Write down your thoughts and feelings",
      "Do something creative or artistic",
      "Spend time in nature or with pets",
      "Practice self-care or relaxation"
    ]
  }
}

export function WelcomeBackSurprise({ isOpen, onClose, onAddTask, userMood, completedTasks }: WelcomeBackSurpriseProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)

  const moodData = surpriseMessages[userMood as keyof typeof surpriseMessages] || surpriseMessages.neutral

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [isOpen])

  const handleAddSelectedTasks = () => {
    selectedTasks.forEach(task => onAddTask(task))
    onClose()
  }

  const toggleTask = (task: string) => {
    setSelectedTasks(prev => 
      prev.includes(task) 
        ? prev.filter(t => t !== task)
        : [...prev, task]
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* Confetti effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * window.innerWidth, 
                    y: -50,
                    rotate: 0,
                    scale: 0
                  }}
                  animate={{ 
                    y: window.innerHeight + 50,
                    rotate: 360,
                    scale: 1
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    ease: "easeOut",
                    delay: Math.random() * 0.5
                  }}
                  className="absolute text-2xl"
                  style={{ left: `${Math.random() * 100}%` }}
                >
                  {['🎉', '✨', '🌟', '🎊', '💫'][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 opacity-50"></div>
            <div className="absolute top-4 right-4">
              <Gift className="w-6 h-6 text-yellow-500 animate-pulse" />
            </div>
            
            <div className="relative z-10">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Gift className="w-10 h-10 text-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-gray-900 mb-3"
                >
                  🎁 Welcome Back!
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 text-lg mb-2"
                >
                  {moodData.title}
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-600"
                >
                  {moodData.message}
                </motion.p>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8"
              >
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mb-2">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{completedTasks}</p>
                    <p className="text-sm text-blue-700">Tasks Completed</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mb-2">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">100%</p>
                    <p className="text-sm text-green-700">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-pink-500 rounded-full mb-2">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-pink-900">Mike</p>
                    <p className="text-sm text-pink-700">Loves You</p>
                  </div>
                </div>
              </motion.div>

              {/* Task suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-8"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  🌟 Personalized Task Suggestions
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {moodData.tasks.map((task, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      onClick={() => toggleTask(task)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedTasks.includes(task)
                          ? 'border-yellow-500 bg-yellow-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-25'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedTasks.includes(task)
                            ? 'border-yellow-500 bg-yellow-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedTasks.includes(task) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-white rounded-full"
                            />
                          )}
                        </div>
                        <span className="text-gray-800">{task}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  onClick={handleAddSelectedTasks}
                  disabled={selectedTasks.length === 0}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  size="lg"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Add {selectedTasks.length} Selected Tasks
                </Button>
                
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Maybe Later
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 