import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scissors, Sparkles, Check, X } from 'lucide-react'
import { breakDownTask } from '@/lib/groq'
import { Task } from '@/lib/types'

interface AITaskSplittingProps {
  task: Task
  onSplitTask: (originalTask: Task, newTasks: string[]) => void
  userMood?: string
  isDev?: boolean
  canPerformAISplit?: boolean
  onIncrementAISplit?: () => void
  onShowSubscription?: () => void
}

export default function AITaskSplitting({ 
  task, 
  onSplitTask, 
  userMood, 
  isDev = false,
  canPerformAISplit = true,
  onIncrementAISplit,
  onShowSubscription
}: AITaskSplittingProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string>('')

  // Check if task is "long" (more than 50 characters or contains multiple action items)
  const isLongTask = task.title.length > 50 || 
                    (task.title.includes(' and ') && task.title.length > 30) || 
                    (task.title.includes(' & ') && task.title.length > 30) ||
                    (task.title.includes(',') && task.title.length > 30) ||
                    task.title.toLowerCase().includes('multiple') ||
                    task.title.toLowerCase().includes('several')

  // Minimum length for splitting (even in dev mode)
  const minLengthForSplit = 30
  const meetsMinLength = task.title.length >= minLengthForSplit

  // Show split button only for tasks that meet minimum length AND are either long or in dev mode AND have not been split
  const shouldShowSplit = meetsMinLength && (isLongTask || isDev) && !task.hasBeenSplit;

  const analyzeAndSplitTask = async () => {
    if (!isLongTask && !isDev) return
    
    // Check if user can perform AI split
    if (!canPerformAISplit) {
      if (onShowSubscription) {
        onShowSubscription();
      }
      return;
    }
    
    setIsAnalyzing(true)
    setError('')
    
    try {
      console.log('🤖 AI analyzing task for splitting:', task.title)
      const taskSuggestions = await breakDownTask(task.title, userMood)
      
      if (taskSuggestions.length > 0) {
        console.log('✅ AI suggestions generated:', taskSuggestions)
        console.log('🚀 Calling onSplitTask directly with:', { task: task.title, suggestions: taskSuggestions })
        
        // Increment AI split count
        if (onIncrementAISplit) {
          onIncrementAISplit();
        }
        
        // Immediately split the task without showing modal
        onSplitTask(task, taskSuggestions)
      } else {
        setError('Could not generate suggestions. Try again!')
        console.error('❌ No suggestions generated')
      }
    } catch (err) {
      console.error('❌ Error analyzing task:', err)
      setError('AI analysis failed. Check your connection!')
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!shouldShowSplit) return null

  return (
    <div className="relative">
      {/* Split button - now directly splits without modal */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={analyzeAndSplitTask}
        disabled={isAnalyzing}
        className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200/50 rounded-xl text-sm text-purple-700 hover:from-purple-100 hover:to-blue-100 transition-all duration-300 group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          animate={isAnalyzing ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: isAnalyzing ? Infinity : 0 }}
        >
          {isAnalyzing ? (
            <Sparkles className="w-4 h-4" />
          ) : (
            <Scissors className="w-4 h-4" />
          )}
        </motion.div>
        <span className="font-medium">
          {isAnalyzing ? 'Splitting...' : isDev ? 'Split Task (Dev)' : 'Split Task'}
        </span>
      </motion.button>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-xs text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Direct split test button */}
      {isDev && (
        <div style={{ border: '3px solid blue', padding: '10px', margin: '10px 0', background: 'yellow' }}>
          <p>DEBUG: Dev mode is ON</p>
          <p>isAnalyzing: {isAnalyzing.toString()}</p>
          <button 
            onClick={() => {
              console.log('🔧 Direct split test clicked')
              onSplitTask(task, ['Direct Test 1', 'Direct Test 2', 'Direct Test 3'])
            }}
            style={{ background: 'green', color: 'white', padding: '5px', margin: '5px' }}
          >
            DIRECT SPLIT TEST
          </button>
        </div>
      )}
    </div>
  )
} 