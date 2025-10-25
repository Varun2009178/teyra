'use client';

import React from 'react';
import { useProStatus } from '@/hooks/useProStatus';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

interface ProFeatureProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function ProFeature({
  children,
  fallback,
  showUpgradePrompt = true
}: ProFeatureProps) {
  const { isPro, isLoading } = useProStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden border border-white/10 bg-black/30 backdrop-blur-sm rounded-lg p-6"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-white/60" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Pro Feature</h3>
          <p className="text-white/60 text-sm mb-4">
            Upgrade to Teyra Pro to unlock this feature
          </p>
          <a href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-cyan-400 text-black font-bold rounded-lg text-sm transition-all duration-300"
            >
              Upgrade Now
            </motion.button>
          </a>
        </div>
      </motion.div>
    );
  }

  return null;
}
