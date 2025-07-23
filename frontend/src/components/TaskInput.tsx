"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface TaskInputProps {
  onAddTask: (title: string) => void;
  isLoading?: boolean;
}

export function TaskInput({ onAddTask, isLoading = false }: TaskInputProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && !isLoading) {
      onAddTask(title.trim());
      setTitle('');
      // Prevent scrolling to top by keeping focus on input
      const input = e.currentTarget.querySelector('input') as HTMLInputElement;
      if (input) {
        setTimeout(() => input.focus(), 0);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-gray-300"
    >
      <div className="p-2.5">
        <div className="flex items-center space-x-2.5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 border-none outline-none text-gray-700 placeholder-gray-400 font-medium text-sm"
            disabled={isLoading}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <button
            type="submit"
            disabled={!title.trim() || isLoading}
            className="w-6 h-6 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
} 