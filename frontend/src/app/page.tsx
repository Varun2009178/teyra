'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Brain, Target, Grid3X3, Code, Layers, Command, Heart, TrendingUp, Shield, Users, MessageCircle, Coffee, Clock, CheckCircle2, Star, Rocket, Smile, ChevronRight, Play, Pause, Volume2 } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';



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

  // Show loading state while authentication is being determined
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div 
            className="w-16 h-16 border-4 border-t-black border-gray-200 rounded-full animate-spin mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="mt-4 text-gray-600 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            loading...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-gradient-bg noise-texture text-white overflow-x-hidden relative">
      
      {/* Enhanced Unique Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark-modern border-b border-precise backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center"
            >
              <Link href="/" className="flex items-center group relative px-1 py-1 rounded hover:bg-white/5 transition-colors">
                <Image
                  src="/teyra-logo-64kb.png"
                  alt="Teyra"
                  width={36}
                  height={36}
                  className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10"
                />
              </Link>
            </motion.div>
            
            {/* Mobile menu button */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center lg:hidden"
            >
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
            </motion.div>
            
            {/* Desktop navigation */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hidden lg:flex items-center space-x-2"
            >
              {isLoaded && user ? (
                <>
                  <Link href="/contact">
                    <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      contact
                    </button>
                  </Link>
                  <Link href="/sustainability">
                    <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      sustainability
                    </button>
                  </Link>
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
                  <Link href="/contact">
                    <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      contact
                    </button>
                  </Link>
                  <Link href="/sustainability">
                    <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      sustainability
                    </button>
                  </Link>
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
            </motion.div>
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
                      <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                        <div className="mobile-menu-item block w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          contact
                        </div>
                      </Link>
                      <Link href="/sustainability" onClick={() => setMobileMenuOpen(false)}>
                        <div className="mobile-menu-item block w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          sustainability
                        </div>
                      </Link>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <div className="mobile-menu-item block w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
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
                      <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                        <div className="mobile-menu-item block w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          contact
                        </div>
                      </Link>
                      <Link href="/sustainability" onClick={() => setMobileMenuOpen(false)}>
                        <div className="mobile-menu-item block w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          sustainability
                        </div>
                      </Link>
                      <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                        <div className="mobile-menu-item block w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                          sign in
                        </div>
                      </Link>
                      <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                        <div className="mobile-menu-item block w-full text-center px-4 py-3 bg-white text-black hover:bg-white/90 rounded-lg transition-colors font-semibold">
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
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32">
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
                <span>ai-powered</span>
                <div className="w-px h-4 bg-white/20 mx-2"></div>
                <span>emotionally intelligent</span>
              </motion.div>

              {/* Main Hero Text - Clean & Animated */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-4 sm:space-y-6"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight tracking-tight">
                  the todolist that
                </h1>
                <div className="space-y-1 sm:space-y-2 text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    className="text-green-400 flex items-center justify-center lg:justify-start gap-2 sm:gap-3"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.2 }}
                      className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl flex-shrink-0"
                    >
                      ✓
                    </motion.span>
                    <span className="select-none">learns from you</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="text-purple-400 flex items-center justify-center lg:justify-start gap-2 sm:gap-3"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.4 }}
                      className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl flex-shrink-0"
                    >
                      ✓
                    </motion.span>
                    <span className="select-none">integrates into your life</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                    className="text-blue-400 flex items-center justify-center lg:justify-start gap-2 sm:gap-3"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.6 }}
                      className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl flex-shrink-0"
                    >
                      ✓
                    </motion.span>
                    <span className="select-none">understands your emotions</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.6 }}
                    className="text-white flex items-center justify-center lg:justify-start gap-2 sm:gap-3"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.8 }}
                      className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl flex-shrink-0"
                    >
                      ✓
                    </motion.span>
                    <span className="select-none">helps you focus</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2.0 }}
                className="text-base sm:text-lg md:text-xl text-white/70 max-w-lg mx-auto lg:mx-0 font-medium"
              >
                {user ? (
                  "welcome back! ready to continue?"
                ) : (
                  "try out humane productivity today, for free"
                )}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
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
                    <Link href="/sign-up">
                      <button
                        className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium bg-white hover:bg-white/90 text-black rounded-lg transition-all duration-200 w-full sm:w-auto"
                        style={{ outline: 'none', boxShadow: 'none' }}
                      >
                        get started
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link href="/sign-in">
                      <button
                        className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white w-full sm:w-auto"
                        style={{ outline: 'none', boxShadow: 'none' }}
                      >
                        sign in
                      </button>
                    </Link>
                    <motion.button
                      onClick={() => document.getElementById('chrome-extension')?.scrollIntoView({ behavior: 'smooth' })}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-400/30 hover:border-purple-400/50 rounded-lg transition-all duration-300 text-white w-full sm:w-auto group overflow-hidden"
                      style={{ outline: 'none', boxShadow: 'none' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        chrome extension
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full opacity-60"
                        />
                      </span>
                    </motion.button>
                  </>
                )}
              </motion.div>

              {/* Status Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
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
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <span>emotionally intelligent</span>
                </div>
              </motion.div>

            </motion.div>
            </div>

            {/* Right Side - Productivity Preview */}
            <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="relative max-w-sm mx-auto lg:max-w-none"
            >
              {/* Main Preview Container */}
              <div className="glass-dark-modern rounded-xl p-4 sm:p-6 relative overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="text-xs text-white/40">today</div>
                </div>

                {/* Today's Tasks Preview */}
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="w-4 h-4 border-2 border-green-400 rounded flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 1.5 }}
                        className="w-2 h-2 bg-green-400 rounded-sm"
                      />
                    </div>
                    <span className="text-sm text-white/80 flex-1">morning walk</span>
                    <div className="text-xs text-green-400">done!</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="w-4 h-4 border-2 border-white/40 rounded"></div>
                    <span className="text-sm text-white/80 flex-1">review project docs</span>
                    <div className="text-xs text-purple-400">focus time</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.6 }}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="w-4 h-4 border-2 border-white/40 rounded"></div>
                    <span className="text-sm text-white/80 flex-1">call mom</span>
                    <div className="text-xs text-blue-400">later</div>
                  </motion.div>
                </div>

                {/* Mike's Suggestion */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.8 }}
                  className="mt-4 sm:mt-6 p-3 bg-gradient-to-r from-green-400/10 to-purple-400/10 rounded-lg border border-green-400/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center">
                      <span className="text-xs">🌵</span>
                    </div>
                    <span className="text-xs font-medium text-green-400">mike suggests</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    you're doing great! maybe take a 5-minute break before the next task?
                  </p>
                </motion.div>
              </div>

              {/* Floating Mood Indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -3, 0]
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 1.0 },
                  scale: { duration: 0.5, delay: 1.0 },
                  y: { duration: 3, repeat: Infinity, delay: 2.0 }
                }}
                className="absolute -top-2 -right-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-xl z-30"
              >
                😊 focused
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

      {/* Chrome Extension Coming Soon */}
      <section id="chrome-extension" className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="relative"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
                chrome extension
              </h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm font-medium mb-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full"
                />
                coming soon
              </motion.div>
            </motion.div>

            <p className="hero-subtitle mb-12 max-w-2xl mx-auto">
              mike will live in your browser, keeping you focused and on track
            </p>
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
        <div className="font-geist-mono">
          &copy; {new Date().getFullYear()} teyra. crafted with care for human productivity.
        </div>
      </footer>
    </div>
  );
}