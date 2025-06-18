'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Leaf, Award, Sprout, ShieldCheck, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Configuration for Levels & Titles ---
const levels = [
  { level: 1, title: "Eco-Sprout", minScore: 0, icon: <Sprout className="w-8 h-8" /> },
  { level: 2, title: "Green Apprentice", minScore: 100, icon: <Leaf className="w-8 h-8" /> },
  { level: 3, title: "Eco-Advocate", minScore: 250, icon: <Award className="w-8 h-8" /> },
  { level: 4, title: "Green Guardian", minScore: 500, icon: <ShieldCheck className="w-8 h-8" /> },
  { level: 5, title: "Sustainability Champion", minScore: 1000, icon: <Crown className="w-8 h-8" /> },
];

const getUserLevel = (score: number) => {
  return levels.slice().reverse().find(l => score >= l.minScore) || levels[0];
};
// -----------------------------------------

export default function ImpactPage() {
  const [totalEcoScore, setTotalEcoScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEcoScore = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("You must be logged in to view your impact.");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('total_eco_score')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        setTotalEcoScore(profileData.total_eco_score);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchEcoScore();
  }, []);

  const score = totalEcoScore ?? 0;
  const currentUserLevel = getUserLevel(score);
  const nextLevel = levels.find(l => l.level === currentUserLevel.level + 1);

  const progressPercentage = nextLevel
    ? ((score - currentUserLevel.minScore) / (nextLevel.minScore - currentUserLevel.minScore)) * 100
    : 100;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 flex flex-col items-center text-center min-h-[calc(100vh-8rem)] justify-start">
        <motion.h1 
          className="text-5xl font-extrabold mb-10 text-emerald-500"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Your Eco Impact
        </motion.h1>
      
      <div className="flex justify-center items-center w-full mt-8">
        {loading ? (
          <p className="text-3xl font-bold text-neutral-400 animate-pulse">Loading Impact...</p>
        ) : error ? (
          <p className="text-red-500 bg-red-900/20 p-4 rounded-lg">{error}</p>
        ) : (
          <motion.div 
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="text-emerald-400 mb-3">{currentUserLevel.icon}</div>
              <h2 className="text-2xl font-semibold text-emerald-400">{currentUserLevel.title}</h2>
              <p className="text-6xl font-bold text-white tracking-tight my-4">{score}</p>
              <p className="text-neutral-500 text-sm mb-6">Total Eco Score</p>
              
              <div className="w-full bg-neutral-700 rounded-full h-2.5 mb-2">
                <motion.div
                  className="bg-gradient-to-r from-emerald-500 to-lime-500 h-2.5 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                />
              </div>

              {nextLevel ? (
                <p className="text-xs text-neutral-400">
                  {nextLevel.minScore - score} points to reach <span className="font-bold text-emerald-500">{nextLevel.title}</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-lime-400">You've reached the highest level!</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      <motion.div 
        className="mt-12 text-center text-sm text-neutral-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p>This score represents the positive environmental impact you've made. Keep it up!</p>
      </motion.div>
    </div>
  );
} 