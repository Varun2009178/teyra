'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X } from 'lucide-react';
import Link from 'next/link';

interface AIUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string; // "AI mood tasks", "AI task parsing"
  currentLimit?: number; // What the free limit is
}

export default function AIUpgradeModal({
  isOpen,
  onClose,
  featureName = 'AI features',
  currentLimit = 1
}: AIUpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-md border-2 border-purple-400/50 rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Daily AI Limit Reached
            </h3>
            <p className="text-white/80 mb-6">
              You've used your <strong>{currentLimit} free {featureName}</strong> for today.
              <br />
              Upgrade to Pro for <strong>unlimited AI features!</strong>
            </p>

            <div className="bg-black/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-white/70 mb-3">✨ Pro Benefits:</p>
              <ul className="text-left text-sm text-white/90 space-y-2">
                <li>✓ <strong>Unlimited</strong> AI text-to-task parsing <span className="text-xs text-white/50">(Chrome ext)</span></li>
                <li>✓ <strong>3 AI mood tasks</strong> per day <span className="text-xs text-white/50">(vs 1 free)</span></li>
                <li>✓ Focus mode customization <span className="text-xs text-white/50">(Chrome ext)</span></li>
                <li>✓ Chrome extension with quick capture <span className="text-xs text-white/50">(pending approval)</span></li>
                <li>✓ Priority support</li>
              </ul>
            </div>

            <Link href="/upgrade">
              <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg">
                Upgrade to Pro - $10/month
              </button>
            </Link>

            <button
              onClick={onClose}
              className="mt-4 text-white/60 hover:text-white text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
