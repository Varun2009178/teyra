'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';
import { User as AuthUser } from '@supabase/supabase-js';
import { Loader2, Edit3 } from 'lucide-react';

interface ProfileData {
  full_name?: string;
  bio?: string;
  email?: string;
  avatar_url?: string | null;
}

const getInitials = (name?: string): string => {
  if (!name) return 'U';
  const names = name.trim().split(' ');
  if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
  return (names[0][0]?.toUpperCase() || '') + (names[names.length - 1][0]?.toUpperCase() || '');
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          if (isMounted) router.push('/login');
          return;
        }
        if (isMounted) setUser(authUser);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, bio, email')
          .eq('user_id', authUser.id)
          .single();

        if (isMounted) {
          if (profileError) {
            if (profileError.code === 'PGRST116') {
              console.warn('Profile not found for user:', authUser.id);
              setProfile({ email: authUser.email });
              setAvatarUrl(null);
            } else {
              throw profileError;
            }
          } else {
            setProfile(profileData);
            setAvatarUrl(null);
          }
        }

      } catch (err) {
        console.error("Error fetching profile:", err);
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [router]);

  const handleSignOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (!signOutError) {
      router.push('/');
    } else {
      console.error("Sign out error:", signOutError);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    alert("Avatar upload functionality not yet implemented.");
    if (event.target) event.target.value = '';
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 md:p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center md:text-left">Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-2 border-neutral-700">
              <AvatarImage src={avatarUrl ?? undefined} alt="User avatar" />
              <AvatarFallback className="bg-neutral-800 text-neutral-400 text-4xl md:text-5xl">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              id="avatar-upload"
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={handleAvatarUpload}
            />
            <Button
              variant="outline"
              className="w-full border-neutral-700 hover:bg-neutral-800 text-sm"
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              <Edit3 className="mr-2 h-4 w-4" /> Change Photo
            </Button>
          </div>

          <div className="md:col-span-2">
            <Card className="bg-[#111111] border-neutral-800 text-white">
              <CardHeader>
                <CardTitle className="text-2xl">Your Information</CardTitle>
                <CardDescription className="text-neutral-400">
                  View and manage your profile details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {profile ? (
                  <>
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                      <span className="text-sm font-medium text-neutral-400">Full Name</span>
                      <span className="text-sm text-neutral-100">{profile.full_name || <i className="text-neutral-500">Not set</i>}</span>
                    </div>
                    <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
                      <span className="text-sm font-medium text-neutral-400 flex-shrink-0 mr-4">Bio</span>
                      <span className="text-sm text-neutral-100 text-right">{profile.bio || <i className="text-neutral-500">Not set</i>}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-400">Email</span>
                      <span className="text-sm text-neutral-100">{profile.email || <i className="text-neutral-500">Not available</i>}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-neutral-500">Profile details could not be loaded.</p>
                )}
              </CardContent>
            </Card>

            <div className="mt-6">
              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="w-full bg-red-800 hover:bg-red-700 text-white font-medium"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 