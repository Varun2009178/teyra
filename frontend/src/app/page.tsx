'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { TextAnimate } from '@/components/magicui/text-animate';
import { Cactus } from '@/components/Cactus';

export default function HomePage() {
  const { user, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-3"
          >
            <Image
              src="/teyra-logo-64kb.png"
              alt="Teyra Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold text-black">
              Teyra
            </span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex space-x-4"
          >
            {!isLoaded ? (
              // Show loading state to prevent hydration mismatch
              <>
                <Button variant="ghost" disabled>
                  Loading...
                </Button>
                <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" disabled>
                  Loading...
                </Button>
              </>
            ) : user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <SignOutButton>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    Sign Out
                  </Button>
                </SignOutButton>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/features">Features</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex items-center justify-center min-h-screen px-6 pt-12">
        <div className="text-center max-w-4xl">
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-7xl font-bold text-black mb-6"
          >
            Productivity is{' '}
            <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              Broken
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-2xl md:text-3xl text-gray-600 mb-12 max-w-3xl mx-auto font-medium"
          >
            so we made a todolist that understands you
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <Button 
              size="lg" 
              asChild
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-lg px-8 py-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <Link href="/sign-up">
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => {
                document.getElementById('demo-section')?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }}
              className="border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white text-lg px-8 py-6 hover:scale-105 transition-all duration-300"
            >
                Try Demo
            </Button>
          </motion.div>

          {/* Twitter Backing Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative mb-16"
          >
            <div className="flex justify-center">
              <motion.div
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-flex items-center space-x-3 bg-white border-2 border-gray-200 rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  Backed by a random guy on X
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  who said my idea is cool
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

            {/* Story Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-5xl md:text-6xl font-bold text-black mb-8 tracking-tight"
            >
              Your journey starts here
            </motion.h2>
          </motion.div>

          <div className="space-y-32">
            {/* Morning Scene */}
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              />
              
              <div className="text-center max-w-5xl relative z-10">
          <motion.div
                  className="mb-16"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
                  <Cactus mood="sad" />
                </motion.div>
                
                <div className="text-6xl md:text-8xl font-bold text-black mb-8 tracking-tight">
                  <TextAnimate 
                    animation="slideLeft" 
                    by="character"
                  >
                    Morning blues?
                  </TextAnimate>
                </div>

                <motion.p 
                  className="text-2xl md:text-3xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  Your cactus feels it too. But together, you'll turn this day around.
                </motion.p>

                <motion.div
                  className="bg-white rounded-2xl p-6 shadow-xl max-w-md mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <p className="text-lg text-gray-700 italic">
                    "Hey, I know mornings are tough. Let's start with just one small thing today."
                  </p>
                </motion.div>
                  </div>
                </div>

            {/* Progress Scene */}
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              />
              
              <div className="text-center max-w-5xl relative z-10">
                <motion.div 
                  className="mb-16"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Cactus mood="neutral" />
                </motion.div>
                
                <div className="text-6xl md:text-8xl font-bold text-black mb-8 tracking-tight">
                  <TextAnimate 
                    animation="slideLeft" 
                    by="character"
                  >
                    Finding your rhythm
                  </TextAnimate>
                </div>
                
                <motion.p 
                  className="text-2xl md:text-3xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  As you check off tasks, your companion grows stronger. Every step matters.
                </motion.p>

                <motion.div
                  className="bg-white rounded-2xl p-6 shadow-xl max-w-md mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <p className="text-lg text-gray-700 italic">
                    "Look at you go! Three tasks done already. You're building momentum!"
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Success Scene */}
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-pink-50 via-red-50 to-orange-50"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              />
              
              <div className="text-center max-w-5xl relative z-10">
                <motion.div 
                  className="mb-16"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Cactus mood="happy" />
                </motion.div>
                
                <div className="text-6xl md:text-8xl font-bold text-black mb-8 tracking-tight">
                  <TextAnimate 
                    animation="slideLeft" 
                    by="character"
                  >
                    You did it!
                  </TextAnimate>
                </div>
                
                <motion.p 
                  className="text-2xl md:text-3xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  Tomorrow is a fresh start. Your cactus will be here, ready to grow with you again.
                </motion.p>

            <motion.div
                  className="bg-white rounded-2xl p-6 shadow-xl max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
            >
                  <p className="text-lg text-gray-700 italic">
                    "We crushed it today! Can't wait to see what tomorrow brings. 🌟"
                  </p>
            </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo-section" className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-5xl md:text-6xl font-bold text-black mb-8 tracking-tight"
            >
              See it in action
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto"
            >
              Watch tasks appear as your cactus companion provides motivating advice
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Your Tasks</h3>
                <div className="text-sm text-gray-500">
                  <span className="text-red-600 font-medium">3</span>/5 completed
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full relative"
                    initial={{ width: 0 }}
                    whileInView={{ width: "60%" }}
                    transition={{ duration: 2, delay: 1.5, ease: "easeOut" }}
                    viewport={{ once: true }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white opacity-30"
                      initial={{ x: "-100%" }}
                      whileInView={{ x: "100%" }}
                      transition={{ duration: 1, delay: 2, ease: "easeInOut" }}
                      viewport={{ once: true }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {[
                  { text: "Complete morning routine", completed: true, delay: 0.5, checkDelay: 1.5 },
                  { text: "Review project goals", completed: true, delay: 0.7, checkDelay: 2.0 },
                  { text: "Schedule team meeting", completed: true, delay: 0.9, checkDelay: 2.5 },
                  { text: "Update documentation", completed: false, delay: 1.1, checkDelay: 3.0 },
                  { text: "Plan tomorrow's tasks", completed: false, delay: 1.3, checkDelay: 3.5 }
                ].map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: task.delay }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-6 h-6">
                      {task.completed ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.5, delay: task.checkDelay }}
                          viewport={{ once: true }}
                          className="w-6 h-6 text-green-500 flex items-center justify-center text-lg font-bold"
                        >
                          ✓
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 1 }}
                          whileInView={{ scale: 0.8, opacity: 0.5 }}
                          transition={{ duration: 0.3, delay: task.checkDelay }}
                          viewport={{ once: true }}
                          className="w-6 h-6 border-2 border-gray-300 rounded-full"
                        />
                      )}
                    </div>
                    <motion.span 
                      className={`flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                      initial={{ opacity: 1 }}
                      whileInView={{ opacity: task.completed ? 0.6 : 1 }}
                      transition={{ duration: 0.3, delay: task.checkDelay }}
                      viewport={{ once: true }}
                    >
                      {task.text}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Cactus Companion Journey */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Cactus Companion</h3>
                
                {/* Helpful Tips */}
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  viewport={{ once: true }}
                  className="text-lg text-gray-600 bg-white rounded-lg p-4 shadow-lg mb-4"
                >
                  "Try breaking down big tasks into smaller ones"
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 2.0 }}
                  viewport={{ once: true }}
                  className="text-lg text-gray-600 bg-white rounded-lg p-4 shadow-lg mb-4"
                >
                  "Take breaks between tasks to stay focused"
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 3.2 }}
                  viewport={{ once: true }}
                  className="text-lg text-gray-600 bg-white rounded-lg p-4 shadow-lg"
                >
                  "Great progress! Keep up the momentum"
                </motion.p>
              </div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                viewport={{ once: true }}
                className="flex justify-center"
              >
                <motion.div
                  key="cactus-morph"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="sad"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Cactus mood="sad" />
                    </motion.div>
                    
                    <motion.div
                      key="neutral"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, delay: 1.5 }}
                    >
                      <Cactus mood="neutral" />
                    </motion.div>
                    
                    <motion.div
                      key="happy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 3.0 }}
                    >
                      <Cactus mood="happy" />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>


        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Ready to Transform Your Productivity?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of users who've found their perfect productivity companion
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              size="lg" 
              asChild
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Link href="/sign-up">
                <span className="flex items-center space-x-2">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Link>
            </Button>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-sm text-gray-500 mt-4"
          >
            Sign up and start today
          </motion.p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        <div className="flex flex-col items-center gap-2">
          <Image src="/teyra-logo-64kb.png" width={32} height={32} alt="Teyra Logo" />
          <span>&copy; {new Date().getFullYear()} Teyra. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
