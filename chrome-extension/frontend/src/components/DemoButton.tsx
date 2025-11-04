'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Play, CheckCircle, Heart } from 'lucide-react';

export default function DemoButton() {
  const [showDemo, setShowDemo] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      title: "Welcome to Teyra! 🌵",
      content: "Meet Mike, your productivity companion! He starts as a sad cactus but grows happier as you complete tasks.",
      icon: "🌵"
    },
    {
      title: "Add Your First Task",
      content: "Click the input field and add something you need to do. Every task you complete helps Mike grow!",
      icon: "📝"
    },
    {
      title: "Complete Tasks for Points",
      content: "Regular tasks = 10 points, Eco tasks = 20 points. Watch Mike's mood change as you progress!",
      icon: "⭐"
    },
    {
      title: "Mike's Growth Journey",
      content: "• 0-99 points: Sad Mike 😢\n• 100-149 points: Neutral Mike 😐\n• 150+ points: Happy Mike 😊\nAfter 200 points, Mike resets and grows again!",
      icon: "📈"
    },
    {
      title: "Daily Reset System",
      content: "After 24 hours, your incomplete tasks reset but Mike keeps his progress. You'll get personalized email updates!",
      icon: "🔄"
    },
    {
      title: "Notifications & More",
      content: "Enable notifications for daily reminders, and watch Mike celebrate your achievements. Ready to start growing? 🌱",
      icon: "🔔"
    }
  ];

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowDemo(false);
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      {/* Demo Button */}
      <button
        onClick={() => setShowDemo(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 text-sm transition-colors"
        title="Watch the demo"
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Demo</span>
      </button>

      {/* Demo Popup */}
      <AnimatePresence>
        {showDemo && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{demoSteps[currentStep].icon}</div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {demoSteps[currentStep].title}
                    </h3>
                    <p className="text-white/60 text-sm">
                      Step {currentStep + 1} of {demoSteps.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDemo(false);
                    setCurrentStep(0);
                  }}
                  className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-white/60 mb-2">
                  <span>Progress</span>
                  <span>{currentStep + 1}/{demoSteps.length}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-white/90 leading-relaxed whitespace-pre-line">
                  {demoSteps[currentStep].content}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentStep === 0
                      ? 'bg-white/5 text-white/40 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  {currentStep === demoSteps.length - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <Play className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}