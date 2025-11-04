'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Brain, Target, Grid3X3, Code, Layers, Command, Heart, TrendingUp, Shield, Users, MessageCircle, Coffee, Clock, CheckCircle2, Star, Rocket, Smile, ChevronRight, Play, Pause, Volume2 } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';



// Simplified floating particles with reduced animations
const FloatingParticles = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const particles = [
    { icon: Sparkles, delay: 0, duration: 12, x: '10%', y: '20%', size: 'w-3 h-3 sm:w-4 sm:h-4' },
    { icon: Star, delay: 4, duration: 16, x: '85%', y: '15%', size: 'w-2 h-2 sm:w-3 sm:h-3' },
    { icon: Zap, delay: 8, duration: 14, x: '15%', y: '80%', size: 'w-3 h-3 sm:w-4 sm:h-4' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className={`absolute text-gray-400/20 ${particle.size}`}
          style={{ left: particle.x, top: particle.y }}
          initial={{ 
            rotate: 0,
            scale: 0,
            opacity: 0
          }}
          animate={{ 
            y: [0, -80, 0],
            rotate: 360,
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <particle.icon className="w-full h-full" />
        </motion.div>
      ))}
    </div>
  );
};

// Simplified gradient background
const GradientBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Primary gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/30 to-gray-100/50" />
      
      {/* Subtle gradient orbs with minimal animation */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-gray-200/20 to-gray-300/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, 30, -15, 0], 
          y: [0, -30, 15, 0],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear", repeatType: "reverse" }}
      />
      <motion.div 
        className="absolute top-3/4 right-1/4 w-56 h-56 sm:w-80 sm:h-80 bg-gradient-to-br from-black/5 to-gray-200/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, -40, 25, 0], 
          y: [0, 25, -20, 0],
        }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear", repeatType: "reverse" }}
      />
      
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }} />
    </div>
  );
};

