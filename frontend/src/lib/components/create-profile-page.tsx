"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format, startOfToday } from "date-fns";
import { ProfileSelectionItem } from "./ProfileSelectionItem";

// Define options arrays (ensure these are correctly defined as before)
const lifestyleOptions = [
  { value: "mostly_at_home_student", label: "Mostly at home / student", icon: "🛋️" },
  { value: "always_on_the_go_commuting", label: "Always on the go / commuting a lot", icon: "🚗" },
  { value: "office_workplace_every_day", label: "Office / workplace every day", icon: "🧑‍💼" },
  { value: "remote_hybrid_worker", label: "Remote or hybrid worker", icon: "🏠" },
  { value: "outdoor_active_lifestyle", label: "Outdoor / active lifestyle", icon: "🌳" },
];

const sustainabilityFocusOptions = [
  { value: "eating_sustainably", label: "Eating more sustainably", icon: "🥗" },
  { value: "reducing_plastic_use", label: "Reducing plastic use", icon: "🧴" },
  { value: "saving_energy", label: "Saving energy", icon: "⚡" },
  { value: "transportation_impact", label: "Transportation impact", icon: "🚲" },
  { value: "eco_friendly_shopping", label: "Eco-friendly shopping", icon: "🛍️" },
];

const sustainabilityKnowledgeOptions = [
  { value: "just_getting_started", label: "Just getting started", icon: "🐣" },
  { value: "know_the_basics", label: "I know the basics", icon: "🌱" },
  { value: "pretty_knowledgeable", label: "Pretty knowledgeable", icon: "🌿" },
  { value: "sustainability_guru", label: "Basically a sustainability guru", icon: "🌳" },
];

const climateChallengesOptions = [
  { value: "heatwaves_fires", label: "Heatwaves or fires", icon: "🔥" },
  { value: "water_shortages", label: "Water shortages", icon: "💧" },
  { value: "flooding", label: "Flooding", icon: "🌊" },
  { value: "cold_winters", label: "Cold winters", icon: "❄️" },
  { value: "not_sure", label: "Not sure", icon: "🤷‍♂️" },
];

