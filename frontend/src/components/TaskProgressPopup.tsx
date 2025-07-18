'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Clock, Calendar, Target } from 'lucide-react'

interface Task {
  id: string
  userId: string
  title: string
  completed: boolean
  createdAt: string
  completedAt?: string
}

interface TaskProgressPopupProps {
  isOpen: boolean
  onClose: () => void
  completedTasks: Task[]
  incompleteTasks: Task[]
  lastVisitDate: string
  currentDate: string
  onStartFresh: () => Promise<void>
}

export function TaskProgressPopup({ 
  isOpen, 
  onClose, 
  completedTasks, 
  incompleteTasks, 
  lastVisitDate, 
  currentDate, 
  onStartFresh
}: TaskProgressPopupProps) {
  const [loading, setLoading] = React.useState(false)
  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleStartFresh = async () => {
    setLoading(true)
    await onStartFresh()
    setLoading(false)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => {}}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50"></div>
          <div className="absolute top-4 right-4">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Target className="w-8 h-8 text-white" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 mb-2"
              >
                Welcome Back! 🌵
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-4"
              >
                Here's your progress since {formatDate(lastVisitDate)}
              </motion.p>

              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Last visit: {formatDate(lastVisitDate)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Today: {formatDate(currentDate)}</span>
                </div>
              </div>
            </div>

            {/* Progress Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            >
              {/* Completed Tasks */}
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">Completed Tasks</h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                    {completedTasks.length}
                  </span>
                </div>
                
                {completedTasks.length > 0 ? (
                  <div className="space-y-2">
                    {completedTasks.slice(0, 5).map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-green-700 line-through">{task.title}</span>
                      </motion.div>
                    ))}
                    {completedTasks.length > 5 && (
                      <p className="text-xs text-green-600 mt-2">
                        +{completedTasks.length - 5} more completed
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-green-600 text-sm">No tasks completed since last visit</p>
                )}
              </div>

              {/* Incomplete Tasks */}
              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center space-x-2 mb-4">
                  <X className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-800">Still Pending</h3>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                    {incompleteTasks.length}
                  </span>
                </div>
                
                {incompleteTasks.length > 0 ? (
                  <div className="space-y-2">
                    {incompleteTasks.slice(0, 5).map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        <span className="text-orange-700">{task.title}</span>
                      </motion.div>
                    ))}
                    {incompleteTasks.length > 5 && (
                      <p className="text-xs text-orange-600 mt-2">
                        +{incompleteTasks.length - 5} more pending
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-orange-600 text-sm">All tasks completed! 🎉</p>
                )}
              </div>
            </motion.div>

            {/* Daily Reset Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-200"
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">Daily Reset Complete</span>
              </div>
              <p className="text-sm text-blue-700">
                Your mood check-ins and AI task splits have been refreshed for today!
              </p>
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center"
            >
              <button
                onClick={handleStartFresh}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                )}
                {loading ? 'Starting Fresh...' : "Let's Get Started! 🚀"}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 