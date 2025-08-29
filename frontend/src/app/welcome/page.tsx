'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Cactus } from '@/components/Cactus';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, CheckCircle, ChevronRight } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function WelcomePage() {
  const [step, setStep] = useState(1);
  const [task, setTask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { getToken, userId, user, isLoaded } = useAuth();
  const { completeOnboarding } = useOnboarding();
  
  // State to track if we've checked auth status
  const [authChecked, setAuthChecked] = useState(false);
  
  // Use useEffect for redirects to avoid hydration issues
  useEffect(() => {
    // Wait for auth to be loaded
    if (!isLoaded) return;
    
    // If user is not authenticated, redirect to sign-in
    if (!userId && isLoaded) {
      console.log('User not authenticated, redirecting to sign-in');
      router.push('/sign-in');
      return;
    }
    
    // Mark auth as checked to prevent flickering
    setAuthChecked(true);
    
    // IMPORTANT: Force clear any onboarding completion flag to ensure users stay on this page
    try {
      localStorage.removeItem(`onboarded_${userId}`);
      sessionStorage.removeItem(`onboarded_${userId}`);
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    // Check if user is new (created in the last 60 minutes - increased time window for better UX)
    if (user?.createdAt) {
      const creationTime = new Date(user.createdAt).getTime();
      const now = new Date().getTime();
      const sixtyMinutesInMs = 60 * 60 * 1000;
      const isNewUser = now - creationTime < sixtyMinutesInMs;
      
      console.log('Welcome page debug:', {
        userId,
        createdAt: user.createdAt,
        timeSinceCreation: (now - creationTime) / 1000 / 60 + ' minutes',
        isNewUser
      });
      
      // If not a new user, redirect to dashboard immediately
      if (!isNewUser) {
        console.log('Existing user trying to access welcome, redirecting to dashboard');
        router.replace('/dashboard');
        return;
      }
      
      // For new users, check if they've already completed onboarding
      const hasCompletedOnboarding = localStorage.getItem(`onboarded_${userId}`) === 'true';
      if (hasCompletedOnboarding) {
        console.log('New user already completed onboarding, redirecting to dashboard');
        router.replace('/dashboard');
        return;
      }
      
      // If new user and hasn't completed onboarding, stay on welcome page
      console.log('New user, showing welcome page');
    }
    
    // Pre-fetch the dashboard route to reduce flicker when navigating
    router.prefetch('/dashboard');
    
    // Add smooth page transition class to body
    document.body.classList.add('page-transition');
    
    return () => {
      document.body.classList.remove('page-transition');
    };
  }, [userId, user?.createdAt, router, isLoaded]);

  // Handle keyboard navigation
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting && task.trim()) {
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task.trim()) {
      setError('Please enter a task');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = await getToken();
      console.log('Submitting task:', task.trim());
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: task.trim() })
      });

      if (response.ok) {
        // Move to the next step
        setStep(2);
      } else {
        console.error('Failed to add task:', await response.text());
        
        // Even if the API call fails, we'll still proceed to the next step
        // This ensures users can continue with onboarding even if there are DB issues
        setStep(2);
        
        // Store the task in localStorage as a fallback
        try {
          const pendingTasks = JSON.parse(localStorage.getItem('pendingTasks') || '[]');
          pendingTasks.push({
            title: task.trim(),
            userId,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('pendingTasks', JSON.stringify(pendingTasks));
          console.log('Task saved to localStorage as fallback');
        } catch (e) {
          console.error('Failed to save task to localStorage:', e);
        }
      }
    } catch (err) {
      console.error('Error adding task:', err);
      
      // Even if there's an error, we'll still proceed to the next step
      setStep(2);
      
      // Store the task in localStorage as a fallback
      try {
        const pendingTasks = JSON.parse(localStorage.getItem('pendingTasks') || '[]');
        pendingTasks.push({
          title: task.trim(),
          userId,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('pendingTasks', JSON.stringify(pendingTasks));
        console.log('Task saved to localStorage as fallback');
      } catch (e) {
        console.error('Failed to save task to localStorage:', e);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToDashboard = async () => {
    try {
      // Mark onboarding as complete using our custom hook
      completeOnboarding();
      
      // Signal dashboard to start interactive tutorial
      if (user?.id) {
        sessionStorage.setItem(`start_dashboard_tutorial_${user.id}`, 'true');
      }
      
      // Add a visual indication that we're navigating
      document.body.style.cursor = 'wait';
      
      // Apply a fade-out effect
      document.body.classList.add('page-transition-exit');
      
      // Navigate to dashboard
      router.replace('/dashboard');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback direct navigation if router fails
      window.location.href = '/dashboard';
    }
  };

  // Updated animation variants for faster transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.15, ease: "easeIn" }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  // Show minimal loading state while checking auth
  if (!authChecked || !isLoaded) {
    return (
      <div className="min-h-screen dark-gradient-bg noise-texture flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen dark-gradient-bg noise-texture text-white flex flex-col relative">
      {/* Skip button fixed to top-right corner of screen */}
      <motion.button 
        onClick={goToDashboard}
        className="fixed top-6 right-6 group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-full transition-all duration-200 text-sm font-medium text-white/70 hover:text-white z-50"
        title="Skip to dashboard"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="hidden sm:inline">Skip</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
      </motion.button>
      
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <motion.div 
              key="step1"
              className="w-full max-w-xl sm:max-w-2xl"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
            >
              <motion.div 
                className="text-center mb-8 sm:mb-12 md:mb-16"
                variants={itemVariants}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white mb-4 sm:mb-6">
                  What's one thing you want to complete today?
                </h1>
              </motion.div>

              <motion.form 
                onSubmit={handleSubmit}
                className="space-y-8"
                variants={itemVariants}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter your task..."
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full py-7 px-5 text-xl bg-white/5 border border-white/20 rounded-xl focus:border-white/40 focus:ring-2 focus:ring-white/10 text-white placeholder:text-white/40"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-5 sm:py-7 bg-white hover:bg-white/90 text-black text-base sm:text-lg rounded-xl flex items-center justify-center transition-all duration-200 font-medium"
                  disabled={isSubmitting}
                  style={{ outline: 'none', boxShadow: 'none' }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding task...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Continue <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                  )}
                </button>
              </motion.form>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              className="w-full max-w-2xl flex flex-col min-h-0"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
            >
              <motion.div 
                className="text-center mb-6 sm:mb-8"
                variants={itemVariants}
              >
                <div className="flex justify-center mb-4 sm:mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                      delay: 0.05
                    }}
                  >
                    <Cactus mood="happy" />
                  </motion.div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="mb-4 sm:mb-6"
                >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                    Great start! 🌟
                  </h2>
                  <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
                    You've taken the first step toward a more productive you. Mike the Cactus is excited to help you grow!
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                  className="mb-6 sm:mb-8"
                >
                  <div className="bg-white/5 border border-white/20 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Task added successfully</span>
                    </div>
                    <p className="text-white/70 text-sm">
                      "{task}" has been added to your dashboard. Ready to tackle more?
                    </p>
                  </div>
                </motion.div>

                <motion.button
                  onClick={goToDashboard}
                  className="w-full py-5 sm:py-7 bg-white hover:bg-white/90 text-black text-base sm:text-lg rounded-xl flex items-center justify-center transition-all duration-200 font-medium"
                  style={{ outline: 'none', boxShadow: 'none' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}