// Simplified text scramble effect
const ScrambleText = ({ children, className = "" }: { children: string; className?: string }) => {
  const [displayText, setDisplayText] = useState(children);
  const [isScrambling, setIsScrambling] = useState(false);

  const scrambleText = () => {
    if (isScrambling) return;
    setIsScrambling(true);
    
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const originalText = children;
    let iterations = 0;
    
    const interval = setInterval(() => {
      setDisplayText(current => 
        originalText
          .split("")
          .map((char, index) => {
            if (index < iterations) {
              return originalText[index];
            }
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      
      if (iterations >= originalText.length) {
        clearInterval(interval);
        setIsScrambling(false);
      }
      
      iterations += 1/3;
    }, 30);
  };

  return (
    <span 
      className={`${className} cursor-pointer select-none`}
      onMouseEnter={scrambleText}
      onTouchStart={scrambleText}
    >
      {displayText}
    </span>
  );
};

// Enhanced feature card component with subtle green/purple accents
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: {
  icon: any;
  title: string;
  description: string;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ 
        y: -4, 
        scale: 1.01,
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.1)"
      }}
      className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Subtle gradient overlay with green/purple */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-black" />
        </motion.div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-black group-hover:text-gray-700 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

// Interactive stats component with green/purple accents
const StatsSection = () => {
  const stats = [
    { number: "10k+", label: "happy users", icon: Users },
    { number: "24/7", label: "ai support", icon: Zap },
    { number: "99%", label: "satisfaction", icon: Heart },
    { number: "0", label: "guilt trips", icon: Shield },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-r from-gray-50/50 to-white/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="text-center group"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300"
              >
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
              </motion.div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-1 sm:mb-2">
                {stat.number}
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

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
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-28 lg:pt-24">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">

            {/* Left Side - Content */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6 sm:space-y-8"
            >

              {/* Status Indicator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center justify-center lg:justify-start gap-3 text-sm text-white/60"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>chrome extension now available</span>
              </motion.div>

              {/* Main Hero Text - Clean & Animated */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-4 sm:space-y-6"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-tight tracking-tight">
                  turn your study sessions
                  <br />
                  <span className="relative inline-block font-bold text-green-400">
                    productive
                    {/* Animated underline */}
                    <motion.span
                      className="absolute bottom-0 left-0 h-1 bg-green-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
                    />
                  </span>{" "}
                  again
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="text-base sm:text-lg md:text-xl text-white/70 max-w-lg mx-auto lg:mx-0 font-medium"
              >
                {user ? (
                  "welcome back! ready to continue?"
                ) : (
                  "the intuitive interface designed to keep you focused on what matters."
                )}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start"
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
                    <motion.button
                      onClick={() => document.getElementById('chrome-extension')?.scrollIntoView({ behavior: 'smooth' })}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white rounded-lg overflow-hidden w-full sm:w-auto group"
                      style={{ outline: 'none', boxShadow: 'none' }}
                    >
                      {/* Animated gradient background */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600"
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        style={{
                          backgroundSize: '200% 200%',
                        }}
                      />

                      {/* Glitter/sparkle effect overlay */}
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 1px, transparent 1px)',
                          backgroundSize: '50px 50px',
                        }}
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                          backgroundPosition: ['0px 0px', '50px 50px', '0px 0px'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />

                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          repeatDelay: 0.5
                        }}
                      />

                      {/* Button content */}
                      <span className="relative z-10 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        try the chrome extension
                        <span className="text-white/80 text-xs ml-1">(it's free!)</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </motion.button>
                    <Link href="/sign-up">
                      <button
                        className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white w-full sm:w-auto"
                        style={{ outline: 'none', boxShadow: 'none' }}
                      >
                        web version <span className="text-white/40 text-xs ml-1">(less features)</span>
                      </button>
                    </Link>
                  </>
                )}
              </motion.div>

              {/* Status Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-white/50 pt-4 sm:pt-6"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>many users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>ai powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>emotionally intelligent</span>
                </div>
              </motion.div>

            </motion.div>
            </div>

            {/* Right Side - AI Feature Demo */}
            <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="relative max-w-lg mx-auto lg:max-w-none space-y-6"
            >
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="relative"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1.4, duration: 0.8 }}
                    className="absolute inset-0 bg-yellow-400/20 border border-yellow-400/40 rounded-lg"
                  />
                  <p className="text-sm text-white/70 leading-relaxed relative z-10 p-3">
                    "Hey! Can you finish the presentation slides, send the client proposal, and schedule the team meeting for next week?"
                  </p>
                </motion.div>
              </div>

              {/* Arrow Animation */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.4 }}
                className="flex justify-center"
              >
                <div className="text-4xl text-green-400">↓</div>
              </motion.div>

              {/* Generated Tasks */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.6 }}
                className="glass-dark-modern rounded-2xl p-6 sm:p-7 space-y-3"
              >
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.7 }}
                    className="text-sm font-semibold text-white/90"
                  >
                    Auto-generated tasks
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 3.6, duration: 0.3 }}
                    className="text-xs text-green-400 flex items-center gap-1.5 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/30"
                  >
                    <motion.svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      initial={{ rotate: -180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ delay: 3.7, duration: 0.4, ease: "easeOut" }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                    <span className="font-semibold">Synced to Google Calendar</span>
                  </motion.div>
                </div>

                {/* Task 1 - Gets completed with overlay (Medium priority) */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.8, duration: 0.4 }}
                  className="flex items-start gap-2 sm:gap-3 p-3 sm:p-3.5 bg-white/5 rounded-lg border border-blue-400/30 relative overflow-hidden pointer-events-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-transparent"></div>

                  {/* Completion overlay - clean and professional */}
                  <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-lg flex items-center justify-center z-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4.1, duration: 0.2, ease: "easeOut" }}
                  >
                    <motion.svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-green-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 4.15, duration: 0.2, ease: "easeOut" }}
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </motion.svg>
                  </motion.div>

                  {/* Checkbox - simple fade in */}
                  <motion.div
                    className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-400 rounded flex-shrink-0 mt-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.85, duration: 0.2 }}
                  />

                  <div className="flex-1 relative z-10 min-w-0">
                    {/* Task text - clean fade in */}
                    <motion.div
                      className="text-xs sm:text-sm text-white/90 font-medium truncate sm:whitespace-normal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.85, duration: 0.2 }}
                    >
                      Send client proposal
                    </motion.div>

                    {/* Meta info - simple fade */}
                    <motion.div
                      className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5 text-[10px] sm:text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.9, duration: 0.2 }}
                    >
                      <span className="text-blue-400 font-medium whitespace-nowrap">📅 Tomorrow, 10:00 AM</span>
                      <span className="text-white/40 whitespace-nowrap">• Medium priority</span>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Task 2 - Gets priority boost animation (0.5s after generation = 4.1s) */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    opacity: { delay: 3.0, duration: 0.4 },
                    x: { delay: 3.0, duration: 0.4 }
                  }}
                  className="flex items-start gap-2 sm:gap-3 p-3 sm:p-3.5 bg-white/5 rounded-lg border border-green-400/30 relative overflow-hidden pointer-events-none"
                >
                  {/* Subtle priority boost highlight */}
                  <motion.div
                    className="absolute inset-0 bg-yellow-400/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ delay: 4.1, duration: 0.6, ease: "easeInOut" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-transparent"></div>

                  {/* Checkbox - simple */}
                  <motion.div
                    className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-green-400 rounded flex-shrink-0 mt-0.5 sm:mt-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.05, duration: 0.2 }}
                  />

                  <div className="flex-1 relative z-10 min-w-0">
                    {/* Task text */}
                    <motion.div
                      className="text-xs sm:text-sm text-white/90 font-medium truncate sm:whitespace-normal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3.05, duration: 0.2 }}
                    >
                      Finish presentation slides
                    </motion.div>

                    {/* Meta info */}
                    <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5 text-[10px] sm:text-xs">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3.1, duration: 0.2 }}
                        className="text-green-400 font-medium whitespace-nowrap"
                      >
                        📅 Today, 2:00 PM
                      </motion.span>
                      {/* Priority badge container - fixed position for both states */}
                      <span className="whitespace-nowrap relative">
                        {/* Low priority badge - fades out */}
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 1, 0] }}
                          transition={{
                            delay: 3.15,
                            duration: 1.5,
                            times: [0, 0.2, 0.7, 1]
                          }}
                          className="text-white/40 absolute left-0"
                        >
                          • Low priority
                        </motion.span>
                        {/* High priority badge - clean fade in at 4.1s */}
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 4.1, duration: 0.2, ease: "easeOut" }}
                          className="font-medium text-orange-400"
                        >
                          • High priority
                        </motion.span>
                      </span>
                    </div>
                  </div>

                  {/* AI indicator - subtle */}
                  <motion.div
                    className="absolute top-2 right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 4.15, duration: 0.2, ease: "easeOut" }}
                  />
                </motion.div>

                {/* Task 3 - Gets a suggested link added */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 3.2, duration: 0.4 }}
                  className="flex items-start gap-2 sm:gap-3 p-3 sm:p-3.5 bg-white/5 rounded-lg border border-white/20 relative overflow-hidden pointer-events-none"
                >

                  {/* Checkbox - simple */}
                  <motion.div
                    className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/40 rounded flex-shrink-0 mt-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.25, duration: 0.2 }}
                  />

                  <div className="flex-1 min-w-0">
                    {/* Task text */}
                    <motion.div
                      className="text-xs sm:text-sm text-white/90 font-medium truncate sm:whitespace-normal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3.25, duration: 0.2 }}
                    >
                      Schedule team meeting
                    </motion.div>

                    {/* Meta info */}
                    <motion.div
                      className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5 text-[10px] sm:text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3.3, duration: 0.2 }}
                    >
                      <span className="text-white/60 font-medium whitespace-nowrap">📅 Next Monday, 3:00 PM</span>
                      <span className="text-white/40 whitespace-nowrap">• Low priority</span>
                    </motion.div>

                    {/* AI suggested context link - clean appearance */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 4.1, duration: 0.3, ease: "easeOut" }}
                      className="mt-1.5 sm:mt-2"
                    >
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-white/50">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        <span className="font-medium">Google Calendar</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Success completion pulse */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 3.8, duration: 0.4 }}
                  className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ delay: 3.9, duration: 0.5 }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.9, duration: 0.3 }}
                    className="text-xs text-green-400 font-medium"
                  >
                    3 tasks generated & synced
                  </motion.span>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ delay: 3.9, duration: 0.5 }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                </motion.div>
              </motion.div>
            </motion.div>
            </div>


          </div>


        </div>
      </section>

      {/* How Teyra Works Section */}
      <section className="py-12 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              how teyra <span className="text-white">works</span>
            </h2>
            <p className="hero-subtitle max-w-2xl mx-auto">
              unlike traditional todo apps, teyra adapts to your unique productivity patterns and emotional needs
            </p>
          </motion.div>

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
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="glass-dark-modern rounded-xl p-6 text-center group cursor-pointer"
              >
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-colors"
                >
                  <problem.icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pomodoro Timer Demo Section */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">

            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-4 sm:space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-400/10 border border-green-400/30">
                <span className="text-sm font-semibold text-green-400">⏱️ Pomodoro Timer</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
                stay focused,
                <br />
                <span className="text-green-400">earn rewards</span>
              </h2>

              <p className="text-lg text-white/70">
                built-in pomodoro timer keeps you focused for 25-minute sessions. complete distraction-free sessions to earn XP and level up mike.
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
            </motion.div>

            {/* Right Side - Chrome Extension Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
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
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/30 text-green-400 font-semibold"
                  >
                    🔒 Focused
                  </motion.div>
                </div>

                {/* Timer Display */}
                <div className="flex flex-col items-center justify-center py-6">
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-6xl font-bold text-white mb-3"
                  >
                    24:37
                  </motion.div>
                  <div className="text-sm text-white/60 mb-6">Time remaining</div>

                  {/* Progress Ring */}
                  <div className="relative w-40 h-40 mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#4ade80"
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 440" }}
                        animate={{ strokeDasharray: "343 440" }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
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
            </motion.div>

          </div>
        </div>
      </section>

      {/* Focus Mode Demo Section - Enhanced */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">

            {/* Left Side - Chrome Extension Mockup */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              {/* Browser Window with Blocked Site */}
              <div className="glass-dark-modern rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                  </div>
                  <div className="ml-4 flex-1 bg-white/5 rounded-lg px-3 py-1.5 text-xs text-white/40 flex items-center gap-2">
                    <motion.div
                      animate={{ x: [0, 150, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-lg"
                    >
                      👆
                    </motion.div>
                    <span>youtube.com</span>
                  </div>
                </div>

                {/* Blocked Page Content */}
                <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent relative">
                  {/* Animated pulse effect */}
                  <motion.div
                    className="absolute inset-0 bg-red-400/5 rounded-full blur-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                    whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
                    viewport={{ once: true }}
                    className="text-7xl sm:text-8xl mb-6 relative z-10"
                  >
                    🚫
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="text-2xl sm:text-3xl font-bold text-white mb-3 relative z-10"
                  >
                    Site Blocked
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="text-white/70 text-center mb-8 max-w-sm relative z-10 text-sm sm:text-base"
                  >
                    Focus mode is active. This site is blocked to help you stay productive.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    viewport={{ once: true }}
                    className="space-y-2 w-full max-w-sm relative z-10"
                  >
                    {[
                      { icon: '📱', site: 'instagram.com', delay: 0.7 },
                      { icon: '💬', site: 'twitter.com', delay: 0.8 },
                      { icon: '🎮', site: 'reddit.com', delay: 0.9 }
                    ].map((item, index) => (
                      <motion.div
                        key={item.site}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: item.delay }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="flex items-center justify-between p-3 bg-red-400/10 rounded-lg border border-red-400/30 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs">
                            {item.icon}
                          </div>
                          <span className="text-sm text-white/90 font-medium">{item.site}</span>
                        </div>
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-xs text-red-400 font-semibold"
                        >
                          BLOCKED
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Pro badge indicator */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.0 }}
                    viewport={{ once: true }}
                    className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full relative z-10"
                  >
                    <span className="text-xs font-semibold text-purple-300">✨ Customize blocklist with Pro</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-4 sm:space-y-6 order-1 lg:order-2 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-400/10 border border-red-400/30"
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-base"
                >
                  🚫
                </motion.span>
                <span className="text-sm font-semibold text-red-400">Focus Mode</span>
              </motion.div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
                block distractions,
                <br />
                <span className="bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                  boost productivity
                </span>
              </h2>

              <p className="text-base sm:text-lg text-white/70 leading-relaxed">
                one click to block social media and distracting websites. stay in the zone with our Chrome extension and earn XP for every focused session.
              </p>

              <div className="space-y-3 max-w-md mx-auto lg:mx-0 pt-4">
                {[
                  { icon: '⚡', text: 'Instantly block distracting websites', delay: 0.2 },
                  { icon: '🎯', text: 'Customizable blocklist (Pro feature)', delay: 0.3 },
                  { icon: '⏱️', text: 'Works seamlessly with Pomodoro timer', delay: 0.4 },
                  { icon: '🏆', text: 'Earn +10 XP for every focused hour', delay: 0.5 }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: item.delay }}
                    viewport={{ once: true }}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 justify-center lg:justify-start"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-400/20 flex items-center justify-center flex-shrink-0 border border-red-400/30">
                      <span className="text-sm">{item.icon}</span>
                    </div>
                    <span className="text-white/80 text-left text-sm sm:text-base">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA to extension */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
                className="pt-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => document.getElementById('chrome-extension')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-red-400/10 hover:bg-red-400/20 border border-red-400/30 hover:border-red-400/50 rounded-lg text-red-300 font-medium transition-all duration-300 text-sm sm:text-base"
                >
                  Get Chrome Extension →
                </motion.button>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Meet Mike Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              meet <span className="text-white">mike</span>
            </h2>
            <p className="hero-subtitle max-w-2xl mx-auto">your emotional support cactus</p>
          </motion.div>

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
              <motion.div
                key={mike.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-dark-modern rounded-xl p-6 text-center group cursor-pointer"
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              features that <span className="text-white">actually help</span>
            </h2>
            <p className="hero-subtitle max-w-2xl mx-auto">
              every feature designed around human psychology and real productivity needs
            </p>
          </motion.div>

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
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="glass-dark-modern rounded-xl p-6 text-center group cursor-pointer"
              >
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-colors"
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chrome Extension - Download CTA */}
      <section id="chrome-extension" className="py-24 px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            {/* Chrome icon with animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              viewport={{ once: true }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center"
            >
              <span className="text-4xl">🌐</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 text-white"
            >
              get the chrome extension
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-full text-green-300 text-sm font-medium mb-8"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-400 rounded-full"
              />
              now available
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="hero-subtitle mb-8 max-w-2xl mx-auto"
            >
              bring mike, focus mode, and pomodoro timer directly to your browser. boost productivity wherever you work.
            </motion.p>

            {/* Big download button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://tally.so/r/nr7G7l', '_blank')}
                className="relative px-10 py-5 text-lg font-bold text-white rounded-xl overflow-hidden shadow-2xl group"
              >
                {/* Animated gradient background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: '200% 200%',
                  }}
                />

                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />

                {/* Button content */}
                <span className="relative z-10 flex items-center gap-3">
                  <Rocket className="w-6 h-6" />
                  Add to Chrome - It's Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                viewport={{ once: true }}
                className="text-white/40 text-xs mt-4"
              >
                Works with Chrome, Edge, Brave & other Chromium browsers
              </motion.p>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="glass-dark-modern rounded-xl p-6 relative group cursor-pointer"
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="glass-dark-modern rounded-xl p-6 relative group cursor-pointer"
            >
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
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('https://tally.so/r/nr7G7l', '_blank')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-lg text-purple-300 font-medium hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300 cursor-pointer"
            >
              get notified when it's ready
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
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
          </motion.div>
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