'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      title: "Meet Mike the Cactus 🌵",
      description: "Mike is your productivity companion who learns from your habits and grows happier as you complete tasks. He'll adapt to your work patterns!",
      icon: <span className="text-4xl">🌵</span>
    },
    {
      title: "Smart Notifications 🔔",
      description: "AI learns when you're most productive and sends personalized reminders at optimal times. No spam - just helpful nudges when you need them!",
      icon: <span className="text-4xl">🔔</span>
    },
    {
      title: "Daily Reset & Emails 📧",
      description: "Every 24 hours, get a personalized email summary of your accomplishments, plus smart suggestions for tomorrow based on your patterns.",
      icon: <span className="text-4xl">📧</span>
    },
    {
      title: "Mood-Based Tasks 💙",
      description: "Daily mood check-ins help the AI suggest tasks that match your energy level and keep you emotionally balanced.",
      icon: <span className="text-4xl">💙</span>
    },
    {
      title: "You're All Set! 🚀",
      description: "The AI is now learning your patterns! Be consistent for a few days to unlock personalized insights, smart notifications, and tailored task suggestions.",
      icon: <span className="text-4xl">🚀</span>
    }
  ];

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-center items-center mb-6">
            <div className="text-sm font-medium text-white/60">
              {currentStep + 1} of {tourSteps.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                className="bg-white rounded-full h-2"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <div className="mb-4 flex justify-center">
                {currentTourStep.icon}
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                {currentTourStep.title}
              </h2>
              <p className="text-white/70 text-base leading-relaxed">
                {currentTourStep.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              className="bg-white hover:bg-white/90 text-black flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium"
            >
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Skip option for non-last steps */}
          {!isLastStep && (
            <div className="text-center mt-4">
              <button
                onClick={handleSkip}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Skip tour
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}