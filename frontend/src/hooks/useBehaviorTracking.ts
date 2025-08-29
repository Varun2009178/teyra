import { useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';

interface BehaviorEvent {
  event_type: 'task_created' | 'task_completed' | 'task_deleted' | 'task_skipped' | 
              'mood_selected' | 'session_start' | 'session_end' | 'notification_clicked' |
              'daily_reset' | 'milestone_achieved';
  event_data?: any;
  task_id?: number;
  mood?: string;
  completion_time?: Date;
  device_type?: string;
}

export function useBehaviorTracking() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const trackEvent = useCallback(async (event: BehaviorEvent) => {
    if (!user?.id) return;

    try {
      const token = await getToken();
      const now = new Date();
      
      const response = await fetch('/api/user-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...event,
          time_of_day: now.getHours(),
          device_type: getDeviceType(),
          completion_time: event.completion_time?.toISOString()
        })
      });

      if (!response.ok) {
        // Handle 404 - endpoint doesn't exist
        if (response.status === 404) {
          if (!localStorage.getItem('behavior_endpoint_missing_warned')) {
            console.info('Behavior tracking endpoint not available');
            localStorage.setItem('behavior_endpoint_missing_warned', 'true');
          }
          return;
        }
        
        const errorText = await response.text();
        
        // Only log setup errors once
        if (response.status === 503 && errorText.includes('setupRequired')) {
          if (!localStorage.getItem('behavior_setup_warning_shown')) {
            console.warn('⚠️ AI behavior tracking not set up. Run: npx tsx scripts/setup-ai-system.ts');
            localStorage.setItem('behavior_setup_warning_shown', 'true');
          }
        } else {
          console.warn('Failed to track behavior event:', errorText);
        }
      }
    } catch (error) {
      // Silently handle network errors for behavior tracking
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (!localStorage.getItem('behavior_network_error_warned')) {
          console.info('Behavior tracking temporarily unavailable');
          localStorage.setItem('behavior_network_error_warned', 'true');
        }
      } else {
        console.warn('Error tracking behavior event:', error);
      }
    }
  }, [user?.id, getToken]);

  const trackTaskCreated = useCallback((taskTitle: string, taskId?: number) => {
    trackEvent({
      event_type: 'task_created',
      event_data: { title: taskTitle },
      task_id: taskId
    });
  }, [trackEvent]);

  const trackTaskCompleted = useCallback((taskTitle: string, taskId: number, startTime?: Date) => {
    trackEvent({
      event_type: 'task_completed',
      event_data: { title: taskTitle },
      task_id: taskId,
      completion_time: startTime ? new Date() : undefined
    });
  }, [trackEvent]);

  const trackTaskDeleted = useCallback((taskTitle: string, taskId: number) => {
    trackEvent({
      event_type: 'task_deleted',
      event_data: { title: taskTitle },
      task_id: taskId
    });
  }, [trackEvent]);

  const trackMoodSelected = useCallback((mood: string, moodData?: any) => {
    trackEvent({
      event_type: 'mood_selected',
      mood,
      event_data: moodData
    });
  }, [trackEvent]);

  const trackSessionStart = useCallback(() => {
    trackEvent({
      event_type: 'session_start',
      event_data: { timestamp: new Date().toISOString() }
    });
  }, [trackEvent]);

  const trackSessionEnd = useCallback((sessionDuration?: number) => {
    trackEvent({
      event_type: 'session_end',
      event_data: { 
        timestamp: new Date().toISOString(),
        duration_seconds: sessionDuration 
      }
    });
  }, [trackEvent]);

  const trackNotificationClicked = useCallback((notificationType: string) => {
    trackEvent({
      event_type: 'notification_clicked',
      event_data: { notification_type: notificationType }
    });
  }, [trackEvent]);

  const trackMilestoneAchieved = useCallback((milestone: string, points?: number) => {
    trackEvent({
      event_type: 'milestone_achieved',
      event_data: { milestone, points }
    });
  }, [trackEvent]);

  const trackDailyReset = useCallback((resetData: any) => {
    trackEvent({
      event_type: 'daily_reset',
      event_data: resetData
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackTaskCreated,
    trackTaskCompleted,
    trackTaskDeleted,
    trackMoodSelected,
    trackSessionStart,
    trackSessionEnd,
    trackNotificationClicked,
    trackMilestoneAchieved,
    trackDailyReset
  };
}
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
    return 'mobile';
  } else if (/tablet|ipad/.test(userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}
