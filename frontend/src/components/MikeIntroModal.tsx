import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, ArrowRight } from "lucide-react";

interface MikeIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MikeIntroModal: React.FC<MikeIntroModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative w-full max-w-md bg-background border border-foreground/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Mike the Cactus */}
            <div className="relative p-8 text-center">
              {/* Crying Mike Animation */}
              <motion.div
                initial={{ scale: 0.8, rotate: -5 }}
                animate={{ 
                  scale: [0.8, 1, 0.8],
                  rotate: [-5, 5, -5],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-24 h-24 mx-auto mb-6 relative"
              >
                {/* Cactus Body */}
                <div className="w-full h-full bg-gradient-to-b from-green-400 to-green-600 rounded-full flex items-center justify-center relative">
                  {/* Cactus Arms */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-8 bg-green-500 rounded-full transform -translate-x-1"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-8 bg-green-500 rounded-full transform translate-x-1"></div>
                  
                  {/* Sad Face */}
                  <div className="flex flex-col items-center">
                    {/* Eyes */}
                    <div className="flex gap-3 mb-1">
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    </div>
                    {/* Sad Mouth */}
                    <div className="w-4 h-1 bg-black rounded-full transform rotate-180"></div>
                  </div>
                  
                  {/* Tears */}
                  <motion.div
                    animate={{ 
                      y: [0, 10],
                      opacity: [1, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                  >
                    <div className="w-1 h-3 bg-blue-400 rounded-full"></div>
                  </motion.div>
                  <motion.div
                    animate={{ 
                      y: [0, 10],
                      opacity: [1, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.5
                    }}
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                  >
                    <div className="w-1 h-3 bg-blue-400 rounded-full"></div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Story Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-foreground">
                  This is Mike 🌵
                </h2>
                
                <div className="space-y-3 text-foreground/70">
                  <p className="text-sm leading-relaxed">
                    He's usually sad because no one actually completes their tasks...
                  </p>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                  >
                    <p className="text-sm font-medium text-blue-400">
                      💡 But you can help him grow happier!
                    </p>
                  </motion.div>
                  
                  <p className="text-sm leading-relaxed">
                    Every small win you complete makes Mike a little bit happier. 
                    Watch him transform from sad to joyful as you build momentum, one win at a time!
                  </p>
                </div>

                {/* Features Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="flex items-center justify-center gap-2 text-xs text-foreground/50"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI-powered daily wins</span>
                  <Sparkles className="w-3 h-3" />
                </motion.div>
              </motion.div>
            </div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="p-6 border-t border-foreground/10 bg-foreground/5"
            >
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
              >
                <Heart className="w-4 h-4" />
                Let's Make Mike Happy!
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 