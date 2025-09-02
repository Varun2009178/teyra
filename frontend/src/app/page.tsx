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
              <Link href="/" className="flex items-center group relative">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="relative"
                >
                  <Image 
                    src="/teyra-logo-64kb.png" 
                    alt="Teyra" 
                    width={36} 
                    height={36}
                    className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10"
                  />
                  <motion.div
                    className="absolute inset-0 bg-white/10 rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.2, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
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

      {/* Hero Section - Teyra Style */}
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
                <span>mike is online</span>
                <div className="w-px h-4 bg-white/20 mx-2"></div>
                <span>ready to help</span>
              </motion.div>

              {/* Main Hero Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-6"
              >
                <h1 className="hero-title">
                  <span className="block">Productivity</span>
                  <span className="block">is</span>
                  <span className="block relative inline-block">
                    Broken
                    <motion.div 
                      className="absolute -bottom-2 left-0 right-0 h-1 bg-white rounded-full"
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: 1.5, duration: 0.8 }}
                      style={{ transformOrigin: "left" }}
                    />
                  </span>
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="hero-subtitle max-w-xl mx-auto lg:mx-0"
              >
                {user ? (
                  "welcome back! ready to continue your productivity journey?"
                ) : (
                  <>
                    so we made it honest, <span className="text-green-400 font-medium">sustainable</span>, and overwhelmingly easy
                  </>
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

            {/* Right Side - Interactive Demo */}
            <div className="lg:col-span-5 hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="relative"
            >
              {/* Main Demo Container */}
              <div className="glass-dark-modern rounded-xl p-6 relative overflow-visible">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="text-xs text-white/40">teyra v3</div>
                </div>

                {/* Mike Display */}
                <motion.div 
                  className="text-center relative mb-6"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <motion.div 
                    className="w-32 h-32 bg-gradient-to-br from-white/10 to-white/5 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-4 relative"
                    whileHover={{ borderColor: "rgba(255, 255, 255, 0.4)" }}
                  >
                    <Image 
                      src="/Neutral Calm.gif" 
                      alt="Mike the Cactus" 
                      width={80} 
                      height={80}
                      className="object-contain relative z-10"
                    />
                    
                    {/* Subtle rotating ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-3 border border-white/10 rounded-full"
                    />
                  </motion.div>

                  {/* Status Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white/40 uppercase tracking-wide mb-1">empathy</div>
                      <div className="text-white font-medium">high</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white/40 uppercase tracking-wide mb-1">patience</div>
                      <div className="text-white font-medium">∞</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white/40 uppercase tracking-wide mb-1">ai level</div>
                      <div className="text-white font-medium">smart</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white/40 uppercase tracking-wide mb-1">kindness</div>
                      <div className="text-white font-medium">max</div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Status Indicators - positioned outside container */}
              </div>
              
              {/* Floating indicators positioned outside the main container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -4, 0] 
                }}
                transition={{ 
                  opacity: { duration: 0.5, delay: 1.0 },
                  scale: { duration: 0.5, delay: 1.0 },
                  y: { duration: 3, repeat: Infinity, delay: 1.5 }
                }}
                className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-green-500 text-black px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-2xl border-2 border-green-300 z-30"
                style={{
                  boxShadow: "0 10px 35px -5px rgba(34, 197, 94, 0.6), 0 6px 10px -2px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
                }}
              >
                online
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, 4, 0] 
                }}
                transition={{ 
                  opacity: { duration: 0.5, delay: 1.2 },
                  scale: { duration: 0.5, delay: 1.2 },
                  y: { duration: 4, repeat: Infinity, delay: 2.0 }
                }}
                className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 bg-blue-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-2xl border-2 border-blue-300 z-30"
                style={{
                  boxShadow: "0 10px 35px -5px rgba(59, 130, 246, 0.6), 0 6px 10px -2px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                }}
              >
                learning
              </motion.div>
            </motion.div>
            </div>

            {/* Mobile Mike Section */}
            <div className="lg:hidden mt-6 sm:mt-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="relative"
              >
                <div className="glass-dark-modern rounded-xl p-6 relative overflow-hidden max-w-sm mx-auto">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-xs text-white/40">teyra v3</div>
                  </div>

                  {/* Mike Display */}
                  <motion.div 
                    className="text-center relative mb-6"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <motion.div 
                      className="w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-4 relative"
                      whileHover={{ borderColor: "rgba(255, 255, 255, 0.4)" }}
                    >
                      <Image 
                        src="/Neutral Calm.gif" 
                        alt="Mike the Cactus" 
                        width={60} 
                        height={60}
                        className="object-contain relative z-10"
                      />
                      
                      {/* Subtle rotating ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 border border-white/10 rounded-full"
                      />
                    </motion.div>

                    {/* Status Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/40 uppercase tracking-wide mb-1 text-[10px]">empathy</div>
                        <div className="text-white font-medium text-xs">high</div>
                      </div>
                      <div className="text-center p-2 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/40 uppercase tracking-wide mb-1 text-[10px]">ai</div>
                        <div className="text-white font-medium text-xs">smart</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating Status Indicators */}
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="absolute -top-1 -right-1 bg-green-500 text-black px-1.5 py-0.5 rounded-md text-xs font-medium z-30"
                  >
                    on
                  </motion.div>
                </div>
              </motion.div>
            </div>

          </div>

          {/* Simple tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.2 }}
            className="text-center mt-16 px-4"
          >
            <p className="text-white/40 text-sm mx-auto max-w-md">
              your emotional support cactus is waiting
            </p>
          </motion.div>

        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 lg:px-8 border-t border-precise">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              the <span className="text-white">problem</span> with productivity
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Clock,
                title: "endless lists",
                description: "you add tasks faster than you complete them"
              },
              {
                icon: MessageCircle,
                title: "guilt & shame",
                description: "uncompleted tasks make you feel like a failure"
              },
              {
                icon: Coffee,
                title: "no motivation",
                description: "apps don't care about your feelings"
              },
              {
                icon: Users,
                title: "treats you like a robot",
                description: "no understanding of human emotions"
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
      <section className="py-24 px-6 lg:px-8 border-t border-precise">
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

      {/* Features Preview */}
      <section className="py-24 px-6 lg:px-8 border-t border-precise">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              what makes mike <span className="text-white">special</span>
            </h2>
            <p className="hero-subtitle max-w-2xl mx-auto">
              built for humans, not machines
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "emotional intelligence",
                description: "understands your feelings and adapts to your emotional state"
              },
              {
                icon: Target,
                title: "smart prioritization",
                description: "helps you focus on what truly matters without overwhelming you"
              },
              {
                icon: Heart,
                title: "guilt free environment",
                description: "no shame, no pressure, just gentle guidance towards your goals"
              },
              {
                icon: Sparkles,
                title: "celebrates every win",
                description: "from tiny steps to major milestones, every progress is acknowledged"
              },
              {
                icon: Shield,
                title: "burnout prevention",
                description: "built in safeguards to protect your mental health and energy"
              },
              {
                icon: Zap,
                title: "always available",
                description: "24/7 support that understands you're human, not a productivity machine"
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

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-8 border-t border-precise">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              ready to transform your productivity?
            </h2>
            <p className="hero-subtitle mb-8 max-w-2xl mx-auto">
              join hundreds of users who've found their perfect productivity companion
            </p>
            
            <div className="flex justify-center">
              <Link href={isLoaded && user ? '/dashboard' : '/sign-up'}>
                <button 
                  className="flex items-center gap-2 px-12 py-6 text-lg font-medium bg-white hover:bg-white/90 text-black rounded-lg transition-all duration-200"
                  style={{ outline: 'none', boxShadow: 'none' }}
                >
                  {isLoaded && user ? 'go to dashboard' : 'get started'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
            <p className="text-xs text-white/40 mt-4">
              {isLoaded && user ? 'continue your productivity journey' : 'sign up and start today'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-white/40 text-sm border-t border-precise">
        <div className="font-geist-mono">
          &copy; {new Date().getFullYear()} teyra. crafted with care for human productivity.
        </div>
      </footer>
    </div>
  );
}