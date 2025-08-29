'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, Brain, Target, Grid3X3, Code, Layers, Command, Heart, TrendingUp, Shield, Users, MessageCircle, Coffee, Clock, CheckCircle2, Star, Rocket, Smile, ChevronRight, Play, Pause, Volume2 } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { Navbar } from '@/components/Navbar';
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
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute top-3/4 right-1/4 w-56 h-56 sm:w-80 sm:h-80 bg-gradient-to-br from-black/5 to-gray-200/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, -40, 25, 0], 
          y: [0, 25, -20, 0],
        }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
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
    <div className="min-h-screen bg-white text-black overflow-x-hidden relative">
      <GradientBackground />
      <FloatingParticles />
      
      <Navbar />

      {/* Hero Section - Clean Tech Layout */}
      <section className="relative min-h-[100svh] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-24 lg:pt-28">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
             {/* Left side - Clean content */}
             <div className="lg:col-span-7 space-y-7 mt-0">
              
              {/* Status indicator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex items-center gap-3 text-sm text-gray-600"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>system online</span>
                <div className="w-px h-4 bg-gray-300 mx-2"></div>
                <span>productivity status: broken</span>
              </motion.div>

              {/* Main title */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="space-y-6"
              >
                <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="text-black block">Productivity</span>
                  <span className="text-black">
                    <ScrambleText className="text-black">is</ScrambleText>
                  </span>
                  <br />
                  <span className="text-black relative inline-block font-bold">
                    <ScrambleText className="text-black">Broken</ScrambleText>
                    <motion.div 
                      className="absolute -bottom-2 left-0 w-full h-1 bg-black rounded-full"
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: 1.5, duration: 0.8 }}
                      style={{ transformOrigin: "left" }}
                    />
                  </span>
                </h1>
              </motion.div>

               {/* Subtitle with smooth fade in */}
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 1.6, duration: 1.2, ease: "easeOut" }}
                 className="text-xl sm:text-2xl text-gray-600 max-w-2xl -mt-1"
               >
                 {user ? (
                   "welcome back! ready to continue your productivity journey?"
                 ) : (
                   <>
                     so we made it honest, <span className="text-emerald-600 font-semibold">sustainable</span>, and overwhelmingly easy
                   </>
                 )}
               </motion.div>

              {/* Clean buttons */}
               <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2.5 }}
                 className="flex flex-col sm:flex-row gap-4"
              >
                {isLoaded && user ? (
                  <Button 
                    size="lg" 
                    asChild
                    className="bg-black hover:bg-gray-900 text-white text-xl px-10 py-6 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Link href="/dashboard" className="flex items-center gap-2">
                      go to dashboard
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      asChild
                    className="bg-black hover:bg-gray-900 text-white text-xl px-10 py-6 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Link href="/sign-up" className="flex items-center gap-2">
                        get started
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      asChild
                    className="text-xl px-10 py-6 border-2 border-gray-200 hover:bg-gray-50 rounded-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Link href="/sign-in">sign in</Link>
                    </Button>
                  </>
                )}
              </motion.div>

              {/* Simple status indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                className="flex items-center gap-8 text-sm text-gray-500"
              >
                                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                   <span>many users</span>
                 </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>ai powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>emotionally intelligent</span>
                </div>
              </motion.div>
            </div>

            {/* Right side - Clean Mike display */}
            <div className="lg:col-span-5 hidden lg:block">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="relative"
              >
                {/* Clean container */}
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg relative overflow-hidden">
                  
                  {/* Subtle corner indicators */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full"></div>
                                     <div className="absolute top-4 left-4 text-xs text-gray-500 font-mono">teyra v3</div>
                  
                  {/* Mike display */}
                  <motion.div 
                    className="text-center relative"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <motion.div 
                      className="w-40 h-40 sm:w-56 sm:h-56 bg-gradient-to-br from-white to-gray-50 rounded-full border border-gray-200 flex items-center justify-center mx-auto mb-8 relative shadow-xl"
                      whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                    >
                      <Image 
                        src="/Neutral Calm.gif" 
                        alt="Mike the Cactus" 
                        width={120} 
                        height={120}
                        className="object-contain relative z-10 w-20 h-20 sm:w-28 sm:h-28"
                      />
                      
                      {/* Subtle rotating ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 border border-gray-200/50 rounded-full"
                      />
                    </motion.div>

                    {/* Clean data display */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded-lg border">
                        <div className="text-gray-500 text-xs uppercase tracking-wide">empathy</div>
                        <div className="text-black font-bold text-lg">high</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg border">
                        <div className="text-gray-500 text-xs uppercase tracking-wide">patience</div>
                        <div className="text-black font-bold text-lg">∞</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg border">
                        <div className="text-gray-500 text-xs uppercase tracking-wide">ai level</div>
                        <div className="text-black font-bold text-lg">smart</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg border">
                        <div className="text-gray-500 text-xs uppercase tracking-wide">kindness</div>
                        <div className="text-black font-bold text-lg">max</div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Minimal floating indicators */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs"
                >
                  online
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                  className="absolute -bottom-2 -left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs"
                >
                  ready
                </motion.div>
              </motion.div>
            </div>

            {/* Mobile Teyra v3 Cactus Section - Better sized and positioned */}
            <div className="lg:hidden absolute top-1/3 right-4 transform -translate-y-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="relative"
              >
                {/* Medium container for mobile */}
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-lg relative overflow-hidden">
                  
                  {/* Corner indicators */}
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono">v3</div>
                  
                  {/* Medium Mike display */}
                  <motion.div 
                    className="text-center relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-br from-white to-gray-50 rounded-full border border-gray-200 flex items-center justify-center mx-auto mb-3 relative shadow-md"
                      whileHover={{ boxShadow: "0 10px 20px -6px rgba(0, 0, 0, 0.2)" }}
                    >
                      <Image 
                        src="/Neutral Calm.gif" 
                        alt="Mike the Cactus" 
                        width={48} 
                        height={48}
                        className="object-contain relative z-10 w-10 h-10"
                      />
                      
                      {/* Subtle rotating ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 border border-gray-200/50 rounded-full"
                      />
                    </motion.div>

                    {/* Medium data display */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-gray-50 rounded-lg border">
                        <div className="text-gray-500 text-[10px] uppercase tracking-wide">empathy</div>
                        <div className="text-black font-bold text-xs">high</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg border">
                        <div className="text-gray-500 text-[10px] uppercase tracking-wide">ai</div>
                        <div className="text-black font-bold text-xs">smart</div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Medium floating indicators */}
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute -top-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs"
                >
                  on
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - New addition */}
      <StatsSection />

      {/* Problem Section - Better responsive grid */}
      <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 text-black">
              the <span className="text-black">problem</span> with productivity
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={Clock}
              title="endless lists"
              description="you add tasks faster than you complete them"
              delay={0.1}
            />
            <FeatureCard
              icon={MessageCircle}
              title="guilt & shame"
              description="uncompleted tasks make you feel like a failure"
              delay={0.2}
            />
            <FeatureCard
              icon={Coffee}
              title="no motivation"
              description="apps don't care about your feelings"
              delay={0.3}
            />
            <FeatureCard
              icon={Users}
              title="treats you like a robot"
              description="no understanding of human emotions"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Mike Introduction - Better responsive design */}
      <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8">
              meet <span className="text-black">mike</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600">your emotional support cactus</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
              className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="text-center">
                <Image src="/Happy.gif" alt="Happy Mike" width={120} height={120} className="mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" />
                <h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3">celebrates your wins</h3>
                <p className="text-sm sm:text-base text-gray-600">"you completed 3 tasks! you're amazing!"</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
              className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="text-center">
                <Image src="/Neutral Calm.gif" alt="Calm Mike" width={120} height={120} className="mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" />
                <h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3">always patient</h3>
                <p className="text-sm sm:text-base text-gray-600">"take your time. i'm here when you're ready."</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
              className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="text-center">
                <Image src="/Sad With Tears 2.gif" alt="Caring Mike" width={120} height={120} className="mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" />
                <h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3">supports tough days</h3>
                <p className="text-sm sm:text-base text-gray-600">"rough day? tomorrow's a fresh start 💜"</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Better responsive design */}
      <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 sm:mb-12 text-black">
              why it <span className="text-black">works</span>
            </h2>
            
            <div className="space-y-8 sm:space-y-12 lg:space-y-16 text-left max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 sm:gap-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center"
                >
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </motion.div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 text-black">learns your patterns</h3>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed">
                    mike notices when you're most productive and suggests perfect timing for different tasks.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 sm:gap-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center"
                >
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </motion.div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 text-black">reads your mood</h3>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed">
                    having a tough day? mike adjusts his approach to be more supportive and encouraging.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 sm:gap-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </motion.div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 text-black">celebrates progress</h3>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed">
                    every small win matters. mike makes sure you feel proud of what you accomplish.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 sm:gap-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center"
                >
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </motion.div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 text-black">protects your peace</h3>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed">
                    mike prevents overwhelm by helping you set realistic boundaries and healthy habits.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Showcase Section - Better responsive grid */}
      <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              what makes mike <span className="text-black">special</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              built for humans, not machines
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon={Brain}
              title="emotional intelligence"
              description="understands your feelings and adapts to your emotional state"
              delay={0.1}
            />
            <FeatureCard
              icon={Target}
              title="smart prioritization"
              description="helps you focus on what truly matters without overwhelming you"
              delay={0.2}
            />
            <FeatureCard
              icon={Heart}
              title="guilt free environment"
              description="no shame, no pressure, just gentle guidance towards your goals"
              delay={0.3}
            />
            <FeatureCard
              icon={Sparkles}
              title="celebrates every win"
              description="from tiny steps to major milestones, every progress is acknowledged"
              delay={0.4}
            />
            <FeatureCard
              icon={Shield}
              title="burnout prevention"
              description="built in safeguards to protect your mental health and energy"
              delay={0.5}
            />
            <FeatureCard
              icon={Zap}
              title="always available"
              description="24/7 support that understands you're human, not a productivity machine"
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section - Better responsive design */}
      <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8">
              what people are <span className="text-black">saying</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 sm:p-8 shadow-lg"
            >
              <p className="text-sm sm:text-base text-gray-600 mb-4 italic">"finally, a productivity app that doesn't make me feel terrible about myself. mike actually cares."</p>
              <div className="text-xs sm:text-sm text-gray-500">— sarah, designer</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 sm:p-8 shadow-lg"
            >
              <p className="text-sm sm:text-base text-gray-600 mb-4 italic">"the emotional support actually works. i'm more productive because i'm not fighting guilt and shame."</p>
              <div className="text-xs sm:text-sm text-gray-500">— marcus, developer</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA - Better responsive design */}
      <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 text-black">
              ready to transform your productivity?
            </h2>
                         <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto">
               join hundreds of users who've found their perfect productivity companion
             </p>
            
            <Button 
              size="lg"
              className="bg-black hover:bg-gray-800 text-white text-sm sm:text-base lg:text-lg px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-6 transform hover:scale-105 transition-all duration-300 ease-out shadow-lg hover:shadow-xl rounded-xl"
              asChild
            >
              <Link href={isLoaded && user ? '/dashboard' : '/sign-up'}>
                <span className="flex items-center gap-2">
                  {isLoaded && user ? 'go to dashboard' : 'get started free'}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              </Link>
            </Button>
            <p className="text-xs sm:text-sm text-gray-500 mt-4">
              {isLoaded && user ? 'continue your productivity journey' : 'sign up and start today'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer - Better responsive design */}
      <footer className="py-6 sm:py-8 text-center text-gray-400 text-sm border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="text-gray-500">
          &copy; {new Date().getFullYear()} teyra. all rights reserved.
        </div>
      </footer>
    </div>
  );
}