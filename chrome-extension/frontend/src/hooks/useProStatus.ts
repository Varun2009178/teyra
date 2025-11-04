import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export function useProStatus() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const checkProStatus = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/subscription/status', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setIsPro(data.isPro || false);
        }
      } catch (error) {
        console.error('Error checking Pro status:', error);
        setIsPro(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkProStatus();
  }, [getToken]);

  return { isPro, isLoading };
}
