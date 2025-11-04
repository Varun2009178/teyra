'use client';

import { useState } from 'react';

export default function AdminSyncUsersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const syncAllUsers = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/sync-all-users', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        console.log('✅ All users synced:', data);
      } else {
        const errorText = await response.text();
        setError(`Failed to sync: ${errorText}`);
        console.error('❌ Sync failed:', errorText);
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('❌ Network error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔧 Admin: Sync All Users</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Immediate User Sync</h2>
          <p className="text-gray-600 mb-6">
            This will immediately sync ALL users from Clerk to your Supabase database, including the 3 missing users.
            <br /><br />
            <strong>⚠️ Warning:</strong> This is a one-time operation to get all users synced up.
          </p>
          
          <button
            onClick={syncAllUsers}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isLoading ? '🔄 Syncing All Users...' : '🚨 SYNC ALL USERS NOW'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">❌ Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold mb-2">✅ Sync Completed</h3>
            <div className="space-y-2 text-green-700">
              <p><strong>Clerk Users:</strong> {result.stats.clerkUsers}</p>
              <p><strong>Supabase Users:</strong> {result.stats.supabaseUsers}</p>
              <p><strong>Newly Synced:</strong> {result.stats.newlySynced}</p>
              <p><strong>Already Existed:</strong> {result.stats.alreadyExisted}</p>
              <p><strong>Errors:</strong> {result.stats.errors}</p>
            </div>
            {result.stats.clerkUsers === result.stats.supabaseUsers && (
              <p className="text-green-600 font-semibold mt-3">
                🎉 Perfect! All users are now synced!
              </p>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-blue-800 font-semibold mb-2">📋 What This Does</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Gets ALL users from Clerk (should be 34)</li>
            <li>• Creates missing users in Supabase (should be 3 new ones)</li>
            <li>• Sets up user_progress, user_ai_patterns, and user_behavior</li>
            <li>• Ensures all 34 users are ready in Supabase</li>
            <li>• When they log in, they'll have clean dashboard accounts</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="text-yellow-800 font-semibold mb-2">⚠️ Important Notes</h3>
          <ul className="text-yellow-700 space-y-1 text-sm">
            <li>• This is a one-time operation</li>
            <li>• Existing users won't be affected</li>
            <li>• New users will get full AI setup</li>
            <li>• After this, the automatic sync will handle future users</li>
          </ul>
        </div>
      </div>
    </div>
  );
}



