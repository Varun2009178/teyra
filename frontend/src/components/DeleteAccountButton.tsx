"use client";

import { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cleanupUserDataClient } from '@/lib/hybrid-db';

export function DeleteAccountButton() {
  const { user } = useClerk();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including:\n\n' +
      '• All your tasks\n' +
      '• Your progress and statistics\n' +
      '• Your mood check-in history\n' +
      '• All time completed tasks\n\n' +
      'This action is irreversible!'
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Clean up client-side data first
      cleanupUserDataClient(user.id);
      
      // Delete user data from the database
      try {
        const response = await fetch('/api/user/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('User data deleted from database successfully');
        } else {
          console.error('Failed to delete user data from database:', await response.text());
        }
      } catch (dbError) {
        console.error('Error deleting user data from database:', dbError);
      }
      
      // Delete the user account through Clerk
      await user.delete();
      
      toast.success('Account deleted successfully');
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      onClick={handleDeleteAccount}
      disabled={isDeleting}
      className="bg-red-600 hover:bg-red-700 text-white"
    >
      {isDeleting ? 'Deleting Account...' : 'Delete Account'}
    </Button>
  );
} 