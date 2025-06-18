"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar"; // Remove shadcn calendar
import CustomCalendar from "@/lib/components/custom-calendar"; // Import custom calendar
import WelcomeOverlay from "@/lib/components/welcome-overlay"; // Import WelcomeOverlay
import { useSearchParams } from 'next/navigation'; // Import hook
import { useState } from "react"; // Removed useEffect as it's not needed for this logic

export default function DashboardPage() {
  // const router = useRouter(); // No longer needed here
  const [canShowDashboardContent, setCanShowDashboardContent] = useState(false); // State for main content visibility
  const searchParams = useSearchParams(); // Get query params
  const showWelcome = searchParams.get('welcome') === 'true'; // Check for welcome flag

  // Faster Timings
  const LOGO_APPEAR_DURATION = 0.4;
  const CONTENT_FADE_DURATION = 0.3; // Make content fade faster

  // Logo Variants
  const logoVariants = {
    hidden: {
      opacity: 0,
      x: -10,
      y: -10,
      fontSize: '1.25rem', 
      top: '2rem',
      left: '2rem',
    },
    placed: {
      opacity: 1,
      fontSize: '1.25rem',
      top: '2rem',
      left: '2rem',
      x: '0%',
      y: '0%',
      transition: { duration: LOGO_APPEAR_DURATION, ease: "easeOut" }
    }
  };

  // Content Variants
  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: CONTENT_FADE_DURATION, ease: "easeOut" } // Use faster duration
    }
  };

  // Trigger content visibility when logo finishes OR welcome overlay fades
  const handleLogoAnimationComplete = (definition: string) => {
    // If the logo finishes AND we are NOT showing the welcome overlay, show content
    if (definition === "placed" && !showWelcome) { 
      console.log("Logo animation complete, showing dashboard content.");
      setCanShowDashboardContent(true);
    }
  };
  
  const handleWelcomeFadeComplete = () => {
      // If the welcome overlay finishes, show content
      console.log("Welcome faded, showing dashboard content.");
      setCanShowDashboardContent(true); 
  };

  return (
    // Remove the outer motion div for overall fade
    <div className="min-h-screen bg-black overflow-hidden relative p-4 md:p-8 flex flex-col">
      {/* Conditionally render Welcome Overlay - only if flag is set */}
      {showWelcome && <WelcomeOverlay onFadeComplete={handleWelcomeFadeComplete} />}

      {/* Logo appears directly in place */}
      <motion.h1 
        className="font-bold text-white tracking-tighter absolute whitespace-nowrap origin-bottom-left"
        style={{ top: '1.5rem', left: '1.5rem' }}
        initial="hidden"
        animate="placed"
        variants={logoVariants}
        onAnimationComplete={handleLogoAnimationComplete} 
      >
        teyra
      </motion.h1>

      {/* Content fades in based on canShowDashboardContent state */}
      <motion.div 
        className="flex-grow flex flex-col items-center justify-center pt-16 md:pt-20"
        initial="hidden"
        animate={canShowDashboardContent ? "visible" : "hidden"} // Animate based on the state
        variants={contentVariants} // Uses the faster CONTENT_FADE_DURATION
      >
         {/* Custom Large Calendar */}
         <div className="w-full max-w-5xl">
           <CustomCalendar />
         </div>
         {/* Sign Out button was removed */}
      </motion.div>
    </div>
  );
} 