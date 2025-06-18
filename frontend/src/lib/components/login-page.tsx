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
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = 'hidden';
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <motion.div 
        className="relative w-full max-w-sm"
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
          <form onSubmit={handleLogin}>
            <CardHeader className="space-y-3 pb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardTitle className="text-3xl font-bold text-center">Login</CardTitle>
                <CardDescription className="text-center pt-2">
                  Enter your email and password below to login to your account.
                </CardDescription>
              </motion.div>
              {message && (
                <div className="mt-2 text-sm text-green-500 text-center">
                  {message}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
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
                disabled={loading}
              >
                {loading ? "Logging In..." : "Log In"}
              </Button>
              <div className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="underline font-medium">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
} 