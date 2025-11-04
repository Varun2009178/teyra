'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfDay, addHours, isSameDay, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useProStatus } from '@/hooks/useProStatus';
import AIUpgradeModal from './AIUpgradeModal';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  source?: 'google' | 'teyra';
}

interface Task {
  id: string;
  title: string;
  scheduled_time?: string;
  duration_minutes?: number;
  completed?: boolean;
  google_event_id?: string;
}

export function CalendarView() {
  const router = useRouter();
  const { isPro } = useProStatus();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedTime, setSelectedTime] = useState<{ day: Date; hour: number } | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDuration, setNewEventDuration] = useState(60);
  const [selectedSlot, setSelectedSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [editScheduledTime, setEditScheduledTime] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: Task | null; googleEvent?: CalendarEvent } | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Check if mobile on mount
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasSeenWarning = localStorage.getItem('calendar-mobile-warning-seen');
    if (isMobile && !hasSeenWarning) {
      setShowMobileWarning(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  // Close context menu when clicking anywhere
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't close if clicking on the context menu itself
      if (!(e.target as HTMLElement).closest('.context-menu')) {
        setContextMenu(null);
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      // Prevent default context menu except on tasks
      if (!(e.target as HTMLElement).closest('.task-item')) {
        setContextMenu(null);
      }
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  async function loadData() {
    // Only show loading overlay on initial load
    if (isInitialLoad) {
      setIsLoading(true);
    }

    try {
      // Fetch Google Calendar events
      const eventsRes = await fetch(
        `/api/calendar/events?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`
      );
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }

      // Fetch Teyra tasks
      const tasksRes = await fetch('/api/tasks');
      if (tasksRes.ok) {
        const allTasks = await tasksRes.json(); // API returns array directly, not wrapped

        console.log('📋 Raw tasks from API:', allTasks);

        // Separate scheduled and unscheduled tasks
        // Don't filter out [COMPLETED] tasks as those are from previous resets
        const scheduled = allTasks.filter((t: Task) => t.scheduled_time);
        const unscheduled = allTasks.filter((t: Task) =>
          !t.scheduled_time &&
          !t.completed &&
          !t.title.includes('[COMPLETED]')
        );

        console.log('📋 Tasks loaded:', {
          total: allTasks.length,
          scheduled: scheduled.length,
          unscheduled: unscheduled.length,
          scheduledTasks: scheduled,
          unscheduledTasks: unscheduled
        });

        if (allTasks.length === 0) {
          console.warn('⚠️ No tasks found - check if user has created tasks');
        }

        setTasks(scheduled);
        setUnscheduledTasks(unscheduled);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Only show error toast on initial load to avoid spam
      if (isInitialLoad) {
        toast.error('Failed to load calendar data');
      }
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }

  async function scheduleTask(task: Task, day: Date, hour: number) {
    // Create a proper date with the correct timezone
    const scheduledTime = new Date(day);
    scheduledTime.setHours(hour, 0, 0, 0);

    try {
      console.log('📅 Scheduling task:', {
        task: task.title,
        taskId: task.id,
        day: format(day, 'yyyy-MM-dd'),
        hour: hour,
        scheduledTime: scheduledTime.toISOString(),
        localTime: format(scheduledTime, 'MMM d, yyyy h:mm a'),
        duration: task.duration_minutes || 60
      });

      // Update task with scheduled time
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_time: scheduledTime.toISOString(),
          duration_minutes: task.duration_minutes || 60
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to schedule task:', errorData);
        throw new Error(errorData.error || 'Failed to schedule task');
      }

      const updatedTask = await response.json();
      console.log('✅ Task scheduled successfully:', updatedTask);
      console.log('📍 Task should appear at:', format(scheduledTime, 'EEE MMM d, h:mm a'));

      // Verify the update actually worked
      if (updatedTask && updatedTask.scheduled_time) {
        console.log('✅ Server confirmed scheduled_time:', updatedTask.scheduled_time);
        // Immediately update local state to show task without waiting for reload
        setTasks(prev => [...prev, updatedTask]);
        setUnscheduledTasks(prev => prev.filter(t => t.id !== task.id));
      } else {
        console.error('❌ Server did not return scheduled_time!', updatedTask);
        throw new Error('Server failed to schedule task');
      }

      toast.success(`Task scheduled to ${format(scheduledTime, 'EEE h:mm a')}!`);

      // Sync to Google Calendar in the background (non-blocking)
      fetch('/api/calendar/sync-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          action: 'create'
        })
      }).then(syncResponse => {
        if (syncResponse.ok) {
          console.log('✅ Synced to Google Calendar');
          // Silently reload to get google_event_id
          loadData();
        } else {
          console.warn('⚠️ Failed to sync to Google Calendar');
        }
      }).catch(err => {
        console.warn('⚠️ Calendar sync error:', err);
      });
    } catch (error) {
      console.error('❌ Error scheduling task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to schedule task');
    }
  }

  async function createNewEvent() {
    if (!newEventTitle.trim() || !selectedSlot) return;

    try {
      const scheduledTime = new Date(selectedSlot.day);
      scheduledTime.setHours(selectedSlot.hour, 0, 0, 0);

      console.log('📅 Creating new event:', {
        title: newEventTitle.trim(),
        scheduled_time: scheduledTime.toISOString(),
        duration_minutes: newEventDuration
      });

      // Create a new task in Teyra
      const createResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          scheduled_time: scheduledTime.toISOString(),
          duration_minutes: newEventDuration
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('❌ Failed to create task:', errorData);
        throw new Error(errorData.error || 'Failed to create task');
      }

      const newTask = await createResponse.json();
      console.log('✅ Task created:', newTask);

      // Sync to Google Calendar
      console.log('🔄 Syncing to Google Calendar...');
      const syncResponse = await fetch('/api/calendar/sync-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: newTask.id,
          action: 'create'
        })
      });

      if (!syncResponse.ok) {
        console.warn('⚠️ Failed to sync to Google Calendar, but task was created');
      } else {
        console.log('✅ Synced to Google Calendar');
      }

      toast.success('Event created and synced to calendar!');
      setShowNewEventModal(false);
      setNewEventTitle('');
      setNewEventDuration(60);
      setSelectedSlot(null);
      loadData();
    } catch (error) {
      console.error('❌ Error creating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    }
  }

  function openNewEventModal(day: Date, hour: number) {
    // Check if trying to create event in the past
    const scheduledTime = new Date(day);
    scheduledTime.setHours(hour, 0, 0, 0);
    const now = new Date();

    if (scheduledTime < now) {
      toast.error('Cannot create events in the past. Please choose a future time.');
      return;
    }

    setSelectedSlot({ day, hour });
    setShowNewEventModal(true);
  }

  async function deleteTask(taskId: string) {
    // Prevent duplicate deletes
    if (deletingTasks.has(taskId)) {
      console.log(`⚠️ Task ${taskId} is already being deleted, skipping...`);
      return;
    }

    try {
      console.log(`🗑️ Deleting task ${taskId}...`);

      // Mark as deleting
      setDeletingTasks(prev => new Set(prev).add(taskId));

      // Immediately remove from local state first for instant feedback
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setUnscheduledTasks(prev => prev.filter(t => t.id !== taskId));

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      console.log(`✅ Task ${taskId} deleted successfully`);
      toast.success('Event deleted');

      // Remove from deleting set after successful delete
      setDeletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } catch (error) {
      console.error(`❌ Failed to delete task ${taskId}:`, error);
      toast.error('Failed to delete event');

      // Remove from deleting set on error
      setDeletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });

      // Only reload on error to restore the task
      await loadData();
    }
  }

  function openEditModal(task: Task) {
    console.log('📝 Opening edit modal for task:', task);
    setEditingTask(task);
    setNewEventTitle(task.title);
    setNewEventDuration(task.duration_minutes || 60);
    if (task.scheduled_time) {
      // Format for datetime-local input
      const date = new Date(task.scheduled_time);
      const localISOString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEditScheduledTime(localISOString);
    } else {
      setEditScheduledTime('');
    }
    setShowEditModal(true);
  }

  async function updateTask() {
    if (!editingTask || !newEventTitle.trim()) return;

    try {
      const updateData: any = {
        title: newEventTitle.trim(),
        duration_minutes: newEventDuration
      };

      // If scheduled time was edited, include it
      if (editScheduledTime) {
        updateData.scheduled_time = new Date(editScheduledTime).toISOString();
      }

      console.log('✏️ Updating task:', {
        id: editingTask.id,
        ...updateData,
        has_google_event: !!editingTask.google_event_id
      });

      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to update task:', errorData);
        throw new Error(errorData.error || 'Failed to update task');
      }

      const updatedTask = await response.json();
      console.log('✅ Task updated:', updatedTask);

      // If task has google_event_id, update the calendar event too
      if (editingTask.google_event_id) {
        console.log('🔄 Syncing update to Google Calendar...');
        const syncResponse = await fetch('/api/calendar/sync-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: editingTask.id,
            action: 'update'
          })
        });

        if (!syncResponse.ok) {
          console.warn('⚠️ Failed to sync update to Google Calendar');
        } else {
          console.log('✅ Update synced to Google Calendar');
        }
      }

      toast.success('Event updated!');
      setShowEditModal(false);
      setEditingTask(null);
      setNewEventTitle('');
      setNewEventDuration(60);
      loadData();
    } catch (error) {
      console.error('❌ Error updating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update event');
    }
  }


  function getEventsForSlot(day: Date, hour: number) {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return events.filter(event => {
      const eventStart = event.start.dateTime ? parseISO(event.start.dateTime) : null;
      if (!eventStart) return false;

      return eventStart >= slotStart && eventStart < slotEnd;
    });
  }

  function getTasksForSlot(day: Date, hour: number) {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return tasks.filter(task => {
      if (!task.scheduled_time) return false;
      // Don't show tasks that are being deleted
      if (deletingTasks.has(task.id)) return false;
      const taskStart = parseISO(task.scheduled_time);
      // Only show task in the slot where it STARTS (not in subsequent slots)
      return taskStart.getTime() >= slotStart.getTime() && taskStart.getTime() < slotEnd.getTime();
    });
  }

  return (
    <div className="bg-transparent text-white py-6">
      {/* Quick Tips */}
      <div className="max-w-[1600px] mx-auto mb-4">
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-3 text-sm">
          <p className="text-blue-300">
            <strong>💡 Quick tips:</strong> Double-click any time slot to create a new event, or drag your unscheduled tasks onto the calendar to schedule them.
          </p>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm"
            >
              →
            </button>
            <span className="text-sm text-gray-400 ml-2">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Unscheduled Tasks Sidebar */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">
              Your Teyra Tasks ({unscheduledTasks.length} unscheduled)
            </h3>
            <span className="text-xs text-gray-500">
              Drag to calendar to schedule
            </span>
          </div>
          {unscheduledTasks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {unscheduledTasks.filter(task => !deletingTasks.has(task.id)).map(task => (
                <motion.div
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    console.log('🎯 Drag started:', task.title);
                    setDraggedTask(task);
                    // Add dragging effect
                    e.currentTarget.style.opacity = '0.5';
                  }}
                  onDragEnd={(e) => {
                    console.log('🎯 Drag ended');
                    setDraggedTask(null);
                    setHoveredSlot(null);
                    e.currentTarget.style.opacity = '1';
                  }}
                  className={`bg-white/5 border border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-all ${
                    draggedTask?.id === task.id ? 'ring-2 ring-blue-400' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <p className="text-sm truncate" title={task.title}>{task.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {task.duration_minutes || 60}min
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">
                All your tasks are scheduled! 🎉
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Add new tasks from the dashboard
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="max-w-[1600px] mx-auto">
        <div className="border border-white/10 rounded-xl overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-white/10 bg-white/5">
            <div className="p-3 text-xs text-gray-500 border-r border-white/10">
              Time
            </div>
            {weekDays.map(day => (
              <div
                key={day.toISOString()}
                className={`p-3 text-center border-r border-white/10 last:border-r-0 ${
                  isSameDay(day, new Date()) ? 'bg-white/10' : ''
                }`}
              >
                <div className="text-xs text-gray-500">{format(day, 'EEE')}</div>
                <div className={`text-lg font-light mt-1 ${
                  isSameDay(day, new Date()) ? 'text-white' : 'text-gray-300'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b border-white/10 last:border-b-0">
                {/* Hour Label */}
                <div className="p-3 text-xs text-gray-500 border-r border-white/10 bg-black">
                  {format(addHours(startOfDay(new Date()), hour), 'h a')}
                </div>

                {/* Day Cells */}
                {weekDays.map(day => {
                  const slotEvents = getEventsForSlot(day, hour);
                  const slotTasks = getTasksForSlot(day, hour);
                  const hasContent = slotEvents.length > 0 || slotTasks.length > 0;

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setHoveredSlot({ day, hour });
                      }}
                      onDragLeave={() => setHoveredSlot(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        console.log('📍 Drop event triggered:', { day, hour, draggedTask });
                        if (draggedTask) {
                          // Check if trying to schedule in the past
                          const scheduledTime = new Date(day);
                          scheduledTime.setHours(hour, 0, 0, 0);
                          const now = new Date();

                          if (scheduledTime < now) {
                            toast.error('Cannot schedule tasks in the past. Please choose a future time.');
                            console.warn('⚠️ Attempted to schedule in the past:', scheduledTime);
                            setHoveredSlot(null);
                            setDraggedTask(null);
                            return;
                          }

                          scheduleTask(draggedTask, day, hour);
                          setHoveredSlot(null);
                        } else {
                          console.warn('⚠️ No dragged task found on drop');
                        }
                      }}
                      className={`p-2 border-r border-white/10 last:border-r-0 min-h-[60px] transition-colors cursor-pointer relative group ${
                        isSameDay(day, new Date()) ? 'bg-white/[0.02]' : ''
                      } ${
                        hoveredSlot &&
                        isSameDay(hoveredSlot.day, day) &&
                        hoveredSlot.hour === hour
                          ? 'bg-blue-500/20 ring-2 ring-blue-400/50'
                          : 'hover:bg-white/5'
                      }`}
                      onClick={() => setSelectedTime({ day, hour })}
                      onDoubleClick={() => !hasContent && openNewEventModal(day, hour)}
                    >
                      {/* Add button that appears on hover - only show when slot is empty */}
                      {!hasContent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openNewEventModal(day, hour);
                          }}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 text-sm opacity-0 group-hover:opacity-100 transition-all"
                          title="Create event"
                        >
                          +
                        </button>
                      )}
                      {/* Google Calendar Events - Only show if NOT already synced as Teyra task */}
                      {slotEvents.filter(event => {
                        // Don't show Google events that are already synced Teyra tasks
                        return !slotTasks.some(task => task.google_event_id === event.id);
                      }).map(event => {
                        // Calculate duration from start/end times
                        let duration = 60; // default
                        if (event.start?.dateTime && event.end?.dateTime) {
                          const start = new Date(event.start.dateTime);
                          const end = new Date(event.end.dateTime);
                          duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                        }

                        return (
                          <div
                            key={event.id}
                            className="gcal-event"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🖱️ Google Calendar event clicked:', event);
                              // For now, show a toast - could create a Teyra task from it
                              toast.info('This is a Google Calendar event. Right-click for options.');
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🖱️ Right-click on Google event:', event);
                              // Show option to import into Teyra or delete
                              setContextMenu({ x: e.clientX, y: e.clientY, task: null, googleEvent: event });
                            }}
                          >
                            <div className="bg-gray-700/80 border-l-2 border-gray-400 rounded px-2 py-1 mb-1 text-xs relative hover:bg-gray-700 transition-colors cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="truncate flex-1" title={event.summary}>{event.summary}</div>
                                <span className="text-[10px] text-gray-400 ml-1">📅</span>
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {duration}min
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Teyra Tasks */}
                      {slotTasks.map(task => (
                        <div
                          key={task.id}
                          className="task-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🖱️ Task clicked:', task);
                            openEditModal(task);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🖱️ Right-click on task:', task);
                            setContextMenu({ x: e.clientX, y: e.clientY, task });
                          }}
                        >
                          <div
                            className={`bg-white/15 border-l-2 ${
                              task.completed ? 'border-gray-600' : 'border-blue-400'
                            } rounded px-2 py-1 mb-1 text-xs relative hover:bg-white/20 transition-colors cursor-pointer`}
                          >
                            <div className="flex items-center justify-between">
                              <div className={`truncate flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`} title={task.title}>
                                {task.title}
                              </div>
                              {task.google_event_id && (
                                <span className="text-[10px] text-green-400 ml-1" title="Synced to Google Calendar">✓</span>
                              )}
                            </div>
                            {task.duration_minutes && (
                              <div className="text-[10px] text-white/40 mt-0.5">
                                {task.duration_minutes}min
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/20 rounded-xl p-6">
            <div className="text-white">Loading calendar...</div>
          </div>
        </div>
      )}

      {/* New Event Modal */}
      <AnimatePresence>
        {showNewEventModal && selectedSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => {
              setShowNewEventModal(false);
              setNewEventTitle('');
              setNewEventDuration(60);
              setSelectedSlot(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/20 rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-white mb-4">Create New Event</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Time: {format(selectedSlot.day, 'MMM d, yyyy')} at {format(addHours(startOfDay(selectedSlot.day), selectedSlot.hour), 'h:mm a')}
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="What do you need to do?"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && createNewEvent()}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newEventDuration}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewEventDuration(val); // Allow free typing
                    }}
                    onBlur={(e) => {
                      // Only clamp on blur (when user finishes typing)
                      const val = Number(e.target.value);
                      if (val < 5) setNewEventDuration(5);
                      else if (val > 480) setNewEventDuration(480);
                    }}
                    min="5"
                    max="480"
                    step="5"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                    placeholder="60"
                  />
                  <p className="text-xs text-white/40 mt-1">5-480 minutes (up to 8 hours)</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowNewEventModal(false);
                      setNewEventTitle('');
                      setNewEventDuration(60);
                      setSelectedSlot(null);
                    }}
                    className="flex-1 px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewEvent}
                    disabled={!newEventTitle.trim()}
                    className="flex-1 px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {showEditModal && editingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => {
              setShowEditModal(false);
              setEditingTask(null);
              setNewEventTitle('');
              setNewEventDuration(60);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/20 rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-white mb-4">Edit Event</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Scheduled Time</label>
                  <input
                    type="datetime-local"
                    value={editScheduledTime}
                    onChange={(e) => setEditScheduledTime(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="What do you need to do?"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && updateTask()}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newEventDuration}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewEventDuration(val); // Allow free typing
                    }}
                    onBlur={(e) => {
                      // Only clamp on blur (when user finishes typing)
                      const val = Number(e.target.value);
                      if (val < 5) setNewEventDuration(5);
                      else if (val > 480) setNewEventDuration(480);
                    }}
                    min="5"
                    max="480"
                    step="5"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                    placeholder="60"
                  />
                  <p className="text-xs text-white/40 mt-1">5-480 minutes (up to 8 hours)</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTask(null);
                      setNewEventTitle('');
                      setNewEventDuration(60);
                    }}
                    className="flex-1 px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateTask}
                    disabled={!newEventTitle.trim()}
                    className="flex-1 px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu fixed bg-zinc-900 border border-white/20 rounded-lg shadow-xl py-1 z-50 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.task ? (
            // Teyra task context menu
            <>
              <button
                onClick={() => {
                  openEditModal(contextMenu.task!);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <span>✎</span>
                Edit Event
              </button>
              <button
                onClick={() => {
                  deleteTask(contextMenu.task!.id);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <span>×</span>
                Delete Event
              </button>
            </>
          ) : contextMenu.googleEvent ? (
            // Google Calendar event context menu
            <>
              <div className="px-4 py-2 text-xs text-gray-400 border-b border-white/10">
                Google Calendar Event
              </div>
              <button
                onClick={() => {
                  toast.info('Google Calendar events are read-only. Manage them in Google Calendar.');
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <span>📅</span>
                View in Google Calendar
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* UNIFIED AI UPGRADE MODAL - Used across all AI features */}
      <AIUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="AI auto-scheduling"
        currentLimit={3}
      />

      {/* Mobile Warning Modal */}
      <AnimatePresence>
        {showMobileWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">best viewed on desktop</h3>
                <p className="text-white/70 text-sm mb-4">
                  the calendar works best on a computer for drag & drop scheduling and full week view
                </p>
                <p className="text-white/50 text-xs">
                  you can still use it on mobile, but the experience is optimized for desktop
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('calendar-mobile-warning-seen', 'true');
                  setShowMobileWarning(false);
                }}
                className="w-full px-4 py-3 bg-white hover:bg-white/90 text-black rounded-lg transition-colors font-semibold"
              >
                got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
