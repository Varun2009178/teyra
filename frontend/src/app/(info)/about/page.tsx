'use client';

import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  const featureCardVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        ease: 'easeOut'
      }
    })
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-400 mb-4 tracking-tight">
          The Teyra Philosophy
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 max-w-3xl mx-auto">
          We believe that the discipline to improve yourself is the same discipline that can improve the world.
        </p>
      </motion.div>

      <motion.div
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mt-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Step 1 */}
        <motion.div custom={0} variants={featureCardVariant} className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center h-24 w-24 rounded-full bg-neutral-800 border border-neutral-700 mb-6">
            <Image src="/icons/leaf.svg" alt="Leaf Icon" width={48} height={48} />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">Start Small.</h3>
          <p className="text-neutral-400 leading-relaxed">Complete one simple, eco-friendly task each day.</p>
        </motion.div>

        {/* Step 2 */}
        <motion.div custom={1} variants={featureCardVariant} className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center h-24 w-24 rounded-full bg-neutral-800 border border-neutral-700 mb-6">
            <Image src="/icons/sprout.svg" alt="Sprout Icon" width={48} height={48} />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">Build Consistency.</h3>
          <p className="text-neutral-400 leading-relaxed">Turn daily actions into effortless habits.</p>
        </motion.div>

        {/* Step 3 */}
        <motion.div custom={2} variants={featureCardVariant} className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center h-24 w-24 rounded-full bg-neutral-800 border border-neutral-700 mb-6">
            <Image src="/icons/sun.svg" alt="Sun Icon" width={48} height={48} />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">Unlock Motivation.</h3>
          <p className="text-neutral-400 leading-relaxed">The discipline you build here applies everywhere.</p>
        </motion.div>
      </motion.div>
    </div>
  );
} 