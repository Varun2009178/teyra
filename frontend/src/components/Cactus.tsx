import { motion } from "framer-motion";
import Image from "next/image";

interface CactusProps {
  mood?: 'happy' | 'neutral' | 'sad';
  todayCompletedTasks?: Array<{ title: string; completedAt?: string }>;
}

export const Cactus: React.FC<CactusProps> = ({ mood = 'neutral', todayCompletedTasks = [] }) => {
  const getGifSrc = () => {
    switch (mood) {
      case 'happy':
        return '/Happy.gif';
      case 'sad':
        return '/Sad With Tears 2.gif';
      default: // neutral
        return '/Neutral Calm.gif';
    }
  };

  const getMoodAnimation = () => {
    switch (mood) {
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
        className="w-48 h-48 relative"
      >
        <Image
          src={getGifSrc()}
          alt={`${mood} cactus`}
          width={192}
          height={192}
          priority={mood === 'sad'}
          unoptimized
          className="w-full h-full object-contain"
        />
        
        {/* Smooth blob-like floating elements */}
        {mood === 'happy' && (
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
        
        {mood === 'sad' && (
          <>
            {/* No floating emojis for sad mood - just the sad cactus animation */}
          </>
        )}

        {mood === 'neutral' && (
          <>
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
          </>
        )}


      </motion.div>
    </div>
  );
}; 