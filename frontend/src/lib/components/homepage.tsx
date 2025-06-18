"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";
import LandingNavbar from "./landing-navbar";
import Image from "next/image";

const HomePage = () => {

  // Animation variants for heading
  const headingVariant = {
    hidden: { opacity: 0, y: 50 }, // Increased y offset
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] } // Custom cubic bezier for impact
    }
  };
  
  // Animation variants for paragraph (staggered)
  const paragraphVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: 'easeOut', delay: 0.2 } // Delay after heading
    }
  };

  // --- NEW: Variants for small plants next to headings ---
  const plantVariantLeft = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.5, ease: 'easeOut', delay: 0.4 } // Delay to appear with/after heading
    }
  };

  const plantVariantRight = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.5, ease: 'easeOut', delay: 0.4 } // Delay to appear with/after heading
    }
  };
  // --- End Plant Variants ---

  // Variant for the final CTA
  const ctaVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    // Add padding-top to account for the fixed navbar height (h-16 = 4rem)
    <div className="min-h-[200vh] bg-black flex flex-col items-center relative overflow-x-hidden pt-16"> 
      <LandingNavbar />

      {/* --- Hero Section --- */}
      <div className="absolute inset-0 top-0 h-screen bg-[radial-gradient(circle_at_center,_rgba(55,55,55,0.1)_0%,_rgba(0,0,0,0)_100%)] pointer-events-none z-0" />
      <div className="flex flex-col items-center justify-center text-center h-[calc(85vh-4rem)] px-4 relative z-10 overflow-hidden"> {/* Reverted height and justification */}
          
          {/* Plant Images - REMOVED FROM HERE */}
          
          {/* Title */}
          <motion.h1 
            className="text-7xl md:text-9xl font-bold text-white tracking-tighter mb-4 [text-shadow:none] antialiased" // Reverted size, kept mb-4 from original
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Teyra
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            className="mt-0 text-xl md:text-2xl text-neutral-300 max-w-2xl leading-relaxed"
          >
            Motivational + Sustainable Software
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
            className="mt-4 text-lg md:text-xl text-neutral-400 max-w-2xl leading-relaxed"
          >
            Build consistency. Make an impact. One task a day.
          </motion.p>

          {/* Buttons */} 
          <motion.div 
            className="flex gap-6 mt-8" // Reverted class, removed pointer-events-auto
            initial={{ opacity: 0 }} // Reverted initial animation
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Link href="/signup" className="relative z-10">
              <Button className="bg-white text-black hover:bg-white/90">Get Started</Button>
            </Link>
            <Link href="/login" className="relative z-10">
              <Button className="bg-white/10 text-white hover:bg-white/20">Log In</Button>
            </Link>
          </motion.div>

          {/* --- NEW: Static Scroll Hint --- */}
          <motion.div 
            className="mt-6 text-sm text-neutral-500 tracking-wide" // Reverted class, removed pointer-events-auto
            initial={{ opacity: 0 }} // Reverted initial animation
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            scroll down to learn more
          </motion.div>
        </div>

      {/* --- Animated Scroll Section --- */}
      <div className="w-full max-w-4xl px-4 py-24 md:py-32 mt-16 space-y-24 md:space-y-36 relative z-10"> {/* Removed text-center from here to allow per-section alignment */} 
        
        {/* Block 1: Make It Easy */}
        <motion.div 
          className="flex flex-col items-center" // Centering the content block
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="max-w-xl text-center"> {/* Max width and text alignment for content */}
            {/* Container for heading and its accents, ensuring text is primary centered element */}
            <div className="relative flex items-center justify-center gap-x-3 md:gap-x-4 mb-5 md:mb-6">
              <motion.div variants={plantVariantLeft} className="absolute left-0 transform -translate-x-full mr-2 md:mr-3">
                <Image src="/vecteezy_green-leaves-plant-natural_54978575.png" alt="Green Leaf Accent" width={70} height={70} className="object-contain" />
              </motion.div>
              <motion.h2 
                  variants={headingVariant} 
                  className="text-5xl md:text-7xl font-bold text-emerald-500 tracking-tight mx-auto" // mx-auto to help center if flex parent is wider
              >
                Build Consistency.
              </motion.h2>
              {/* Placeholder for a potential right plant, maintains structure if needed but empty */}
              <div className="absolute right-0 transform translate-x-full ml-2 md:ml-3 w-[70px] h-[70px]"></div>
            </div>
            <motion.p 
                variants={paragraphVariant} 
                className="text-base md:text-lg text-neutral-300/90 font-light leading-relaxed tracking-wide"
            >
              Start with small, sustainable actions that build your discipline. One task a day to transform your habits and impact.
            </motion.p>
          </div>
        </motion.div>

        {/* Block 2: Make It Rewarding */}
         <motion.div 
            className="flex flex-col items-center" // Centering the content block
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }} 
          >
            <div className="max-w-xl text-center"> {/* Max width and text alignment for content */}
              {/* Container for heading and its accents */}
              <div className="relative flex items-center justify-center gap-x-3 md:gap-x-4 mb-5 md:mb-6">
                <motion.div variants={plantVariantLeft} className="absolute left-0 transform -translate-x-full mr-2 md:mr-3">
                  <Image src="/vecteezy_leaves-foliage-natural_54978579.png" alt="Foliage Accent Left" width={70} height={70} className="object-contain" />
                </motion.div>
                <motion.h2 
                    variants={headingVariant} 
                    className="text-5xl md:text-7xl font-bold text-sky-500 tracking-tight mx-auto"
                >
                   Track Progress.
                </motion.h2>
                <motion.div variants={plantVariantRight} className="absolute right-0 transform translate-x-full ml-2 md:ml-3">
                  <Image src="/vecteezy_express-your-lgbtq-identity-with-this-stunning-green_55668632.png" alt="Colorful Accent Right" width={70} height={70} className="object-contain" />
                </motion.div>
              </div>
              <motion.p 
                  variants={paragraphVariant} 
                   className="text-base md:text-lg text-neutral-300/90 font-light leading-relaxed tracking-wide"
              >
                 Watch your streaks grow and your impact multiply. Join a community that's building better habits together.
              </motion.p>
            </div>
        </motion.div>

        {/* Block 3: Make It Yours */}
         <motion.div 
            className="flex flex-col items-center" // Centering the content block
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="max-w-xl text-center"> {/* Max width and text alignment for content */}
              {/* Container for heading and its accents */}
              <div className="relative flex items-center justify-center gap-x-3 md:gap-x-4 mb-5 md:mb-6">
                 {/* Placeholder for a potential left plant */}
                <div className="absolute left-0 transform -translate-x-full mr-2 md:mr-3 w-[70px] h-[70px]"></div>
                <motion.h2 
                    variants={headingVariant} 
                     className="text-5xl md:text-7xl font-bold text-lime-500 tracking-tight mx-auto"
                >
                   Make It Yours.
                </motion.h2>
                <motion.div variants={plantVariantRight} className="absolute right-0 transform translate-x-full ml-2 md:ml-3">
                  <Image src="/vecteezy_green-leaves-plant-natural_54978575.png" alt="Green Leaf Accent Right" width={70} height={70} className="object-contain" />
                </motion.div>
              </div>
              <motion.p 
                  variants={paragraphVariant} 
                   className="text-base md:text-lg text-neutral-300/90 font-light leading-relaxed tracking-wide"
              >
                 Personalized tasks that fit your lifestyle and goals. Build the discipline that transforms all areas of your life.
              </motion.p>
            </div>
        </motion.div>

      </div>
      
       {/* --- Bottom CTA Section --- */}
       <motion.div 
         className="w-full max-w-xl text-center px-4 pt-16 pb-24 md:pb-32 relative z-10" // Padding and positioning
         variants={ctaVariant} // Use a specific variant for this
         initial="hidden"
         whileInView="visible"
         viewport={{ once: true, amount: 0.5 }} // Trigger when half is visible
       >
          <h3 className="text-3xl md:text-4xl font-semibold text-neutral-200 mb-4 tracking-tight">Ready to transform?</h3>
          <p className="text-neutral-400 text-md md:text-lg mb-8">Start your journey to better habits and a better world.</p>
          <Link href="/signup" className="inline-block">
             <Button className="bg-white text-black hover:bg-white/90 text-lg px-10 py-3.5">Get Started</Button> {/* Larger button */} 
          </Link>
       </motion.div>

      {/* Footer */}
       <motion.footer
        className="text-sm text-white/50 mt-auto pb-6 relative z-10" // Simple fade, ensure above gradient
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.5 }}
      >
        © {new Date().getFullYear()} Teyra. All rights reserved.
      </motion.footer>
    </div>
  );
};

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...props }) => {
  return (
    <button
      className={`px-6 py-2 rounded-md font-semibold transition-transform duration-200 ease-in-out transform hover:scale-105 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default HomePage;
