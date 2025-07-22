"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TestDBPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, data?: any) => {
    setResults(prev => [...prev, { message, data, timestamp: new Date().toISOString() }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      addResult('🔄 Testing database connection...');
      
      const response = await fetch('/api/test-db');
      const result = await response.json();

      if (result.success) {
        addResult('✅ Database connection successful:', result);
        toast.success('Database connected!');
      } else {
        addResult('❌ Database connection failed:', result);
        toast.error('Database connection failed');
      }
    } catch (error) {
      addResult('❌ Exception in database test:', error);
      toast.error('Exception occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Database Test Page</h1>
          <p className="text-gray-600 mb-6">
            This page tests the database connection to ensure everything works correctly 
            with Drizzle ORM and Neon database.
          </p>

          <div className="flex gap-3 mb-6">
            <Button 
              onClick={testDatabaseConnection} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              Test Database Connection
            </Button>
            <Button 
              onClick={clearResults} 
              disabled={loading}
              variant="outline"
            >
              Clear Results
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500">No test results yet. Run the database test above!</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{result.message}</p>
                      {result.data && (
                        <pre className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 