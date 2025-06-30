"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type AnimationState = 'happy' | 'sad' | 'neutral';

const imageMap: Record<AnimationState, string> = {
  happy: '/animations/cactus_happy.png',
  neutral: '/animations/cactus_medium.png',
  sad: '/animations/cactus_sad.png',
};

const animationVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const happyAnimation = {
  scale: [1, 1.05, 1, 1.05, 1],
  rotate: [0, 3, -3, 3, 0],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export default function TreeAnimation() {
  const [state, setState] = useState<AnimationState>('neutral');

  useEffect(() => {
    const sequence: AnimationState[] = ['happy', 'sad', 'neutral'];
    let currentIndex = 0;

    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % sequence.length;
      setState(sequence[currentIndex]);
    }, 3000); // Cycle every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex items-center justify-center w-64 h-64">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          variants={animationVariants}
          initial="initial"
          animate={state === 'happy' ? { ...animationVariants.animate, ...happyAnimation } : animationVariants.animate}
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Image
            src={imageMap[state]}
            alt={`${state} cactus character`}
            width={256}
            height={256}
            priority
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}