import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Trash2 } from 'lucide-react'
import { Task } from '@/lib/types'
import AITaskSplitting from './AITaskSplitting'

interface TaskCardProps {
  task: Task
  onUpdate: (task: Task, updates: Partial<Task>) => void
  onDelete: (task: Task) => void
  onSplitTask: (originalTask: Task, newTasks: string[]) => void
  userMood?: string
  isDev?: boolean
  canPerformAISplit?: boolean
  onIncrementAISplit?: () => void
  onShowSubscription?: () => void
}

export default function TaskCard({ 
  task, 
  onUpdate, 
  onDelete, 
  onSplitTask, 
  userMood, 
  isDev = false,
  canPerformAISplit = true,
  onIncrementAISplit,
  onShowSubscription
}: TaskCardProps) {
  const [showCheckAnimation, setShowCheckAnimation] = useState(false)

  const handleToggleComplete = () => {
    console.log('🔄 TaskCard handleToggleComplete called for task:', { id: task.id, title: task.title })
    
    // Show check animation
    setShowCheckAnimation(true)
    
    // Wait 1 second, then complete the task
    setTimeout(() => {
      onUpdate(task, { completed: !task.completed })
      setShowCheckAnimation(false)
    }, 1000)
  }

  return (
    <motion.div
      layout
      className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
    >
      {/* Animated background gradient */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/30 to-pink-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Subtle blob background */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-white/50 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative flex items-center space-x-3">
        {/* Checkbox with check animation */}
        <div className="relative">
          <motion.button
            onClick={handleToggleComplete}
            whileHover={{ 
              scale: 1.1,
              transition: { duration: 0.2 }
            }}
            whileTap={{ 
              scale: 0.9,
              transition: { duration: 0.1 }
            }}
            className="flex-shrink-0 w-6 h-6 rounded-lg border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 flex items-center justify-center"
          >
            <AnimatePresence>
              {task.completed && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center w-full h-full"
                >
                  <Check className="w-4 h-4 text-blue-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          
          {/* Floating check animation */}
          <AnimatePresence>
            {showCheckAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-0 bg-blue-500 rounded-lg flex items-center justify-center z-10"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <motion.span
                className="text-sm font-medium text-gray-900 transition-all duration-300"
              >
                {task.title}
              </motion.span>
            </div>
          </div>
          
          {/* AI Task Splitting */}
          <div className="mt-2">
            <AITaskSplitting 
              task={task} 
              onSplitTask={onSplitTask}
              userMood={userMood}
              isDev={isDev}
              canPerformAISplit={canPerformAISplit}
              onIncrementAISplit={onIncrementAISplit}
              onShowSubscription={onShowSubscription}
            />
          </div>
        </div>

        {/* Delete button only */}
        <motion.button
          whileHover={{ 
            scale: 1.1,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.9,
            transition: { duration: 0.1 }
          }}
          onClick={() => {
            console.log('🗑️ TaskCard delete called for task:', { id: task.id, title: task.title })
            onDelete(task)
          }}
          className="p-2 text-gray-400 hover:text-red-500 rounded-xl transition-all duration-300"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
} 