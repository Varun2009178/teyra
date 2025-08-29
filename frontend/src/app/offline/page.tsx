'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white/90 to-gray-100/80 flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white/90 to-gray-100/80" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-md mx-auto px-6"
      >
        {/* Icon */}
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mx-auto mb-6 flex items-center justify-center"
        >
          <WifiOff className="w-12 h-12 text-orange-600" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Don't worry! Teyra works offline too. Your tasks are saved locally and will sync when you're back online.
        </p>

        {/* Status */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-8 border border-gray-200/50">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <WifiOff className="w-4 h-4 text-orange-500" />
            <span>No internet connection</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <motion.button
            onClick={handleRetry}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </motion.button>

          <button
            onClick={() => window.history.back()}
            className="w-full text-gray-600 text-sm py-2 hover:text-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Offline Features */}
        <div className="mt-8 text-left bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-gray-200/30">
          <h3 className="font-semibold text-gray-800 mb-3">Available Offline:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>View your tasks</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Mark tasks complete</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Add new tasks</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Check your progress</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}


