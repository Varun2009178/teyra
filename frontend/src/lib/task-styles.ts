import { TaskStatus } from '@/lib/types';

// Consistent color palette for task statuses
export const taskStatusColors = {
  [TaskStatus.DONE]: {
    primary: 'rgb(34, 197, 94)',      // green-500
    light: 'rgba(34, 197, 94, 0.1)',  // green-500/10
    border: 'rgba(34, 197, 94, 0.2)', // green-500/20
    text: 'rgb(21, 128, 61)',         // green-700
    hover: 'rgba(34, 197, 94, 0.05)'  // green-500/5
  },
  [TaskStatus.PARTIALLY_DONE]: {
    primary: 'rgb(245, 158, 11)',      // yellow-500
    light: 'rgba(245, 158, 11, 0.1)',  // yellow-500/10
    border: 'rgba(245, 158, 11, 0.2)', // yellow-500/20
    text: 'rgb(180, 83, 9)',          // yellow-700
    hover: 'rgba(245, 158, 11, 0.05)' // yellow-500/5
  },
  [TaskStatus.SKIPPED_INTENTIONALLY]: {
    primary: 'rgb(107, 114, 128)',     // gray-500
    light: 'rgba(107, 114, 128, 0.1)', // gray-500/10
    border: 'rgba(107, 114, 128, 0.2)', // gray-500/20
    text: 'rgb(75, 85, 99)',          // gray-600
    hover: 'rgba(107, 114, 128, 0.05)' // gray-500/5
  },
  [TaskStatus.NOT_DONE]: {
    primary: 'rgb(107, 114, 128)',     // gray-500
    light: 'transparent',
    border: 'rgba(229, 231, 235, 1)',  // gray-200
    text: 'rgb(17, 24, 39)',          // gray-900
    hover: 'rgba(249, 250, 251, 1)'   // gray-50
  }
};

// Get status-based styling
export const getTaskStatusStyles = (status: TaskStatus) => {
  const colors = taskStatusColors[status] || taskStatusColors[TaskStatus.NOT_DONE];
  
  return {
    backgroundColor: colors.light,
    borderColor: colors.border,
    textColor: getTextColorClass(status),
    hoverColor: colors.hover,
    primaryColor: colors.primary
  };
};

// Get Tailwind text color classes
export const getTextColorClass = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.DONE:
      return 'text-green-700';
    case TaskStatus.PARTIALLY_DONE:
      return 'text-yellow-700';
    case TaskStatus.SKIPPED_INTENTIONALLY:
      return 'text-gray-600';
    case TaskStatus.NOT_DONE:
    default:
      return 'text-gray-900';
  }
};

// Consistent spacing and sizing
export const taskSpacing = {
  container: {
    padding: 'p-6',
    margin: 'mb-8',
    gap: 'space-y-3'
  },
  item: {
    padding: 'p-4',
    gap: 'gap-3',
    borderRadius: 'rounded-xl'
  },
  button: {
    size: 'w-8 h-8',
    borderRadius: 'rounded-full',
    iconSize: 'w-4 h-4'
  }
};

// Animation timing constants
export const animationTiming = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.6,
  spring: {
    stiffness: 400,
    damping: 25
  },
  layout: {
    stiffness: 300,
    damping: 30
  }
};

// Accessibility helpers
export const getStatusAriaLabel = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.DONE:
      return 'Task completed';
    case TaskStatus.PARTIALLY_DONE:
      return 'Task partially completed';
    case TaskStatus.SKIPPED_INTENTIONALLY:
      return 'Task skipped intentionally';
    case TaskStatus.NOT_DONE:
    default:
      return 'Task not completed';
  }
};

export const getStatusDescription = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.DONE:
      return 'This task has been completed successfully';
    case TaskStatus.PARTIALLY_DONE:
      return 'This task has been partially completed';
    case TaskStatus.SKIPPED_INTENTIONALLY:
      return 'This task was intentionally skipped';
    case TaskStatus.NOT_DONE:
    default:
      return 'This task is not yet completed';
  }
};