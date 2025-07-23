'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Home, CheckCircle, User } from 'lucide-react';
import { TextAnimate } from '@/components/magicui/text-animate';
import { Cactus } from '@/components/Cactus';
import AnimatedTodolist from '@/components/AnimatedTodolist';
import { useUser, UserButton } from '@clerk/nextjs';
import { Navbar } from '@/components/Navbar';

export default function HomePage() {
  const { user, isLoaded } = useUser();

  // Show loading state while authentication is being determined
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-gray-900 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white transition-colors duration-150">
      <Navbar />

      {/* Main Hero Section */}
      <main className="flex items-center justify-center min-h-screen px-4 sm:px-6 pt-24">
        <div className="text-center max-w-3xl mx-auto">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 w-full">
              Productivity is{' '}
              <span className="text-red-600 relative inline-block">
                Broken
                <motion.div 
                  className="absolute -bottom-2 left-0 w-full h-1 bg-red-600"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  style={{ transformOrigin: "left" }}
                />
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center w-full"
          >
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl">
              {user ? "Welcome back! Ready to continue your productivity journey?" : "so we made a todolist that actually works"}
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 w-full"
          >
            {isLoaded && user ? (
              <Button 
                size="lg" 
                asChild
                className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-6 transform hover:scale-105 transition-all duration-300 ease-out"
              >
                <Link href="/dashboard" className="flex items-center gap-2">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  asChild
                  className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-6 transform hover:scale-105 transition-all duration-300 ease-out"
                >
                  <Link href="/sign-up" className="flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild
                  className="text-lg px-8 py-6 border-2 border-gray-200 hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 ease-out"
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </>
            )}
          </motion.div>

          {/* Twitter Backing Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex justify-center"
          >
            <motion.div 
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="inline-flex items-center space-x-3 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
            >
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span className="text-sm text-gray-600">
                Backed by a random guy on X
              </span>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Todolist Animation Section */}
      <section id="todolist-section" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
                Here's a normal todolist
              </h2>
              <p className="text-xl text-gray-600 mb-12">
                Watch a satisfying todolist being completed
              </p>
            </motion.div>
          </div>

          <AnimatedTodolist />
        </div>
      </section>

      {/* Teyra Introduction Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-8">
                This is <span className="text-red-600">Mike</span>
              </h2>
              <p className="text-xl text-gray-600">
                Teyra's mascot
              </p>
            </motion.div>
          </div>

          {/* Animated Cactus Journey */}
          <div className="space-y-32">
            {/* Scene 1: Starting Out */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center"
            >
              <div className="mb-12 flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Cactus mood="sad" />
                </motion.div>
              </div>
              <h3 className="text-3xl font-bold text-black mb-6">
                Feeling overwhelmed?
              </h3>
              <motion.div
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 max-w-lg mx-auto"
              >
                <p className="text-lg text-gray-700 italic leading-relaxed">
                  "Hey there! I know mornings can be tough. Let's start with just one tiny thing today. Even the smallest step forward is still progress."
                </p>
              </motion.div>
            </motion.div>

            {/* Scene 2: Building Momentum */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center"
            >
              <div className="mb-12 flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Cactus mood="neutral" />
                </motion.div>
              </div>
              <h3 className="text-3xl font-bold text-black mb-6">
                Finding your flow
              </h3>
              <motion.div
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 max-w-lg mx-auto"
              >
                <p className="text-lg text-gray-700 italic leading-relaxed">
                  "Look at you go! You're building momentum. Every task you complete makes you stronger. Keep that energy flowing!"
                </p>
              </motion.div>
            </motion.div>

            {/* Scene 3: Crushing It */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center"
            >
              <div className="mb-12 flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Cactus mood="happy" />
                </motion.div>
              </div>
              <h3 className="text-3xl font-bold text-black mb-6">
                You're absolutely crushing it!
              </h3>
              <motion.div
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 max-w-lg mx-auto"
              >
                <p className="text-lg text-gray-700 italic leading-relaxed">
                  "Incredible work today! You've shown what you're capable of. Tomorrow is a fresh start, and I'll be here cheering you on every step of the way! 🌟"
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-8">
                Powered by AI that <span className="text-red-600">understands you</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Behind every encouraging word is advanced AI that learns your patterns and adapts to your unique productivity style
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center p-6"
            >
              <motion.div 
                whileHover={{ y: -5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-black mb-4">Smart Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Analyzes your productivity patterns and suggests optimal times for different types of tasks
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center p-6"
            >
              <motion.div 
                whileHover={{ y: -5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-black mb-4">Emotional Intelligence</h3>
              <p className="text-gray-600 leading-relaxed">
                Detects your mood and energy levels to provide perfectly timed motivation and support
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center p-6"
            >
              <motion.div 
                whileHover={{ y: -5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-black mb-4">Adaptive Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                Continuously learns from your successes and adapts strategies to maximize your productivity
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Ready to Transform Your Productivity?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of users who've found their perfect productivity companion
            </p>
            <Button 
              size="lg"
              className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-6 transform hover:scale-105 transition-all duration-300 ease-out"
              asChild
            >
              <Link href={isLoaded && user ? '/dashboard' : '/sign-up'}>
                <span className="flex items-center gap-2">
                  {isLoaded && user ? 'Go to Dashboard' : 'Get Started Free'}
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Link>
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              {isLoaded && user ? 'Continue your productivity journey' : 'Sign up and start today'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-100">
        <div className="flex flex-col items-center gap-2">
          <motion.div whileHover={{ rotate: 10 }}>
            <Image src="/teyra-logo-64kb.png" width={32} height={32} alt="Teyra Logo" />
          </motion.div>
          <span>&copy; {new Date().getFullYear()} Teyra. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}