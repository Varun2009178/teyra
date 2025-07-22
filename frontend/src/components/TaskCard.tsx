"use client";

import React from 'react';
import { Check, Trash2 } from 'lucide-react';

interface Task {
  id: number | string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: number | string, completed: boolean) => void;
  onDelete: (id: number | string) => void;
}

export function TaskCard({ task, onToggleComplete, onDelete }: TaskCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 ${
        task.completed 
          ? 'border-green-200 bg-green-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 flex-1">
            <button
              onClick={() => onToggleComplete(task.id, !task.completed)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                task.completed 
                  ? 'bg-green-500 border-green-500 shadow-sm' 
                  : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              {task.completed && (
                <Check className="w-3 h-3 text-white" />
              )}
            </button>
            
            <span
              className={`flex-1 ${
                task.completed 
                  ? 'line-through text-green-600' 
                  : 'text-gray-700'
              }`}
            >
              {task.title}
            </span>
          </div>
          
          <button
            onClick={() => onDelete(task.id)}
            className="w-5 h-5 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
} 