export function CreateProfilePage() {
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [sustainabilityFocus, setSustainabilityFocus] = useState<string[]>([]); // Initialize as empty array
  const [sustainabilityKnowledge, setSustainabilityKnowledge] = useState("");
  const [climateChallenges, setClimateChallenges] = useState<string[]>([]); // Initialize as empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check for existing profile on component mount using useEffect
  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component
    const checkExistingProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('user_id') // Check if the row exists
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle(); // Use maybeSingle to handle 0 or 1 row without erroring
            
          // Log result for debugging
          console.log('Mount check - Existing profile:', profile, 'Error:', error);

          if (profile && isMounted) {
            console.log('Mount check - Profile exists, redirecting...');
            router.push('/dashboard'); // Redirect immediately if profile found
          } else if (error && isMounted) {
              console.error('Mount check - Error checking profile:', error);
          }
        } else if (!user && isMounted) {
             // If no user somehow, redirect to login
             router.push('/login');
        }
      } catch (err) {
          if (isMounted) console.error('Mount check - Unexpected error:', err);
      } 
    };
    checkExistingProfile();
    
    return () => { isMounted = false; }; // Cleanup function
  }, [router]);

  // Handler for multi-select fields
  const handleMultiSelectChange = (
    currentValues: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    valueToToggle: string
  ) => {
    if (currentValues.includes(valueToToggle)) {
      setter(currentValues.filter((item) => item !== valueToToggle));
    } else {
      setter([...currentValues, valueToToggle]);
    }
  };

  const handleProfileCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!fullName || !bio || !lifestyle || sustainabilityFocus.length === 0 || !sustainabilityKnowledge || climateChallenges.length === 0) {
      setError("Please fill out all fields and make at least one selection for focus and challenges.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Define the profile data object to be inserted
      const profileToInsert = {
        user_id: user.id,
        email: user.email,
        full_name: fullName,  
        bio: bio,             
        lifestyle: lifestyle,
        sustainability_focus: sustainabilityFocus,
        sustainability_knowledge: sustainabilityKnowledge,
        climate_challenges: climateChallenges,
        total_eco_score: 0,
      };

      const { error: profileError } = await supabase
        .from('profiles') 
        .insert(profileToInsert);

      if (profileError) {
        console.error("Supabase profile insert error:", profileError);
        const detailedError = profileError.message || JSON.stringify(profileError);
        setError(`Insert failed: ${detailedError}.`); 
        return; 
      }

      // +++ Invoke Edge Function to generate initial tasks (non-blocking) +++
      console.log(`Invoking task generation function for user: ${user.id} with full profile data.`);
      const localTodayDateString = format(startOfToday(), 'yyyy-MM-dd');
      
      supabase.functions.invoke('generate-daily-tasks', { 
        body: { 
          user_id: user.id, 
          assigned_date: localTodayDateString,
          profile: profileToInsert // Pass the entire profile object
        }, 
      }).then(({ data, error }) => {
        if (error) {
          console.error("Error invoking task generation function (non-blocking):", error);
        } else {
          console.log("Task generation function invoked successfully (non-blocking):", data);
        }
      });
      // +++ End Function Invocation +++

      console.log("Profile insert successful, proceeding to redirect immediately...");
      // Redirect happens immediately after triggering the function
      router.push('/dashboard?welcome=true');

    } catch (err) {
      console.error("Caught profile creation error:", err);
      setError(err instanceof Error ? err.message : "An error occurred while creating your profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-2">
          <form onSubmit={handleProfileCreation}>
            <CardHeader className="space-y-3 pb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardTitle className="text-3xl font-bold text-center">Create Your Profile</CardTitle>
                <CardDescription className="text-center pt-2">
                  Tell us a bit about yourself to complete your account setup.
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    type="text" 
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required 
                    className="h-12 bg-[#000000] border-neutral-800 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input 
                    id="bio" 
                    type="text"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    required 
                    className="h-12 bg-[#000000] border-neutral-800 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-8 pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1.5">
                      <Label className="text-base">How would you describe your current lifestyle?</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default text-neutral-400">(ⓘ)</span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-neutral-800 border-neutral-700 text-white max-w-xs">
                          <p>This sets a baseline and filters task difficulty.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2 pt-1">
                      {lifestyleOptions.map((option) => (
                        <ProfileSelectionItem
                          key={option.value}
                          value={option.value}
                          label={option.label}
                          icon={option.icon}
                          isSelected={lifestyle === option.value}
                          onSelect={setLifestyle}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1.5">
                      <Label className="text-base">Which of these areas do you care most about improving?</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default text-neutral-400">(ⓘ)</span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-neutral-800 border-neutral-700 text-white max-w-xs">
                          <p>This helps Teyra prioritize tasks by motivation.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-neutral-400 pl-1">(Select all that apply)</p>
                    <div className="space-y-2 pt-1">
                      {sustainabilityFocusOptions.map((option) => (
                        <ProfileSelectionItem
                          key={option.value}
                          value={option.value}
                          label={option.label}
                          icon={option.icon}
                          isSelected={sustainabilityFocus.includes(option.value)}
                          onSelect={(value) => handleMultiSelectChange(sustainabilityFocus, setSustainabilityFocus, value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1.5">
                      <Label className="text-base">How familiar are you with sustainability topics?</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default text-neutral-400">(ⓘ)</span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-neutral-800 border-neutral-700 text-white max-w-xs">
                          <p>Gives us a sense of whether to suggest beginner or advanced tasks.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2 pt-1">
                      {sustainabilityKnowledgeOptions.map((option) => (
                        <ProfileSelectionItem
                          key={option.value}
                          value={option.value}
                          label={option.label}
                          icon={option.icon}
                          isSelected={sustainabilityKnowledge === option.value}
                          onSelect={setSustainabilityKnowledge}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1.5">
                      <Label className="text-base">What climate-related challenges affect your area the most?</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default text-neutral-400">(ⓘ)</span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-neutral-800 border-neutral-700 text-white max-w-xs">
                          <p>So we can localize recommendations (e.g., water usage tips during droughts).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-neutral-400 pl-1">(Select all that apply)</p>
                    <div className="space-y-2 pt-1">
                      {climateChallengesOptions.map((option) => (
                        <ProfileSelectionItem
                          key={option.value}
                          value={option.value}
                          label={option.label}
                          icon={option.icon}
                          isSelected={climateChallenges.includes(option.value)}
                          onSelect={(value) => handleMultiSelectChange(climateChallenges, setClimateChallenges, value)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              {error && (
                <motion.div 
                  className="text-sm text-red-500 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-6 pt-6">
              <Button 
                className="w-full h-12 text-lg font-medium bg-emerald-700 hover:bg-emerald-600 focus:ring-emerald-500"
                type="submit" 
                disabled={loading || !fullName || !bio || !lifestyle || sustainabilityFocus.length === 0 || !sustainabilityKnowledge || climateChallenges.length === 0}
              >
                {loading ? "Creating profile..." : "Complete Profile"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
    </TooltipProvider>
  );
} 