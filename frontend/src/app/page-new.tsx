'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Chrome, Zap, Target, Timer, TrendingUp, CheckCircle2, Download, Sparkles, ArrowRight } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useState } from 'react';

export default function HomePage() {
  const { isSignedIn, user } = useUser();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const extensionFeatures = [
    {
      icon: Timer,
      title: "Focus Mode + Pomodoro",
      description: "25-minute focused sessions with automatic distraction blocking. Earn XP for staying focused.",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      icon: Zap,
      title: "Quick Task Capture",
      description: "Add tasks from any webpage with Ctrl+Shift+A. Highlight text and break it down with AI.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Target,
      title: "Smart AI Breakdown",
      description: "Overwhelmed? AI breaks complex tasks into simple, actionable steps instantly.",
      gradient: "from-pink-500 to-orange-500"
    },
    {
      icon: TrendingUp,
      title: "Level Up with Mike",
      description: "+10 XP per task, +30 XP per distraction-free session. Watch Mike grow as you focus!",
      gradient: "from-orange-500 to-yellow-500"
    },
    {
      icon: CheckCircle2,
      title: "Google Calendar Sync",
      description: "Tasks with deadlines auto-sync to your calendar. Never miss a deadline again.",
      gradient: "from-green-500 to-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Chrome className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Teyra
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <>
              <Link href="/dashboard">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  Dashboard
                </button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  Sign in
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section - Chrome Extension Focused */}
      <section className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full mb-8 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Chrome Extension Now Available
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Focus Anywhere.
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Accomplish Everything.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Your AI-powered productivity companion. Capture tasks, stay focused with Pomodoro,
              and level up with <span className="font-semibold text-gray-900">Mike the Cactus 🌵</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
              >
                <Chrome className="w-5 h-5" />
                <span>Add to Chrome - It's Free</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </a>

              <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-semibold rounded-xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                  <span>Try Web Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Works Offline</span>
              </div>
            </div>
          </motion.div>

          {/* Extension Screenshot/Demo */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 p-8">
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Chrome className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">Extension Demo Video / Screenshot</p>
                  <p className="text-gray-400 text-sm mt-2">Replace with actual demo</p>
                </div>
              </div>
            </div>

            {/* Floating feature badges */}
            <motion.div
              className="absolute -top-4 -left-4 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-100"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Pomodoro Timer</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -right-4 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-100"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">AI Task Breakdown</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Extension Features Grid */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Everything You Need to Stay Focused
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Capture tasks, block distractions, and level up—all from your browser
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {extensionFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
                className="group relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {hoveredFeature === index && (
                  <motion.div
                    layoutId="featureHighlight"
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-2xl`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 container mx-auto px-6 py-20 bg-gradient-to-br from-gray-50 to-white rounded-3xl my-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Get Started in 30 Seconds
            </h2>
          </motion.div>

          <div className="space-y-8">
            {[
              { step: 1, title: "Install Extension", description: "Add Teyra to Chrome - no account needed to start" },
              { step: 2, title: "Sign In", description: "Create your account to sync across devices" },
              { step: 3, title: "Start Focusing", description: "Press Ctrl+Shift+A anywhere to add tasks, or enable Focus Mode to block distractions" }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex items-start gap-6"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-lg">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to 10x Your Focus?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who've transformed their productivity with Teyra
          </p>
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <Chrome className="w-6 h-6" />
            <span>Install Chrome Extension</span>
            <Download className="w-5 h-5" />
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 text-sm">
            © 2024 Teyra. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Contact
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
