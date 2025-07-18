'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Calendar, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FirstTaskCelebrationProps {
  isOpen: boolean
  onClose: () => void
  onMoodCheckIn: (mood: 'energized' | 'focused' | 'neutral' | 'tired' | 'stressed') => void
}

const moodOptions = [
  { value: 'energized', emoji: '⚡', label: 'Energized', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'focused', emoji: '🎯', label: 'Focused', color: 'bg-blue-100 text-blue-800' },
  { value: 'neutral', emoji: '😐', label: 'Neutral', color: 'bg-gray-100 text-gray-800' },
  { value: 'tired', emoji: '😴', label: 'Tired', color: 'bg-purple-100 text-purple-800' },
  { value: 'stressed', emoji: '😰', label: 'Stressed', color: 'bg-red-100 text-red-800' },
] as const

export function FirstTaskCelebration({ isOpen, onClose, onMoodCheckIn }: FirstTaskCelebrationProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [showMoodSection, setShowMoodSection] = useState(false)

  const handleMoodSelect = (mood: 'energized' | 'focused' | 'neutral' | 'tired' | 'stressed') => {
    setSelectedMood(mood)
    onMoodCheckIn(mood)
    onClose()
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
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-50"></div>
            <div className="absolute top-4 right-4">
              <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
            </div>
            
            <div className="relative z-10">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Celebration content */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  🎉 Amazing! First Task Complete!
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 mb-6"
                >
                  You've taken the first step towards building better habits! 
                  Check in tomorrow for a special surprise.
                </motion.p>
              </div>

              {/* Mood check-in section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                  How are you feeling right now?
                </h3>
                
                <div className="grid grid-cols-5 gap-2">
                  {moodOptions.map((mood) => (
                    <motion.button
                      key={mood.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMoodSelect(mood.value)}
                      className={`p-3 rounded-xl text-center transition-all duration-200 hover:shadow-md ${mood.color}`}
                    >
                      <div className="text-2xl mb-1">{mood.emoji}</div>
                      <div className="text-xs font-medium">{mood.label}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Automatic notifications info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <div className="bg-green-50 rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Mail className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Automatic Reminders</span>
                  </div>
                  <p className="text-sm text-green-700">
                    You'll automatically receive gentle reminders after 24 hours of inactivity to help you stay on track! 📧
                  </p>
                </div>
              </motion.div>

              {/* Skip button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center"
              >
                <button
                  onClick={onClose}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Maybe later
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 