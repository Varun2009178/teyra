'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

// This hook checks for any pending tasks stored in localStorage
// and attempts to submit them to the server
export function usePendingTasks() {
  const { getToken, userId } = useAuth();

  useEffect(() => {
    if (!userId) return;

    const submitPendingTasks = async () => {
      try {
        // Check if there are any pending tasks in localStorage
        const pendingTasksStr = localStorage.getItem('pendingTasks');
        if (!pendingTasksStr) return;

        const pendingTasks = JSON.parse(pendingTasksStr);
        if (!Array.isArray(pendingTasks) || pendingTasks.length === 0) return;

        console.log(`Found ${pendingTasks.length} pending tasks in localStorage`);

        // Filter tasks for this user
        const userTasks = pendingTasks.filter(task => task.userId === userId);
        if (userTasks.length === 0) return;

        console.log(`Submitting ${userTasks.length} pending tasks for user ${userId}`);

        // Get auth token
        const token = await getToken();

        // Submit each task
        for (const task of userTasks) {
          try {
            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ title: task.title })
            });

            if (response.ok) {
              console.log(`Successfully submitted pending task: ${task.title}`);
            } else {
              console.error(`Failed to submit pending task: ${task.title}`);
            }
          } catch (error) {
            console.error(`Error submitting pending task: ${task.title}`, error);
          }
        }

        // Remove the pending tasks for this user
        const remainingTasks = pendingTasks.filter(task => task.userId !== userId);
        if (remainingTasks.length > 0) {
          localStorage.setItem('pendingTasks', JSON.stringify(remainingTasks));
        } else {
          localStorage.removeItem('pendingTasks');
        }

        console.log('Pending tasks processed');
      } catch (error) {
        console.error('Error processing pending tasks:', error);
      }
    };

    // Submit pending tasks after a short delay to ensure the app is fully loaded
    const timer = setTimeout(submitPendingTasks, 3000);
    return () => clearTimeout(timer);
  }, [userId, getToken]);
}