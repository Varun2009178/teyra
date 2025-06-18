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
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthError } from '@supabase/supabase-js';

export function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = 'hidden';
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.user) {
        // In a production app, you need to guide the user to confirm their email.
        alert("Success! Please check your email for a confirmation link to activate your account.");
        // We don't redirect here. The user will be redirected from the link in their email.
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <motion.div 
        className="relative w-full max-w-sm mt-8 md:mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link 
          href="/" 
          className="absolute -top-16 left-0 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
        <Card className="border-2">
          <form onSubmit={handleSignUp}>
            <CardHeader className="space-y-3 pb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardTitle className="text-3xl font-bold text-center">Sign Up</CardTitle>
                <CardDescription className="text-center pt-2">
                  Enter your details below to create your account.
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
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="yourusername"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required 
                    className="h-12 bg-[#000000] border-neutral-800 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="h-12 bg-[#000000] border-neutral-800 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    className="h-12 bg-[#000000] border-neutral-800 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </motion.div>
              {error && (
                <motion.div 
                  className="text-sm text-red-500 text-center flex flex-col gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span>{error}</span>
                  {error.includes("already registered") && (
                    <Link href="/login" className="text-blue-500 hover:underline font-medium">
                      Click here to log in
                    </Link>
                  )}
                </motion.div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-6 pt-6">
              <Button 
                className="w-full h-12 text-lg font-medium bg-emerald-700 hover:bg-emerald-600 focus:ring-emerald-500"
                type="submit" 
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="underline font-medium">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

export default function Page() {
  return <SignupPage />;
} 