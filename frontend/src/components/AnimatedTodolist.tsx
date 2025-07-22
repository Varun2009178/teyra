'use client';

import { useEffect, useRef, useState } from 'react';

const AnimatedTodolist = () => {
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGratification, setShowGratification] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  const tasks = [
    'Complete morning routine',
    'Review project goals', 
    'Schedule team meeting',
    'Update documentation',
    'Plan tomorrow\'s tasks'
  ];

  const negativePoints = [
    'Not gratifying',
    'Not motivational', 
    'Not worth it'
  ];

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  const startAnimation = () => {
    if (isAnimating || hasAnimated) return;
    
    console.log('Starting animation...');
    
    // Clear any existing timeouts
    clearAllTimeouts();
    
    setIsAnimating(true);
    setCompletedTasks([]);
    setShowGratification(false);
    
    // Complete tasks one by one with faster delays
    let currentIndex = 0;
    
    const completeNextTask = () => {
      if (currentIndex < tasks.length) {
        console.log(`Completing task ${currentIndex}`);
        setCompletedTasks(prev => {
          const newTasks = [...prev, currentIndex];
          console.log('New completed tasks:', newTasks);
          return newTasks;
        });
        
        // Schedule next task
        const timeout = setTimeout(() => {
          currentIndex++;
          completeNextTask();
        }, 800);
        timeoutsRef.current.push(timeout);
      } else {
        // All tasks completed, show gratification
        console.log('All tasks completed, showing gratification');
        setShowGratification(true);
        
        // Mark as finished after delay
        const finishTimeout = setTimeout(() => {
          console.log('Animation finished');
          setIsAnimating(false);
          setHasAnimated(true);
        }, 2000);
        timeoutsRef.current.push(finishTimeout);
      }
    };
    
    // Start the first task immediately
    completeNextTask();
  };

  useEffect(() => {
    console.log('useEffect triggered, isAnimating:', isAnimating, 'hasAnimated:', hasAnimated);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log('Intersection:', entry.isIntersecting, 'isAnimating:', isAnimating, 'hasAnimated:', hasAnimated);
          if (entry.isIntersecting && !isAnimating && !hasAnimated) {
            console.log('Starting animation from intersection observer');
            startAnimation();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      clearAllTimeouts();
      observer.disconnect();
    };
  }, []); // Remove dependencies to prevent re-creation

  const progress = (completedTasks.length / tasks.length) * 100;

  return (
    <div ref={sectionRef} className="max-w-4xl mx-auto flex items-center justify-center space-x-16">
      {/* Debug info */}
      <div className="absolute top-0 left-0 text-xs text-gray-500 p-2">
        Debug: {completedTasks.length}/5, Animating: {isAnimating.toString()}, HasAnimated: {hasAnimated.toString()}
      </div>
      {/* Todolist */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Tasks</h3>
          <div className="text-sm text-gray-500">
            <span className="text-green-600 font-medium">{completedTasks.length}</span>/5 completed
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const isCompleted = completedTasks.includes(index);
            return (
              <div key={index} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors">
                <div 
                  className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white text-sm font-bold scale-110' 
                      : 'border-gray-300'
                  }`}
                >
                  {isCompleted && '✓'}
                </div>
                <span 
                  className={`flex-1 transition-all duration-300 ${
                    isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {task}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Negative Points */}
      <div className={`text-left transition-all duration-500 ${showGratification ? 'opacity-100' : 'opacity-0'}`}>
        <div className="space-y-4">
          {negativePoints.map((point, index) => (
            <div 
              key={index}
              className={`flex items-center space-x-4 transition-all duration-500 ${
                showGratification ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
              }`}
              style={{ 
                transitionDelay: `${index * 300}ms`,
                transitionDuration: '600ms'
              }}
            >
              <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 shadow-sm"></div>
              <span className={`text-gray-800 font-semibold ${
                index === 2 ? 'text-2xl font-bold' : 'text-xl'
              }`}>
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimatedTodolist; 