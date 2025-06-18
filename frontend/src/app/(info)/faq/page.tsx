'use client';

import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const faqData = [
  {
    question: "What is Teyra?",
    answer: "Teyra is a mobile-friendly web app that combines personal motivation with sustainable living. We help you build consistency through daily tasks that make a positive impact on both yourself and the world."
  },
  {
    question: "How does Teyra personalize tasks?",
    answer: "When you sign up, Teyra learns about your interests, lifestyle, and goals. Based on your input, it suggests daily tasks that are both personally meaningful and environmentally impactful. The more you use the app, the better it gets at tailoring suggestions to your needs."
  },
  {
    question: "What kind of rewards can I earn?",
    answer: "You can earn experience points (XP) for completing tasks, build up streaks for consistency, and unlock badges for achieving milestones. We're also working on community features where you can share your progress and inspire others!"
  },
  {
    question: "Is Teyra free to use?",
    answer: "Yes, Teyra is currently free to use. We are focused on building a supportive community and helping as many people as possible start their journey to better habits and a better world."
  },
  {
    question: "How can I suggest a new feature or give feedback?",
    answer: "We'd love to hear from you! Please send any suggestions or feedback to greenteyra@gmail.com. Your input is invaluable in helping us improve."
  }
];

export default function FAQPage() {
  return (
    // Remove min-h-screen, bg-black, text-white from here as layout handles it.
    // Adjust pt-20 from original to something like py-12 or py-16 to account for navbar.
    <div className="flex flex-col items-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <div className="flex items-center justify-center mb-10 md:mb-12">
          <HelpCircle className="h-10 w-10 md:h-12 md:w-12 text-lime-400 mr-3 md:mr-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-lime-400 tracking-tight">
            Frequently Asked Questions
          </h1>
        </div>
        
        <div className="space-y-8">
          {faqData.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
              className="bg-[#111111] border border-neutral-800 rounded-lg p-6 shadow-lg"
            >
              <h2 className="text-xl font-semibold text-neutral-100 mb-3">{item.question}</h2>
              <p className="text-neutral-300 leading-relaxed">{item.answer}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + faqData.length * 0.1, duration: 0.5 }}
        >
          <Link href="/" className="inline-flex items-center px-6 py-2 border border-lime-600 text-lime-400 hover:bg-lime-700 hover:text-white font-semibold rounded-full transition-colors duration-150 shadow-md">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
} 