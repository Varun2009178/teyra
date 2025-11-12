"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Brain, Target, Grid3X3, Code, Layers, Command, Heart, TrendingUp, Shield, Users, MessageCircle, Coffee, Clock, CheckCircle2, Star, Rocket, Smile, ChevronRight, Play, Pause, Volume2 } from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Redirect authenticated users to dashboard when opening PWA
  useEffect(() => {
    if (isLoaded && user) {
      // Check if this is a PWA launch (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');
      
      // Only redirect if launched as PWA, not if user navigated here manually
      if (isStandalone) {
        router.replace('/dashboard');
      }
    }
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen dark-gradient-bg noise-texture text-white overflow-x-hidden relative">
      
      {/* Enhanced Unique Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[9999] glass-dark-modern border-b border-precise backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group relative px-1 py-1 rounded hover:bg-white/5 transition-colors">
                <Image
                  src="/teyra-logo-64kb.png"
                  alt="Teyra"
                  width={36}
                  height={36}
                  className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10"
                />
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                className="p-3 w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 flex items-center justify-center"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  outline: 'none',
                  boxShadow: 'none'
                }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              <a href="/contact" className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white cursor-pointer"
                style={{ outline: 'none', boxShadow: 'none' }}>
                contact
              </a>
              <a href="/sustainability" className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white cursor-pointer"
                style={{ outline: 'none', boxShadow: 'none' }}>
                sustainability
              </a>

              {isLoaded && user ? (
                <>
                  <Link href="/dashboard">
                    <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      dashboard
                    </button>
                  </Link>
                  <div className="w-px h-6 bg-white/20 mx-2"></div>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 border-2 border-white/20 hover:border-white/40 transition-colors"
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <Link href="/sign-in">
                    <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      sign in
                    </button>
                  </Link>
                  <div className="w-px h-6 bg-white/20 mx-2"></div>
                  <Link href="/sign-up">
                    <button className="px-6 py-2.5 text-sm font-semibold bg-white hover:bg-white/90 text-black rounded-lg transition-all duration-200"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      get started
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden border-t border-white/10 bg-black/20 backdrop-blur-xl"
              >
                <div className="px-4 py-6 space-y-4">
                  {isLoaded && user ? (
                    <>
                      <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                        <div className="mobile-menu-item px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          contact
                        </div>
                      </Link>
                      <Link href="/sustainability" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                        <div className="mobile-menu-item px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          sustainability
                        </div>
                      </Link>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                        <div className="mobile-menu-item px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          dashboard
                        </div>
                      </Link>
                      <div className="pt-4 border-t border-white/10">
                        <UserButton
                          appearance={{
                            elements: {
                              avatarBox: "w-12 h-12 border-2 border-white/20"
                            }
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                        <div className="mobile-menu-item px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          contact
                        </div>
                      </Link>
                      <Link href="/sustainability" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                        <div className="mobile-menu-item px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          sustainability
                        </div>
                      </Link>
                      <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                        <div className="mobile-menu-item px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          sign in
                        </div>
                      </Link>
                      <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                        <div className="mobile-menu-item text-center px-4 py-3 bg-white text-black hover:bg-white/90 rounded-lg transition-colors font-semibold">
                          get started
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section - Clean & Informative */}
      <section className={`relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 ${user ? 'pt-24 lg:pt-28' : 'pt-12 lg:pt-16'} pb-12`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">

            {/* Left Side - Content */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6 sm:space-y-8"
            >

              {/* Status Indicator */}
              <div className="flex items-center justify-center lg:justify-start gap-3 text-sm text-white/60">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span>chrome extension is not available yet sadly</span>
              </div>

              {/* Main Hero Text - Bold & Impactful */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={user ? "space-y-6 sm:space-y-8" : "space-y-4 sm:space-y-6"}
              >
                <h1 className={`font-bold leading-[1.1] tracking-tight ${user ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'}`}>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`block text-white ${user ? 'mb-4 sm:mb-6' : 'mb-3 sm:mb-4'}`}
                  >
                    we killed
                  </motion.span>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex flex-wrap items-center justify-center lg:justify-start ${user ? 'gap-4 sm:gap-5 md:gap-6' : 'gap-3 sm:gap-4'}`}
                  >
                    {/* Competitor logos with actual brand styling */}
                    {[
                      { name: 'Todoist', displayName: 'Todoist', logo: '/todoist-logo.svg', bgColor: '#E44332', textColor: '#FFFFFF', borderColor: '#E44332' },
                      { name: 'Notion', displayName: 'Notion', logo: '/notion-logo.svg', bgColor: '#000000', textColor: '#FFFFFF', borderColor: '#000000' },
                      { name: 'ClickUp', displayName: 'ClickUp', logo: '/clickup-logo.svg', bgColor: '#7B68EE', textColor: '#FFFFFF', borderColor: '#7B68EE' }
                    ].map((competitor, index) => (
                      <motion.div
                        key={competitor.name}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ 
                          duration: 0.6, 
                          delay: 1.2 + index * 0.15, 
                          ease: [0.16, 1, 0.3, 1],
                          type: "spring",
                          stiffness: 100,
                          damping: 15
                        }}
                        whileHover={{ scale: 1.08, y: -4 }}
                        className="group relative"
                      >
                        <div
                          className={`relative rounded-2xl shadow-2xl border-2 transition-all duration-300 group-hover:shadow-3xl group-hover:border-opacity-80 ${user ? 'px-6 sm:px-8 py-4 sm:py-5' : 'px-4 sm:px-6 py-3 sm:py-4'}`}
                          style={{
                            backgroundColor: competitor.bgColor,
                            borderColor: competitor.borderColor
                          }}
                        >
                          <div className={`flex items-center ${user ? 'gap-4 sm:gap-5 md:gap-6' : 'gap-3 sm:gap-4'}`}>
                            <div className={`${user ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-6 h-6 sm:w-7 sm:h-7'} flex items-center justify-center flex-shrink-0 relative`}>
                              <Image
                                src={competitor.logo}
                                alt={competitor.name}
                                width={32}
                                height={32}
                                className="w-full h-full object-contain"
                                style={{ 
                                  filter: competitor.name === 'Notion' 
                                    ? 'brightness(0) invert(1)' 
                                    : competitor.bgColor === '#FFFFFF' 
                                    ? 'none' 
                                    : 'brightness(0) invert(1)' 
                                }}
                              />
                            </div>
                            <span
                              className={`font-bold whitespace-nowrap transition-all group-hover:scale-105 ${user ? 'text-lg sm:text-xl md:text-2xl' : 'text-base sm:text-lg md:text-xl'}`}
                              style={{ color: competitor.textColor }}
                            >
                              {competitor.displayName}
                            </span>
                          </div>
                          {/* Hover glow effect */}
                          <motion.div
                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                            style={{
                              background: `radial-gradient(circle at center, ${competitor.bgColor}, transparent)`,
                              filter: 'blur(20px)'
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                    <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.7, ease: [0.16, 1, 0.3, 1] }}
                    className={`block ${user ? 'mt-6 sm:mt-8' : 'mt-4 sm:mt-6'}`}
                  >
                    <span className={`text-white ${user ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'}`}>and made it </span>
                    <span className="relative inline-block group">
                      <span className={`bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 bg-clip-text text-transparent font-extrabold ${user ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'}`}>
                        free
                      </span>
                      <motion.span
                        className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-orange-400/30 to-pink-500/30 blur-2xl -z-10"
                        animate={{ 
                          opacity: [0.4, 0.7, 0.4],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <motion.span 
                        className="absolute top-0 sm:top-0.5 md:top-1 right-0 sm:-right-1 md:-right-2 text-white/60 text-base sm:text-lg md:text-xl lg:text-2xl cursor-help leading-none"
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        *
                      </motion.span>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-xl z-50 transform group-hover:translate-y-0 translate-y-2 tracking-wider">
                        paid plan available
                        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white"></span>
                      </span>
                    </span>
                  </motion.span>
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.9, ease: [0.16, 1, 0.3, 1] }}
                className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed mb-2 sm:mb-4"
              >
                {user ? (
                  "welcome back! ready to continue?"
                ) : (
                  <>
                    <button
                      onClick={() => {
                        document.getElementById('how-teyra-works')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-white/90 hover:text-cyan-400 transition-colors cursor-pointer font-semibold"
                    >
                      teyra
                    </button>
                    <span className="text-white/70"> is the AI task system that actually makes you do the </span>
                    <span className="text-white/70">work</span>
                    <br className="block sm:hidden" />
                    <br className="hidden sm:block" />
                    <span className="text-white/60 block mt-2 sm:mt-0">no guilt trips. no being overwhelmed. just pure focus.</span>
                  </>
                )}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 2.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row gap-4 pt-0 justify-center lg:justify-start"
              >
                {isLoaded && user ? (
                  <Link href="/dashboard">
                    <button
                      className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium bg-white hover:bg-white/90 text-black rounded-lg transition-all duration-200 w-full sm:w-auto"
                      style={{ outline: 'none', boxShadow: 'none' }}
                    >
                      open dashboard
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => window.open('https://tally.so/r/nr7G7l', '_blank')}
                      className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white rounded-lg transition-all duration-200 w-full sm:w-auto"
                      style={{ outline: 'none', boxShadow: 'none' }}
                    >
                        <Sparkles className="w-4 h-4" />
                      waitlist for the chrome extension
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <Link href="/sign-up">
                      <button
                        className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 hover:from-purple-700 hover:via-pink-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 w-full sm:w-auto"
                        style={{ outline: 'none', boxShadow: 'none' }}
                      >
                        web version <span className="text-white/90 text-xs ml-1">(more features)</span>
                      </button>
                    </Link>
                  </>
                )}
              </motion.div>

              {/* Status Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-sm pt-4"
              >
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span className="text-blue-300 font-medium">ai powered</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <span className="text-purple-300 font-medium">emotionally intelligent</span>
                </div>
              </motion.div>

            </motion.div>
            </div>

            {/* Right Side - AI Feature Demo */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 pt-8 lg:pt-12"
            >
              <div className="relative max-w-lg mx-auto lg:max-w-none space-y-6">
              {/* Email Preview */}
              <div className="glass-dark-modern rounded-2xl p-6 sm:p-7 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
                      <span className="text-base">📧</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/90">Your Boss</div>
                      <div className="text-xs text-white/40">boss@company.com</div>
                    </div>
                  </div>
                  <div className="text-xs text-white/40">2m ago</div>
                </div>

                <div className="text-sm font-medium text-white/80 mb-3">Q4 Project Tasks</div>

                {/* Highlighted Email Text */}
                  <div className="relative bg-yellow-400/20 border border-yellow-400/40 rounded-lg p-3">
                    <p className="text-sm text-white/70 leading-relaxed">
                    "Hey! Can you finish the presentation slides, send the client proposal, and schedule the team meeting for next week?"
                  </p>
                  </div>
              </div>

                {/* Arrow */}
                <div className="flex justify-center">
                <div className="text-4xl text-green-400">↓</div>
                </div>

              {/* Generated Tasks */}
                <div className="glass-dark-modern rounded-2xl p-6 sm:p-7 space-y-3">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold text-white/90">
                    Auto-generated tasks
                    </div>
                    <div className="text-xs text-green-400 flex items-center gap-1.5 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/30">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    <span className="font-semibold">Synced to Google Calendar</span>
                    </div>
                </div>

                  {/* Task 1 */}
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-3.5 bg-white/5 rounded-lg border border-blue-400/30 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-transparent"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-400 rounded flex-shrink-0 mt-0.5"></div>
                  <div className="flex-1 relative z-10 min-w-0">
                      <div className="text-xs sm:text-sm text-white/90 font-medium">
                      Send client proposal
                  </div>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5 text-[10px] sm:text-xs">
                        <span className="text-blue-400 font-medium">📅 Tomorrow, 10:00 AM</span>
                        <span className="text-white/40">• Medium priority</span>
                      </div>
                    </div>
                  </div>

                  {/* Task 2 */}
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-3.5 bg-white/5 rounded-lg border border-green-400/30 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-transparent"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-green-400 rounded flex-shrink-0 mt-0.5"></div>
                  <div className="flex-1 relative z-10 min-w-0">
                      <div className="text-xs sm:text-sm text-white/90 font-medium">
                      Finish presentation slides
                      </div>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5 text-[10px] sm:text-xs">
                        <span className="text-green-400 font-medium">📅 Today, 2:00 PM</span>
                        <span className="font-medium text-orange-400">• High priority</span>
                    </div>
                    </div>
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400" />
                  </div>

                  {/* Task 3 */}
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-3.5 bg-white/5 rounded-lg border border-white/20 relative">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/40 rounded flex-shrink-0 mt-0.5"></div>
                  <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm text-white/90 font-medium">
                      Schedule team meeting
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5 text-[10px] sm:text-xs">
                        <span className="text-white/60 font-medium">📅 Next Monday, 3:00 PM</span>
                        <span className="text-white/40">• Low priority</span>
                      </div>
                      <div className="mt-1.5 sm:mt-2">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-white/50">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        <span className="font-medium">Google Calendar</span>
                      </div>
                  </div>
                    </div>
                  </div>

                  {/* Success indicator */}
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-xs text-green-400 font-medium">
                    3 tasks generated & synced
                    </span>
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
            </div>
          </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How Teyra Works Section */}
      <section id="how-teyra-works" className="py-12 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              how teyra <span className="text-white">works</span>
            </h2>
            <p className="hero-subtitle max-w-2xl mx-auto">
              unlike traditional todo apps, teyra adapts to your unique productivity patterns and emotional needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Brain,
                title: "learns your patterns",
                description: "AI analyzes when you're most productive and suggests optimal task timing"
              },
              {
                icon: Heart,
                title: "understands emotions",
                description: "recognizes your mood and adjusts recommendations to support your mental state"
              },
              {
                icon: Target,
                title: "smart prioritization",
                description: "automatically identifies what truly matters and helps you focus on high-impact tasks"
              },
              {
                icon: Shield,
                title: "prevents burnout",
                description: "built-in safeguards protect your energy and encourage sustainable productivity habits"
              }
            ].map((problem, index) => (
              <div
                key={problem.title}
                className="glass-dark-modern rounded-xl p-6 text-center group cursor-pointer hover:-translate-y-1 transition-transform"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-colors">
                  <problem.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {problem.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pomodoro Timer Demo Section */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">

            {/* Left Side - Content */}
            <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-400/10 border border-green-400/30">
                <span className="text-sm font-semibold text-green-400">⏱️ Pomodoro Timer</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
                stay focused,
                <br />
                <span className="text-green-400">earn rewards</span>
              </h2>

              <p className="text-lg text-white/70 leading-relaxed">
                built-in pomodoro timer keeps you focused for 25-minute sessions.
                <br className="hidden sm:block" />
                complete distraction-free sessions to earn XP and level up mike.
              </p>

              <div className="space-y-3 max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">✓</span>
                  </div>
                  <span className="text-white/80 text-left">25-minute focused work sessions</span>
                </div>
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">✓</span>
                  </div>
                  <span className="text-white/80 text-left">Earn +30 XP per distraction-free session</span>
                </div>
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">✓</span>
                  </div>
                  <span className="text-white/80 text-left">Level up Mike as you stay productive</span>
                </div>
              </div>
            </div>

            {/* Right Side - Chrome Extension Mockup */}
            <div className="relative">
              {/* Chrome Extension Window */}
              <div className="glass-dark-modern rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-2xl max-w-md mx-auto">
                {/* Extension Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center">
                      <span className="text-base">⏱️</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Pomodoro Timer</div>
                      <div className="text-xs text-green-400">Focus Mode Active</div>
                    </div>
                  </div>
                  <div className="text-xs bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/30 text-green-400 font-semibold">
                    🔒 Focused
                  </div>
                </div>

                {/* Timer Display */}
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="text-6xl font-bold text-white mb-3">
                    24:37
                  </div>
                  <div className="text-sm text-white/60 mb-6">Time remaining</div>

                  {/* Progress Ring */}
                  <div className="relative w-40 h-40 mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#4ade80"
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="343 440"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                      🌵
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-white/70 mb-2">Stay focused to earn</div>
                    <div className="text-2xl font-bold text-green-400">+30 XP</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Focus Mode Demo Section */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">

            {/* Left Side - Chrome Extension Mockup */}
            <div className="relative order-2 lg:order-1">
              {/* Browser Window with Blocked Site */}
              <div className="glass-dark-modern rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                  </div>
                  <div className="ml-4 flex-1 bg-white/5 rounded-lg px-3 py-1.5 text-xs text-white/40">
                    <span>youtube.com</span>
                  </div>
                </div>

                {/* Blocked Page Content */}
                <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent relative">
                  <div className="text-7xl sm:text-8xl mb-6 relative z-10">
                    🚫
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 relative z-10">
                    Site Blocked
                  </h3>

                  <p className="text-white/70 text-center mb-8 max-w-sm relative z-10 text-sm sm:text-base">
                    Focus mode is active. This site is blocked to help you stay productive.
                  </p>

                  <div className="space-y-2 w-full max-w-sm relative z-10">
                    {[
                      { icon: '📱', site: 'instagram.com' },
                      { icon: '💬', site: 'twitter.com' },
                      { icon: '🎮', site: 'reddit.com' }
                    ].map((item, index) => (
                      <div
                        key={item.site}
                        className="flex items-center justify-between p-3 bg-red-400/10 rounded-lg border border-red-400/30 backdrop-blur-sm hover:bg-red-400/15 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs">
                            {item.icon}
                          </div>
                          <span className="text-sm text-white/90 font-medium">{item.site}</span>
                        </div>
                        <div className="text-xs text-red-400 font-semibold">
                          BLOCKED
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pro badge indicator */}
                  <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full relative z-10">
                    <span className="text-xs font-semibold text-purple-300">✨ Customize blocklist with Pro</span>
                </div>
              </div>
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="space-y-4 sm:space-y-6 order-1 lg:order-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-400/10 border border-red-400/30">
                <span className="text-base">🚫</span>
                <span className="text-sm font-semibold text-red-400">Focus Mode</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
                block distractions,
                <br />
                <span className="bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                  boost productivity
                </span>
              </h2>

              <p className="text-base sm:text-lg text-white/70 leading-relaxed">
                one click to block social media and distracting websites.
                <br className="hidden sm:block" />
                stay in the zone with our Chrome extension and earn XP for every focused session.
              </p>

              <div className="space-y-3 max-w-md mx-auto lg:mx-0 pt-4">
                {[
                  { icon: '⚡', text: 'Instantly block distracting websites' },
                  { icon: '🎯', text: 'Customizable blocklist (Pro feature)' },
                  { icon: '⏱️', text: 'Works seamlessly with Pomodoro timer' },
                  { icon: '🏆', text: 'Earn +10 XP for every focused hour' }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 justify-center lg:justify-start hover:translate-x-1 transition-transform"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-400/20 flex items-center justify-center flex-shrink-0 border border-red-400/30">
                      <span className="text-sm">{item.icon}</span>
                    </div>
                    <span className="text-white/80 text-left text-sm sm:text-base">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA to extension */}
              <div className="pt-4">
                <button
                  onClick={() => document.getElementById('chrome-extension')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-red-400/10 hover:bg-red-400/20 border border-red-400/30 hover:border-red-400/50 rounded-lg text-red-300 font-medium transition-all duration-300 text-sm sm:text-base"
                >
                  Get Chrome Extension →
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Meet Mike Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              meet <span className="text-white">mike</span>
            </h2>
            <p className="hero-subtitle max-w-2xl mx-auto">your emotional support cactus</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                gif: "/Happy.gif",
                title: "celebrates your wins",
                description: "\"you completed 3 tasks! you're amazing!\""
              },
              {
                gif: "/Neutral Calm.gif",
                title: "always patient",
                description: "\"take your time. i'm here when you're ready.\""
              },
              {
                gif: "/Sad With Tears 2.gif",
                title: "supports tough days",
                description: "\"rough day? tomorrow's a fresh start 💜\""
              }
            ].map((mike, index) => (
              <div
                key={mike.title}
                className="glass-dark-modern rounded-xl p-6 text-center group cursor-pointer hover:-translate-y-1 hover:scale-105 transition-all"
              >
                <div className="mb-4">
                  <Image 
                    src={mike.gif} 
                    alt={mike.title} 
                    width={80} 
                    height={80} 
                    className="mx-auto w-16 h-16 md:w-20 md:h-20" 
                  />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {mike.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {mike.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              features that <span className="text-white">actually help</span>
            </h2>
            <p className="hero-subtitle max-w-2xl mx-auto">
              every feature designed around human psychology and real productivity needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "intelligent task breakdown",
                description: "automatically breaks complex projects into manageable, actionable steps"
              },
              {
                icon: Clock,
                title: "adaptive scheduling",
                description: "learns your energy patterns and suggests when to tackle different types of tasks"
              },
              {
                icon: Heart,
                title: "mood-aware suggestions",
                description: "adjusts your task list based on your current emotional state and capacity"
              },
              {
                icon: Target,
                title: "impact-based prioritization",
                description: "highlights tasks that will move you closer to your most important goals"
              },
              {
                icon: Sparkles,
                title: "progress celebration",
                description: "recognizes and celebrates every win, building momentum and motivation"
              },
              {
                icon: Shield,
                title: "burnout protection",
                description: "monitors your workload and suggests breaks before you reach exhaustion"
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="glass-dark-modern rounded-xl p-6 text-center group cursor-pointer hover:-translate-y-1 transition-transform"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chrome Extension - Download CTA */}
      <section id="chrome-extension" className="py-24 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            {/* Chrome icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-4xl">🌐</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 text-white">
              get the chrome extension
            </h2>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-full text-green-300 text-sm font-medium mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              now available
            </div>

            <p className="hero-subtitle mb-8 max-w-2xl mx-auto">
              bring mike, focus mode, and pomodoro timer directly to your browser. boost productivity wherever you work.
            </p>

            {/* Big download button */}
            <div className="mb-12">
              <button
                onClick={() => window.open('https://tally.so/r/nr7G7l', '_blank')}
                className="px-10 py-5 text-lg font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-2xl transition-all duration-300 inline-flex items-center gap-3"
              >
                  <Rocket className="w-6 h-6" />
                waitlist for the chrome extension
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-white/40 text-xs mt-4">
                Works with Chrome, Edge, Brave & other Chromium browsers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-dark-modern rounded-xl p-6 relative group cursor-pointer hover:-translate-y-1 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-green-400 text-xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">productivity mode</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  detects when you're procrastinating on youtube or tiktok and gently nudges you back to your tasks
                </p>
              </div>
            </div>

            <div className="glass-dark-modern rounded-xl p-6 relative group cursor-pointer hover:-translate-y-1 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-400 text-xl">💡</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">smart recommendations</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  suggests relevant tasks based on what website you're on and your current workflow
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => window.open('https://tally.so/r/nr7G7l', '_blank')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-lg text-purple-300 font-medium hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300 cursor-pointer"
            >
              get notified when it's ready
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              get started
            </h2>
            <p className="hero-subtitle mb-8 max-w-2xl mx-auto">
              join hundreds who've discovered a kinder, smarter way to be productive.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href={isLoaded && user ? '/dashboard' : '/sign-up'}>
                <button
                  className="flex items-center gap-2 px-12 py-6 text-lg font-medium bg-white hover:bg-white/90 text-black rounded-lg transition-all duration-200 w-full sm:w-auto"
                  style={{ outline: 'none', boxShadow: 'none' }}
                >
                  {isLoaded && user ? 'open dashboard' : 'get started'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              {!user && (
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>free forever plan available</span>
                </div>
              )}
            </div>
            <p className="text-xs text-white/40 mt-6">
              {isLoaded && user ? 'continue your productivity journey with mike' : 'no credit card required'}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-white/40 text-sm">
        <div className="font-geist-mono space-y-3">
          <div className="flex items-center justify-center gap-4">
            <a href="/privacy" className="hover:text-white/70 transition-colors">
              privacy policy
            </a>
            <span>·</span>
            <a href="/terms" className="hover:text-white/70 transition-colors">
              terms of service
            </a>
          </div>
          <div>
            &copy; {new Date().getFullYear()} teyra. crafted with care for human productivity.
          </div>
        </div>
      </footer>
    </div>
  );
}