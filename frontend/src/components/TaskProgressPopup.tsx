"use client";

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Clock, Calendar, Target } from 'lucide-react'
import { Button } from '@/components/ui/button';

interface Task {
  id: number | string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface TaskProgressPopupProps {
  isOpen: boolean;
  onClose: () => void;
  completedTasks: Task[];
  totalTasks: number;
  lastVisitDate: string;
  currentDate: string;
  onStartFresh: () => Promise<void>;
}

export function TaskProgressPopup({ 
  isOpen, 
  onClose, 
  completedTasks, 
  totalTasks, 
  lastVisitDate, 
  currentDate, 
  onStartFresh
}: TaskProgressPopupProps) {
  const [loading, setLoading] = React.useState(false)

  const handleStartFresh = async () => {
    setLoading(true)
    try {
      await onStartFresh()
      onClose()
    } catch (error) {
      console.error('Error starting fresh:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Daily Progress Summary 📊
                </h2>
                <p className="text-gray-600">
                  {lastVisitDate === currentDate ? 'Today\'s Progress' : 'Progress since last visit'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-green-50 rounded-lg p-4 border border-green-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Completed</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{completedTasks.length}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-50 rounded-lg p-4 border border-blue-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{totalTasks}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-purple-50 rounded-lg p-4 border border-purple-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Completion Rate</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0}%
                </p>
              </motion.div>
            </div>

            {/* Completed Tasks List */}
            {completedTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  Completed Tasks
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {completedTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 flex-1">{task.title}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(task.completedAt || task.updatedAt).toLocaleTimeString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-end space-x-3"
            >
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
              <Button
                onClick={handleStartFresh}
                disabled={loading}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {loading ? 'Starting Fresh...' : 'Start Fresh Tomorrow'}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 