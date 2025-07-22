'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cactus } from '@/components/Cactus';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function WelcomePage() {
  const [step, setStep] = useState(1);
  const [task, setTask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { getToken, userId, user } = useAuth();
  const { completeOnboarding } = useOnboarding();
  
  // Use useEffect for redirects to avoid hydration issues
  React.useEffect(() => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }
    
          // Check if user is new (created in the last 5 minutes)
      if (user?.createdAt) {
        const creationTime = new Date(user.createdAt).getTime();
        const now = new Date().getTime();
        const fiveMinutesInMs = 5 * 60 * 1000;
        const isNewUser = now - creationTime < fiveMinutesInMs;
        
        // Debug logging (commented out to reduce console noise)
        // console.log('Welcome page debug:', {
        //   userId,
        //   createdAt: user.createdAt,
        //   creationTime,
        //   now,
        //   timeDiff: now - creationTime,
        //   isNewUser,
        //   hasCompletedOnboarding: localStorage.getItem(`onboarded_${userId}`) === 'true'
        // });
        
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
  }, [userId, user?.createdAt, router]);

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
        setError('Failed to add task. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Error adding task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToDashboard = async () => {
    try {
      // Mark onboarding as complete using our custom hook
      completeOnboarding();
      
      // Add a visual indication that we're navigating
      document.body.style.cursor = 'wait';
      
      // Apply a fade-out effect
      document.body.classList.add('page-transition-exit');
      
      // Force a small delay to ensure localStorage is updated and animation plays
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // First try the Next.js router
      router.replace('/dashboard');
      
      // Set a fallback in case the router navigation doesn't work
      setTimeout(() => {
        if (document.body.style.cursor === 'wait') {
          console.log('Router navigation may have failed, using direct navigation');
          window.location.href = '/dashboard';
        }
      }, 300);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback direct navigation if router fails
      window.location.href = '/dashboard';
    }
  };

  // Updated animation variants for smoother transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex items-center justify-center p-8 md:p-12">
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <motion.div 
              key="step1"
              className="w-full max-w-2xl"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
            >
              <motion.div 
                className="text-center mb-16"
                variants={itemVariants}
              >
                <h1 className="text-4xl md:text-5xl font-medium text-black mb-6">
                  What's one thing you want to complete today?
                </h1>
              </motion.div>

              <motion.form 
                onSubmit={handleSubmit}
                className="space-y-8"
                variants={itemVariants}
              >
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your task..."
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    className="w-full py-7 px-5 text-xl border border-gray-200 rounded-xl focus:border-black focus:ring-black shadow-sm"
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full py-7 bg-black hover:bg-gray-800 text-white text-lg rounded-xl flex items-center justify-center shadow-sm transition-all duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding task...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Continue <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  )}
                </Button>
              </motion.form>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              className="w-full max-w-2xl"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
            >
              <motion.div 
                className="text-center mb-12"
                variants={itemVariants}
              >
                <div className="flex justify-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1
                    }}
                  >
                    <Cactus mood="happy" />
                  </motion.div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>Task added</span>
                  </div>
                </motion.div>
                
                <h1 className="text-4xl md:text-5xl font-medium text-black mb-6">
                  Meet Mike the Cactus
                </h1>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Mike is your productivity companion! He grows happier as you complete tasks. 
                  Start with small goals, build momentum, and watch Mike transform from sad to happy as you reach milestones. 
                  He'll suggest tasks based on your mood and celebrate your progress with you.
                </p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  onClick={goToDashboard}
                  className="w-full py-7 bg-black hover:bg-gray-800 text-white text-lg rounded-xl flex items-center justify-center shadow-sm transition-all duration-200"
                >
                  <span className="flex items-center">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}