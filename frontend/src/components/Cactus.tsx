import { motion } from "framer-motion";
import Image from "next/image";

interface CactusProps {
  mood?: 'happy' | 'neutral' | 'sad' | 'overwhelmed' | 'tired' | 'stressed' | 'focused' | 'excited' | 'energized';
  todayCompletedTasks?: Array<{ title: string; completedAt?: string }>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Cactus: React.FC<CactusProps> = ({ mood = 'neutral', todayCompletedTasks = [], size = 'lg' }) => {
  // Map expanded moods to cactus states
  const getCactusMood = () => {
    if (mood === 'energized' || mood === 'excited' || mood === 'focused') {
      return 'happy';
    } else if (mood === 'neutral') {
      return 'neutral';
    } else {
      return 'sad'; // overwhelmed, tired, stressed
    }
  };

  const cactusMood = getCactusMood();

  const getGifSrc = () => {
    switch (cactusMood) {
      case 'happy':
        return '/Happy.gif';
      case 'sad':
        return '/Sad With Tears 2.gif';
      default: // neutral
        return '/Neutral Calm.gif';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12';
      case 'md':
        return 'w-16 h-16';
      case 'lg':
        return 'w-24 h-24';
      case 'xl':
        return 'w-32 h-32';
      default:
        return 'w-24 h-24';
    }
  };

  const getMoodAnimation = () => {
    switch (cactusMood) {
      case 'happy':
        return {
          y: [-2, 2, -2],
          rotate: [0, 1, -1, 0],
          scale: [1, 1.02, 1]
        };
      case 'sad':
        return {
          y: [0, -1, 0],
          rotate: [0, -0.5, 0.5, 0],
          scale: [1, 0.99, 1]
        };
      default: // neutral
        return {
          y: [-1, 1, -1],
          rotate: [0, 0.5, -0.5, 0],
          scale: [1, 1.01, 1]
        };
    }
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ 
          ...getMoodAnimation()
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative ${getSizeClasses()}`}
      >
        <Image
          src={getGifSrc()}
          alt={`${mood} cactus`}
          fill
          priority={mood === 'sad'}
          unoptimized
          className="object-contain"
        />
        
        {/* Floating elements for different moods */}
        {cactusMood === 'happy' && size === 'xl' && (
          <>
            <motion.div
              animate={{
                y: [-8, -16, -8],
                x: [-2, 2, -2],
                opacity: [0.6, 1, 0.6],
                scale: [0.9, 1.1, 0.9]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-3 -right-3 text-2xl"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{
                y: [-12, -20, -12],
                x: [2, -2, 2],
                opacity: [0.4, 0.8, 0.4],
                scale: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute -top-1 -left-1 text-xl"
            >
              🌟
            </motion.div>
            <motion.div
              animate={{
                y: [-6, -14, -6],
                x: [-1, 1, -1],
                opacity: [0.3, 0.6, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-lg"
            >
              💫
            </motion.div>
          </>
        )}

        {cactusMood === 'neutral' && size === 'xl' && (
          <motion.div
            animate={{
              y: [-3, -8, -3],
              x: [-1, 1, -1],
              opacity: [0.2, 0.5, 0.2],
              scale: [0.9, 1.1, 0.9]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-2 -right-2 text-lg"
          >
            🌱
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};