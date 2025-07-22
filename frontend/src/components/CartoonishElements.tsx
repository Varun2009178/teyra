'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Bouncing bubble component
export const BouncingBubble = ({ 
  children, 
  delay = 0, 
  duration = 3,
  className = "",
  color = "bg-blue-200/30"
}) => {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ 
        y: [0, -15, 0],
        transition: {
          delay,
          duration,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      className={`${className}`}
    >
      <div className={`rounded-full ${color} blur-xl w-full h-full`}></div>
      {children}
    </motion.div>
  );
};

// Wiggling element
export const WigglyElement = ({ 
  children, 
  delay = 0, 
  className = "" 
}) => {
  return (
    <motion.div
      animate={{ 
        rotate: [0, 2, 0, -2, 0],
        transition: {
          delay,
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Pulsing element
export const PulsingElement = ({ 
  children, 
  delay = 0, 
  className = "" 
}) => {
  return (
    <motion.div
      animate={{ 
        scale: [1, 1.05, 1],
        transition: {
          delay,
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Cartoon speech bubble
export const SpeechBubble = ({ 
  children, 
  position = "right",
  className = "" 
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="bg-white rounded-2xl p-4 shadow-md">
        {children}
      </div>
      {position === "right" && (
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45"></div>
      )}
      {position === "left" && (
        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white transform rotate-45"></div>
      )}
      {position === "top" && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45"></div>
      )}
      {position === "bottom" && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45"></div>
      )}
    </div>
  );
};

// Cartoon button with bounce effect
export const CartoonButton = ({ 
  children, 
  onClick,
  className = "",
  color = "bg-blue-500" 
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${color} text-white font-medium py-3 px-6 rounded-xl shadow-lg ${className}`}
    >
      {children}
    </motion.button>
  );
};

// Decorative blob
export const DecorativeBlob = ({
  color = "bg-blue-200/30",
  size = "w-32 h-32",
  className = ""
}) => {
  return (
    <div className={`${size} ${className}`}>
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path 
          fill={color.replace('bg-', '').replace('/30', '')} 
          d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90.2,-16.3,88.1,-1.2C86,13.9,79,27.8,70.8,41.2C62.7,54.6,53.3,67.5,40.9,75.3C28.4,83.1,14.2,85.8,-0.4,86.4C-15,87,-30,85.5,-41.6,77.7C-53.2,69.9,-61.4,55.9,-69.2,42.2C-77,28.5,-84.4,14.2,-85.6,-0.7C-86.8,-15.6,-81.8,-31.2,-73.3,-44.9C-64.8,-58.6,-52.8,-70.3,-39.1,-77.7C-25.4,-85.1,-12.7,-88.2,1.2,-90.2C15.1,-92.2,30.2,-93.1,44.7,-76.4Z" 
          transform="translate(100 100)" 
        />
      </svg>
    </div>
  );
};

// Cartoon card with slight tilt
export const CartoonCard = ({ 
  children, 
  tilt = -2,
  className = "" 
}) => {
  return (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 transform rotate-${tilt} ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </div>
  );
};

// Wavy underline
export const WavyUnderline = ({
  color = "text-yellow-300",
  width = "w-full",
  height = "h-3",
  className = ""
}) => {
  return (
    <svg className={`${width} ${height} ${color} ${className}`} viewBox="0 0 100 15" preserveAspectRatio="none">
      <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
};

// Emoji with animation
export const AnimatedEmoji = ({
  emoji,
  className = ""
}) => {
  return (
    <motion.div
      animate={{ 
        rotate: [0, 10, 0, -10, 0],
        transition: { repeat: Infinity, duration: 5, ease: "easeInOut" }
      }}
      className={className}
    >
      <span className="text-2xl">{emoji}</span>
    </motion.div>
  );
};