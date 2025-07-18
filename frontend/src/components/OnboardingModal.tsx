import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lightbulb, Zap, X, ArrowRight } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-blue-500" />,
      title: "AI Quick Wins",
      description: "Turn big tasks into 3 easy steps that feel achievable",
      highlight: "Try adding a complex task and watch the magic happen!"
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-yellow-500" />,
      title: "Smart Suggestions",
      description: "Get gentle task ideas when your list is empty",
      highlight: "Complete your tasks and see what appears below!"
    },
    {
      icon: <Zap className="w-6 h-6 text-emerald-500" />,
      title: "Mood-Aware AI",
      description: "AI adapts to how you're feeling today",
      highlight: "Check in with your mood to get personalized help"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-white border-2 border-gray-200 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 border-b-2 border-gray-100 bg-gradient-to-r from-red-50 to-pink-50">
              {/* Floating decorative elements */}
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-3 left-3 text-xl opacity-30"
              >
                ✨
              </motion.div>
              <motion.div
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-6 text-lg opacity-40"
              >
                🌟
              </motion.div>
              
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                </motion.div>
                
                <h2 className="text-2xl font-black text-gray-900 mb-2">
                  Welcome to <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Teyra</span>! 🌵
                </h2>
                <p className="text-base text-gray-700 font-medium">
                  Your AI-powered productivity companion
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="p-6 space-y-4 bg-white">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                >
                  <motion.div 
                    className="flex-shrink-0 mt-1"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                      {feature.icon}
                    </div>
                  </motion.div>
                  
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-red-600 font-semibold">
                      <span className="text-sm">💡</span>
                      {feature.highlight}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t-2 border-gray-100 bg-gradient-to-r from-red-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-gray-800 mb-1">
                    Ready to get started?
                  </p>
                  <p className="text-xs text-gray-600">
                    Let's make productivity fun! 🚀
                  </p>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Let's Go!
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 