'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Recycle, Heart, Globe, TreePine, Sun, Droplets, Wind } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';

export default function SustainabilityPage() {
  const { user, isSignedIn } = useUser();
  
  return (
    <div className="min-h-screen dark-gradient-bg noise-texture text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark-modern border-b border-precise">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image 
                  src="/teyra-logo-64kb.png" 
                  alt="Teyra" 
                  width={32} 
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-white">teyra</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/contact">
                <Button variant="ghost" className="btn-modern">
                  contact
                </Button>
              </Link>
              {isSignedIn ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="btn-modern">
                      dashboard
                    </Button>
                  </Link>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 border border-white/20"
                      }
                    }}
                  />
                </>
              ) : (
                <>
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
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 lg:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-8">
              <Leaf className="w-12 h-12 text-green-600 mr-4" />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                Our Environmental
                <br />
                <span className="text-green-600">Commitment</span>
              </h1>
            </div>
            <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              At Teyra, we believe productivity and sustainability go hand in hand. 
              We're committed to helping you build better habits while caring for our planet.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">Our Values</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              We integrate environmental consciousness into every aspect of our platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full glass-dark-modern border-precise hover:bg-white/10 transition-colors">
                <CardHeader>
                  <Sun className="w-10 h-10 text-green-600 mb-4" />
                  <CardTitle className="text-white">Sustainable Task Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/60">
                    Mike the Cactus suggests eco-friendly alternatives and sustainable 
                    practices in your daily tasks and goal-setting.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full glass-dark-modern border-precise hover:bg-white/10 transition-colors">
                <CardHeader>
                  <Wind className="w-10 h-10 text-green-600 mb-4" />
                  <CardTitle className="text-white">Minimal AI Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/60">
                    We use AI thoughtfully and efficiently, only when it adds real value, 
                    reducing computational energy consumption.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="h-full glass-dark-modern border-precise hover:bg-white/10 transition-colors">
                <CardHeader>
                  <TreePine className="w-10 h-10 text-green-600 mb-4" />
                  <CardTitle className="text-white">Green Hosting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/60">
                    Our infrastructure runs on renewable energy sources and 
                    carbon-neutral hosting providers.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sustainable Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">Sustainable Features</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              How we integrate environmental awareness into your productivity journey
            </p>
          </motion.div>

          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              <div className="md:w-1/2">
                <div className="glass-dark-modern border-precise p-8 rounded-2xl">
                  <Recycle className="w-16 h-16 text-green-600 mb-4" />
                  <h3 className="text-2xl font-bold mb-4 text-white">Eco-Friendly Task Suggestions</h3>
                  <p className="text-white/60 leading-relaxed">
                    When you create tasks, Mike suggests sustainable alternatives. 
                    "Need to buy something? Let's explore eco-friendly options first!"
                  </p>
                </div>
              </div>
              <div className="md:w-1/2 space-y-4">
                <div className="glass-dark-modern border-precise p-4 rounded-lg border-l-4 border-green-400">
                  <p className="font-medium text-white">Instead of: "Buy new running shoes"</p>
                  <p className="text-green-400">Mike suggests: "Research sustainable athletic wear brands"</p>
                </div>
                <div className="glass-dark-modern border-precise p-4 rounded-lg border-l-4 border-green-400">
                  <p className="font-medium text-white">Instead of: "Print documents"</p>
                  <p className="text-green-400">Mike suggests: "Organize digital files for easy access"</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row-reverse items-center gap-8"
            >
              <div className="md:w-1/2">
                <div className="glass-dark-modern border-precise p-8 rounded-2xl">
                  <Globe className="w-16 h-16 text-blue-600 mb-4" />
                  <h3 className="text-2xl font-bold mb-4 text-white">Mindful AI Usage</h3>
                  <p className="text-white/60 leading-relaxed">
                    We only use AI when it genuinely improves your experience. 
                    Smart task splitting and mood recognition - not endless generation.
                  </p>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="glass-dark-modern border-precise p-6 rounded-lg">
                  <h4 className="font-bold mb-4 text-blue-400">Our AI Philosophy:</h4>
                  <ul className="space-y-2 text-white/60">
                    <li>✓ Efficient task breakdown when you're stuck</li>
                    <li>✓ Personalized mood-based suggestions</li>
                    <li>✓ Smart progress tracking</li>
                    <li>✗ No unnecessary content generation</li>
                    <li>✗ No energy-wasting features</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Environmental Impact */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-precise">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Droplets className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-white">Making a Difference Together</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">50%</div>
                <p className="text-white/60">Less AI computational energy than typical productivity apps</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
                <p className="text-white/60">Renewable energy powered infrastructure</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">🌱</div>
                <p className="text-white/60">Sustainable habits encouraged through Mike's guidance</p>
              </div>
            </div>

            <p className="text-lg text-white/60 mb-8 leading-relaxed">
              Every user who chooses Teyra joins a community committed to productive, 
              sustainable living. Together, we're proving that personal growth and 
              environmental care aren't just compatible - they're interconnected.
            </p>

            <Link href="/sign-up">
              <Button className="bg-green-500 hover:bg-green-600 text-black px-8 py-3 text-lg font-medium">
                Join Our Sustainable Community
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-precise">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Image 
              src="/teyra-logo-64kb.png" 
              alt="Teyra" 
              width={24} 
              height={24}
              className="w-6 h-6"
            />
            <span className="text-white/60">© 2024 Teyra. Sustainable productivity for everyone.</span>
          </div>
          <div className="flex space-x-6">
            <Link href="/contact" className="text-white/60 hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/" className="text-white/60 hover:text-white transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}