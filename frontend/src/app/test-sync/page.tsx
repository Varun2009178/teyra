'use client';

import { useState } from 'react';

export default function TestSyncPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const syncUsers = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/sync-users', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        console.log('✅ Sync completed:', data);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Test User Sync</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Check Database Status</h2>
          <p className="text-gray-600 mb-6">
            This will check your current Supabase database status and user counts.
          </p>
          
          <button
            onClick={syncUsers}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? '🔄 Checking...' : '🔍 Check Database Status'}
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
            <h3 className="text-green-800 font-semibold mb-2">✅ Database Status</h3>
            <div className="space-y-2 text-green-700">
              <p><strong>User Progress Table:</strong> {result.stats.userProgressCount} users</p>
              <p><strong>AI Patterns Table:</strong> {result.stats.aiPatternsCount} users</p>
              <p><strong>Behavior Table:</strong> {result.stats.behaviorCount} users</p>
            </div>
            {result.note && (
              <p className="text-blue-600 font-semibold mt-3">
                ℹ️ {result.note}
              </p>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-blue-800 font-semibold mb-2">📋 What This Does</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Finds all users in Clerk</li>
            <li>• Creates missing users in Supabase tables</li>
            <li>• Sets up user_progress and user_ai_patterns</li>
            <li>• Fixes user count mismatches</li>
            <li>• Ensures your cron job works properly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
