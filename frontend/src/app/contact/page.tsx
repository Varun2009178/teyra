'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center pt-24 pb-12">
        <div className="w-full max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-black mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions, feedback, or just want to say hello? We'd love to hear from you!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* What We Do */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  What We Do
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Our Mission</h3>
                  <p className="text-gray-600">
                    We're building the world's most <span className="text-red-600 font-semibold">intelligent</span> and <span className="text-red-600 font-semibold">empathetic</span> productivity companion. Teyra uses advanced <span className="text-red-600 font-semibold">AI</span> to understand your unique workflow and provide personalized motivation and support.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">How It Works</h3>
                  <p className="text-gray-600">
                    Simply add your tasks and let <span className="text-red-600 font-semibold">Mike the Cactus</span> guide you through your productivity journey. Our <span className="text-red-600 font-semibold">AI</span> learns your patterns and adapts to help you achieve more than you ever thought possible.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Why Teyra?</h3>
                  <p className="text-gray-600">
                    Unlike other productivity tools, Teyra focuses on <span className="text-red-600 font-semibold">emotional intelligence</span> and <span className="text-red-600 font-semibold">personal growth</span>. We believe productivity isn't just about getting things done—it's about becoming the best version of yourself.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Mail className="w-6 h-6" />
                    Contact Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">Get in Touch</h3>
                    <p className="text-gray-600">
                      If you have any <span className="text-red-600 font-semibold">questions</span>, <span className="text-red-600 font-semibold">criticisms</span>, or <span className="text-red-600 font-semibold">concerns</span>, email us at:
                    </p>
                    <p className="text-lg font-semibold text-red-600">
                      greenteyra@gmail.com
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">Response Time</h3>
                    <p className="text-gray-600">We typically respond within 24 hours</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">Feedback Welcome</h3>
                    <p className="text-gray-600">
                      We love hearing from our users! Your feedback helps us make Teyra even better. Whether it's a <span className="text-red-600 font-semibold">bug report</span>, <span className="text-red-600 font-semibold">feature request</span>, or just a <span className="text-red-600 font-semibold">hello</span>, we're here to listen.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">How does Teyra work?</h4>
                    <p className="text-gray-600 text-sm">
                      Teyra uses <span className="text-red-600 font-semibold">AI</span> to help you break down tasks and stay motivated. Just add your tasks and let <span className="text-red-600 font-semibold">Mike the Cactus</span> guide you through your productivity journey.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Is Teyra free?</h4>
                    <p className="text-gray-600 text-sm">
                      Yes! Teyra is completely <span className="text-red-600 font-semibold">free</span> to use. We believe productivity tools should be accessible to everyone.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Can I export my data?</h4>
                    <p className="text-gray-600 text-sm">
                      Currently, we're working on <span className="text-red-600 font-semibold">data export</span> features. Your data is always yours and we're committed to making it easy to access.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 