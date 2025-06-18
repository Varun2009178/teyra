'use client';

import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  return (
    // Remove min-h-screen, bg-black, text-white from here as layout handles it.
    // Adjust pt-20 from original to something like py-12 or py-16 to account for navbar.
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl bg-[#111111] border border-neutral-800 rounded-lg p-8 md:p-12 shadow-xl text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-sky-400 mb-8 tracking-tight">
          Contact Us
        </h1>
        
        <div className="space-y-6 text-neutral-300 text-lg leading-relaxed">
          <p>
            Have questions, feedback, or just want to say hello?
          </p>
          <p>
            We'd love to hear from you! Please reach out to us at:
          </p>
          <a 
            href="mailto:greenteyra@gmail.com" 
            className="inline-flex items-center justify-center text-xl font-semibold text-sky-300 hover:text-sky-200 transition-colors duration-150 group mt-4"
          >
            <Mail className="mr-3 h-6 w-6 text-sky-400 group-hover:text-sky-300 transition-colors duration-150" />
            greenteyra@gmail.com
          </a>
        </div>

        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link href="/" className="inline-flex items-center px-6 py-2 border border-sky-600 text-sky-400 hover:bg-sky-700 hover:text-white font-semibold rounded-full transition-colors duration-150 shadow-md">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
} 