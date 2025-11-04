'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, Brain, Target, Grid3X3, Code, Layers, Command, Heart, TrendingUp, Shield, Users, MessageCircle, Coffee, Clock, CheckCircle2, Star, Rocket, Smile, ChevronRight, Play, Pause, Volume2 } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

// FlipWords component like Siden.ai
const FlipWords = ({ words, className = "" }: { words: string[]; className?: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`${className}`}
      >
        {words[currentIndex]}
      </motion.span>
    </AnimatePresence>
  );
};

// Modern brand carousel component
const BrandCarousel = () => {
  const brands = [
    { name: "OpenAI", icon: "🤖" },
    { name: "Anthropic", icon: "🧠" },
    { name: "Notion", icon: "📝" },
    { name: "Slack", icon: "💬" },
    { name: "GitHub", icon: "👨‍💻" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.2 }}
      className="brand-carousel justify-center mt-12"
    >
      {brands.map((brand, index) => (
        <motion.div
          key={brand.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
          className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors"
        >
          <span className="text-lg">{brand.icon}</span>
          <span className="text-sm font-medium">{brand.name}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Tool integration showcase
const ToolShowcase = () => {
  const tools = [
    { name: "AI Chat", icon: "💬", status: "active" },
    { name: "Task Automation", icon: "⚡", status: "active" },
    { name: "Analytics", icon: "📊", status: "active" },
    { name: "Integrations", icon: "🔗", status: "active" },
    { name: "Mobile App", icon: "📱", status: "coming" },
    { name: "API Access", icon: "🔧", status: "coming" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="tool-grid"
    >
      {tools.map((tool, index) => (
        <motion.div
          key={tool.name}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="tool-item group"
        >
          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
            {tool.icon}
          </div>
          <div className="text-xs font-medium text-white/70 text-center">
            {tool.name}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${
            tool.status === 'active' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {tool.status}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default function ModernHomePage() {
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoaded || !mounted) {
    return (
      <div className="min-h-screen dark-gradient-bg noise-texture flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div 
            className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-white/60 font-geist-mono text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            initializing...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-gradient-bg noise-texture text-white overflow-x-hidden relative">
      
      {/* Modern Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark-modern border-b border-precise">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center"
            >
              <Link href="/" className="flex items-center space-x-3">
                <Image 
                  src="/teyra-logo-64kb.png" 
                  alt="Teyra" 
                  width={28} 
                  height={28}
                  className="w-7 h-7"
                />
                <span className="text-lg font-semibold text-white tracking-tight">teyra</span>
              </Link>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center space-x-4"
            >
              {isLoaded && user ? (
                <>
                  <Link href="/sustainability">
                    <Button variant="ghost" className="btn-modern">
                      sustainability
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="btn-modern">
                      dashboard
                    </Button>
                  </Link>
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 border border-white/20"
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <Link href="/sustainability">
                    <Button variant="ghost" className="btn-modern">
                      sustainability
                    </Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button variant="ghost" className="btn-modern">
                      sign in
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="btn-primary-modern">
                      get started
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Siden.ai Inspired */}
      <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto w-full">
          <div className="asymmetric-grid">
            
            {/* Left Side - Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              
              {/* Status Indicator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center gap-3 text-sm text-white/60"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-geist-mono">system status: online</span>
                <div className="w-px h-4 bg-white/20 mx-2"></div>
                <span className="font-geist-mono">productivity: evolving</span>
              </motion.div>

              {/* Main Hero Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-4"
              >
                <h1 className="hero-title">
                  <span className="block">productivity</span>
                  <span className="block">
                    is{' '}
                    <FlipWords 
                      words={["broken", "overwhelming", "guilt-inducing", "dehumanizing"]}
                      className="text-red-400"
                    />
                  </span>
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="hero-subtitle max-w-xl"
              >
                {user ? (
                  "welcome back! ready to continue your mindful productivity journey?"
                ) : (
                  <>
                    so we rebuilt it with <span className="text-green-400 font-medium">empathy</span>,{' '}
                    <span className="text-blue-400 font-medium">intelligence</span>, and{' '}
                    <span className="text-purple-400 font-medium">sustainability</span>
                  </>
                )}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                {isLoaded && user ? (
                  <Button 
                    size="lg" 
                    asChild
                    className="btn-primary-modern px-8 py-4 text-base font-medium"
                  >
                    <Link href="/dashboard" className="flex items-center gap-2">
                      open dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      asChild
                      className="btn-primary-modern px-8 py-4 text-base font-medium"
                    >
                      <Link href="/sign-up" className="flex items-center gap-2">
                        start free trial
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      asChild
                      className="btn-modern px-8 py-4 text-base"
                    >
                      <Link href="/sign-in">sign in</Link>
                    </Button>
                  </>
                )}
              </motion.div>

              {/* Status Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="flex items-center gap-6 text-xs text-white/50 pt-6"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span className="font-geist-mono">10k+ users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span className="font-geist-mono">ai-powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <span className="font-geist-mono">emotionally aware</span>
                </div>
              </motion.div>

            </motion.div>

            {/* Right Side - Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="relative"
            >
              {/* Main Demo Container */}
              <div className="glass-dark-modern rounded-xl p-6 relative overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="text-xs text-white/40 font-geist-mono">teyra v3.0</div>
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
                      <div className="text-white/40 font-geist-mono uppercase tracking-wide mb-1">empathy</div>
                      <div className="text-white font-medium">exceptional</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white/40 font-geist-mono uppercase tracking-wide mb-1">patience</div>
                      <div className="text-white font-medium">∞</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white/40 font-geist-mono uppercase tracking-wide mb-1">ai level</div>
                      <div className="text-white font-medium">adaptive</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-white/40 font-geist-mono uppercase tracking-wide mb-1">judgment</div>
                      <div className="text-white font-medium">zero</div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Status Indicators */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute -top-2 -right-2 bg-green-500 text-black px-2 py-1 rounded-md text-xs font-medium"
                >
                  online
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
                  className="absolute -bottom-2 -left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium"
                >
                  learning
                </motion.div>
              </div>
            </motion.div>

          </div>

          {/* Brand Carousel */}
          <BrandCarousel />

        </div>
      </section>

      {/* Tool Integration Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-white">
              comprehensive integration
            </h2>
            <p className="hero-subtitle max-w-2xl mx-auto">
              seamlessly connect with your existing workflow
            </p>
          </motion.div>

          <ToolShowcase />
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
              built for <span className="text-green-400">humans</span>
            </h2>
            <p className="hero-subtitle max-w-2xl mx-auto">
              productivity that adapts to your emotional and cognitive needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "emotional intelligence",
                description: "understands your mood and adapts accordingly"
              },
              {
                icon: Shield,
                title: "burnout prevention",
                description: "built-in safeguards for your mental health"
              },
              {
                icon: Sparkles,
                title: "sustainable growth",
                description: "focuses on long-term habits over quick fixes"
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
              ready to transform productivity?
            </h2>
            <p className="hero-subtitle mb-8 max-w-2xl mx-auto">
              join thousands who've discovered sustainable, empathetic productivity
            </p>
            
            <Button 
              size="lg"
              className="btn-primary-modern px-12 py-6 text-lg font-medium"
              asChild
            >
              <Link href={isLoaded && user ? '/dashboard' : '/sign-up'}>
                <span className="flex items-center gap-2">
                  {isLoaded && user ? 'continue journey' : 'start free trial'}
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Link>
            </Button>
            <p className="text-xs text-white/40 mt-4 font-geist-mono">
              {isLoaded && user ? 'your productivity companion awaits' : 'no credit card required'}
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