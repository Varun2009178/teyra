'use client';

import { useEffect, useState } from 'react';

export function MobileServiceWorker() {
  const [isMobile, setIsMobile] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileDevice = mobileRegex.test(userAgent.toLowerCase());
      const isMobileViewport = window.innerWidth < 1024; // Also consider viewport width
      
      return isMobileDevice || isMobileViewport;
    };

    const mobile = checkMobile();
    setIsMobile(mobile);

    // Only register service worker on mobile
    if (mobile && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      let dailyInterval: NodeJS.Timeout | null = null;
      
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });

          setIsRegistered(true);
          console.log('✅ Service Worker registered for mobile:', registration);

          // Auto-request notification permission after a short delay (user-friendly)
          if ('Notification' in window) {
            // Wait 2 seconds after page load to request permission (less intrusive)
            setTimeout(async () => {
              if (Notification.permission === 'default') {
                try {
                  const permission = await Notification.requestPermission();
                  console.log('Notification permission:', permission);
                  if (permission === 'granted') {
                    console.log('✅ Notification permission granted automatically');
                  }
                } catch (error) {
                  console.error('Error requesting notification permission:', error);
                }
              } else if (Notification.permission === 'granted') {
                console.log('✅ Notifications already granted');
              }
            }, 2000); // 2 second delay
          }

          // Register periodic background sync for daily checks (Chrome 80+)
          if ('periodicSync' in registration) {
            try {
              await (registration as any).periodicSync.register('check-tasks-daily', {
                minInterval: 24 * 60 * 60 * 1000 // Check once per day (24 hours)
              });
              console.log('✅ Daily periodic background sync registered');
            } catch (error) {
              console.log('⚠️ Periodic background sync not supported:', error);
              // Fallback: use regular background sync
              try {
                await registration.sync.register('daily-task-check');
                console.log('✅ Daily background sync registered (fallback)');
              } catch (syncError) {
                console.log('⚠️ Background sync also not supported:', syncError);
              }
            }
          } else {
            // Fallback: use regular background sync for daily checks
            try {
              await registration.sync.register('daily-task-check');
              console.log('✅ Daily background sync registered (fallback)');
            } catch (error) {
              console.log('⚠️ Background sync not supported:', error);
            }
          }

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', async (event) => {
            if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
              console.log('📱 Received notification trigger from:', event.data.source);
            }
            
            // Handle task fetching request from service worker
            if (event.data && event.data.type === 'GET_TASKS_FOR_NOTIFICATION') {
              try {
                const response = await fetch('/api/tasks');
                if (response.ok) {
                  const tasks = await response.json();
                  // Send tasks back to service worker
                  if (registration.active) {
                    registration.active.postMessage({
                      type: 'TASKS_RESPONSE',
                      tasks: tasks
                    });
                  }
                }
              } catch (error) {
                console.error('Error fetching tasks for notification:', error);
              }
            }
            
            // Handle notification date storage
            if (event.data && event.data.type === 'SET_NOTIFICATION_DATE') {
              try {
                localStorage.setItem('teyra_last_notification_date', event.data.date);
              } catch (error) {
                console.error('Error storing notification date:', error);
              }
            }
          });

          // Set up check interval - check every 2 hours for progressive notifications
          const checkProgressive = async () => {
            // Trigger sync to check tasks (will respect 2-hour minimum interval)
            try {
              await registration.sync.register('daily-task-check');
            } catch (error) {
              console.log('Could not register sync, checking directly...');
              // If sync not available, check directly
              const response = await fetch('/api/tasks');
              if (response.ok) {
                const tasks = await response.json();
                const incompleteTasks = tasks.filter((t: any) => !t.completed && !t.title.includes('[COMPLETED]'));
                
                if (incompleteTasks.length > 5 && registration.active) {
                  // Let service worker handle the progressive notification logic
                  registration.active.postMessage({
                    type: 'CHECK_AND_NOTIFY'
                  });
                }
              }
            }
          };
          
          // Check immediately and then set up interval (every 2 hours)
          checkProgressive();
          dailyInterval = setInterval(checkProgressive, 2 * 60 * 60 * 1000); // Check every 2 hours
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      };

      registerSW();
      
      // Return cleanup function
      return () => {
        if (dailyInterval) {
          clearInterval(dailyInterval);
        }
      };
    } else if (!mobile) {
      console.log('ℹ️ Desktop device detected - skipping service worker registration');
    }
  }, []);

  // Don't render anything - this is just for registration
  return null;
}

