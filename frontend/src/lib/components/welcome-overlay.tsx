'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface WelcomeOverlayProps {
  onFadeComplete: () => void;
}

const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onFadeComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [displayName, setDisplayName] = useState<string>('User');

  useEffect(() => {
    const fetchUserName = async () => {
      let finalName = 'User';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log("User object in WelcomeOverlay:", user);
        if (user) {
          console.log("User metadata:", user.user_metadata);
          console.log("User app_metadata:", user.app_metadata);
          
          // Priority 1a: Check user_metadata
          if (user.user_metadata?.username) {
            console.log("Found username in user_metadata:", user.user_metadata.username);
            finalName = user.user_metadata.username;
          }
          // Priority 1b: Check app_metadata if not found in user_metadata
          else if (user.app_metadata?.username) {
             console.log("Found username in app_metadata:", user.app_metadata.username); 
             finalName = user.app_metadata.username;
          } else {
            console.log("Username NOT found in metadata, checking profile...");
            // Priority 2: Try getting first name from profiles table
            const { data: profileDataArray, error: profileError } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', user.id)
              .limit(1); // Fetch max 1 row as an array

            const profileData = profileDataArray?.[0]; // Get the first element if the array exists
            
            // Check profileData based on the potentially undefined first element
            if (profileData?.full_name) {
               const firstName = profileData.full_name.split(' ')[0];
               if (firstName) finalName = firstName;
            } else if (!profileError || profileError?.code === 'PGRST116') { // Check profileError optional chaining
              // Priority 3: Fallback to email prefix if profile not found or no full name
              const emailName = user.email?.split('@')[0];
              if (emailName) finalName = emailName;
            } else {
              // Log unexpected profile errors
              console.error("Error fetching profile full_name:", profileError);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data for welcome message:", error);
      } finally {
         setDisplayName(finalName);
      }
    };
    fetchUserName();

    // Set timer to fade out
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFadeComplete}> 
      {isVisible && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 pointer-events-auto"
        >
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold text-white tracking-tight capitalize"
          >
            Welcome, {displayName}!
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeOverlay; 