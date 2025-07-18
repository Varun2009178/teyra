import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles } from 'lucide-react'

interface TaskInputProps {
  onSubmit: (text: string) => void
}

export default function TaskInput({ onSubmit }: TaskInputProps) {
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📝 TaskInput form submitted with text:', text)
    if (text.trim()) {
      console.log('✅ Calling onSubmit with:', text.trim())
      setIsSubmitting(true)
      onSubmit(text.trim())
      setText('')
      
      // Reset submission state after animation
      setTimeout(() => setIsSubmitting(false), 400)
    } else {
      console.log('❌ Empty text, not submitting')
    }
  }

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative group">
        <motion.input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Try typing out a long task like 'Plan and organize the entire project including research, design, and implementation phases'"
          className={`w-full px-4 py-3 pr-12 backdrop-blur-sm border rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 group-hover:border-blue-300/50 ${
            text.length > 0 
              ? 'bg-blue-50/90 border-blue-300/50 text-blue-900' 
              : 'bg-white/80 border-gray-200/50 text-gray-900'
          }`}
          whileFocus={{ 
            scale: 1.02,
            transition: { duration: 0.3, ease: "easeOut" }
          }}
          animate={isSubmitting ? {
            scale: 0.98,
            x: [0, -5, 5, 0]
          } : {}}
          transition={{ duration: 0.2 }}
        />
        
        <motion.button
          type="submit"
          disabled={!text.trim()}
          whileHover={{ 
            scale: 1.1,
            rotate: 5,
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.9,
            rotate: -5,
            transition: { duration: 0.1 }
          }}
          animate={isSubmitting ? {
            scale: 1.2,
            rotate: [0, 10, -10, 0],
            transition: { duration: 0.4 }
          } : {}}
          transition={{ duration: 0.2 }}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.div
                key="submitting"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div
                key="normal"
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -180 }}
                transition={{ duration: 0.3 }}
              >
                <Plus className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        
        {/* Animated focus indicator */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl pointer-events-none"
            />
          )}
        </AnimatePresence>
        
        {/* Submission success indicator */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl pointer-events-none"
            />
          )}
        </AnimatePresence>
        
        {/* Floating particles effect */}
        <AnimatePresence>
          {isFocused && text.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -top-2 -right-2 w-2 h-2 bg-blue-400 rounded-full"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-full h-full bg-blue-400 rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {text.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center space-x-2 text-sm text-gray-500 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl px-3 py-2 border border-blue-100/50"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              Press Enter to add task
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  )
} 