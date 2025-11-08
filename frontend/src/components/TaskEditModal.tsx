'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Tag, Flag, Trash2, Plus, ChevronDown, ChevronRight, List } from 'lucide-react';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string | number;
  title: string;
  completed: boolean;
  due_date?: string | null;
  tags?: string[] | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
  subtasks?: Subtask[] | null;
}

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdateTask: (id: string | number, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string | number) => Promise<void>;
  onCreateTask?: (taskData: Partial<Task>) => Promise<void>;
  initialTitle?: string;
}

export function TaskEditModal({ isOpen, onClose, task, onUpdateTask, onDeleteTask, onCreateTask, initialTitle = '' }: TaskEditModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent' | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCreateMode = !task && !!onCreateTask;

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setPriority(task.priority || null);
        setDueDate(task.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : '');
        // Ensure tags are properly initialized - handle both array and null/undefined
        const tagsArray = Array.isArray(task.tags) ? task.tags : (task.tags ? [task.tags] : []);
        setTagsInput(tagsArray.filter(Boolean).join(', ') || '');
        setSubtasks(task.subtasks || []);
      } else if (isCreateMode) {
        setTitle(initialTitle);
        setPriority(null);
        setDueDate('');
        setTagsInput('');
        setSubtasks([]);
      }
    }
  }, [task, initialTitle, isCreateMode, isOpen]);

  // Sync title when initialTitle changes in create mode
  useEffect(() => {
    if (isCreateMode && isOpen) {
      setTitle(initialTitle);
    }
  }, [initialTitle, isCreateMode, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, {
      id: Date.now().toString(),
      title: newSubtask.trim(),
      completed: false
    }]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const taskData: any = {
      title: title.trim(),
    };

    if (priority) {
      taskData.priority = priority;
    } else {
      taskData.priority = null;
    }

    if (dueDate) {
      taskData.due_date = new Date(dueDate).toISOString();
    } else {
      taskData.due_date = null;
    }

    // Always include tags, even if empty array
    taskData.tags = tags;

    if (subtasks.length > 0) {
      taskData.subtasks = subtasks;
    } else {
      taskData.subtasks = [];
    }

    if (isCreateMode && onCreateTask) {
      await onCreateTask(taskData);
    } else if (task) {
      await onUpdateTask(task.id, taskData);
    }

    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!task) return;
    if (confirm('Are you sure you want to delete this task?')) {
      await onDeleteTask(task.id);
      onClose();
    }
  };

  if (!isOpen || (!task && !isCreateMode)) return null;

  const priorityColors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 task-edit-modal">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0"
        >
          <div
            className="border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'rgb(39, 39, 42)',
              background: 'rgb(39, 39, 42)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(39, 39, 42)';
              e.currentTarget.style.background = 'rgb(39, 39, 42)';
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-white/10" style={{ background: 'transparent' }}>
              <h3 className="text-white font-light text-lg sm:text-2xl select-none pointer-events-none">{isCreateMode ? 'create task' : 'edit task'}</h3>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white/60 transition-colors close-modal-button"
                style={{ outline: 'none', background: 'transparent', border: 'none', boxShadow: 'none' }}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-8 space-y-6 sm:space-y-8"
              style={{ background: 'transparent' }}
            >
              {/* Task Title */}
              <div style={{ background: 'transparent' }}>
                <label className="block text-sm text-white/50 font-light mb-3 select-none pointer-events-none">
                  task name
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 text-white text-lg sm:text-xl font-light py-3 sm:py-4 px-3 sm:px-4 rounded-lg border border-white/10 placeholder:text-white/20 focus:outline-none focus:ring-0 focus:border-white/20"
                  style={{ outline: 'none', boxShadow: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  autoComplete="off"
                  spellCheck="false"
                  disabled={isSaving}
                />
              </div>

              {/* Priority */}
              <div style={{ background: 'transparent' }}>
                <label className="flex items-center gap-2 text-sm text-white/50 font-light mb-4 select-none pointer-events-none">
                  <Flag className="w-4 h-4 pointer-events-none" />
                  <span className="pointer-events-none">priority</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3" style={{ background: 'transparent' }}>
                  <button
                    type="button"
                    onClick={() => setPriority(priority === 'low' ? null : 'low')}
                    className={`py-3 rounded-lg text-sm font-light border transition-colors ${
                      priority === 'low'
                        ? priorityColors.low
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20'
                    }`}
                    style={{ outline: 'none' }}
                  >
                    low
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority(priority === 'medium' ? null : 'medium')}
                    className={`py-3 rounded-lg text-sm font-light border transition-colors ${
                      priority === 'medium'
                        ? priorityColors.medium
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/20'
                    }`}
                    style={{ outline: 'none' }}
                  >
                    medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority(priority === 'high' ? null : 'high')}
                    className={`py-3 rounded-lg text-sm font-light border transition-colors ${
                      priority === 'high'
                        ? priorityColors.high
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/20'
                    }`}
                    style={{ outline: 'none' }}
                  >
                    high
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority(priority === 'urgent' ? null : 'urgent')}
                    className={`py-3 rounded-lg text-sm font-light border transition-colors ${
                      priority === 'urgent'
                        ? priorityColors.urgent
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                    }`}
                    style={{ outline: 'none' }}
                  >
                    urgent
                  </button>
                </div>
              </div>

              {/* Due Date */}
              <div style={{ background: 'transparent' }}>
                <label className="flex items-center gap-2 text-sm text-white/50 font-light mb-4 select-none pointer-events-none">
                  <CalendarIcon className="w-4 h-4 pointer-events-none" />
                  <span className="pointer-events-none">due date</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white/5 text-white text-base font-light py-3 px-4 rounded-lg border border-white/10 focus:outline-none focus:ring-0 focus:border-white/20"
                  style={{ outline: 'none', boxShadow: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                />
              </div>

              {/* Subtasks */}
              <div style={{ background: 'transparent' }}>
                <button
                  type="button"
                  onClick={() => setSubtasksExpanded(!subtasksExpanded)}
                  className="flex items-center gap-2 text-sm text-white/50 font-light mb-4 select-none w-full text-left no-hover-bg subtasks-toggle-modal"
                >
                  <List className="w-4 h-4 pointer-events-none" />
                  <span className="pointer-events-none">subtasks</span>
                  {subtasksExpanded ? (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
                {subtasksExpanded && (
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSubtask(subtask.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            subtask.completed
                              ? 'bg-white border-white'
                              : 'border-white/40'
                          }`}
                        >
                          {subtask.completed && <X className="w-3 h-3 text-black" strokeWidth={3} />}
                        </button>
                        <input
                          type="text"
                          value={subtask.title}
                          onChange={(e) => setSubtasks(subtasks.map(s => s.id === subtask.id ? { ...s, title: e.target.value } : s))}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-0 focus:border-white/20"
                          style={{ outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeSubtask(subtask.id)}
                          className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-red-400 rounded-lg hover:bg-white/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                        placeholder="Add subtask..."
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:ring-0 focus:border-white/20"
                        style={{ outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      />
                      <button
                        type="button"
                        onClick={addSubtask}
                        disabled={!newSubtask.trim()}
                        className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/15 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div style={{ background: 'transparent' }}>
                <label className="flex items-center gap-2 text-sm text-white/50 font-light mb-4 select-none pointer-events-none">
                  <Tag className="w-4 h-4 pointer-events-none" />
                  <span className="pointer-events-none">tags</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="work, urgent, personal"
                  className="w-full bg-white/5 text-white text-base font-light py-3 px-4 rounded-lg border border-white/10 placeholder:text-white/20 focus:outline-none focus:ring-0 focus:border-white/20"
                  style={{ outline: 'none', boxShadow: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  autoComplete="off"
                />
                <p className="text-xs text-white/30 font-light mt-2 select-none pointer-events-none">
                  separate tags with commas
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/10" style={{ background: 'transparent' }}>
                {!isCreateMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-400 font-light order-2 sm:order-1"
                    style={{ outline: 'none', background: 'transparent' }}
                  >
                    <Trash2 className="w-4 h-4" />
                    delete task
                  </button>
                )}
                {isCreateMode && <div className="order-2 sm:order-1" />}
                <div className="flex items-center gap-3 order-1 sm:order-2" style={{ background: 'transparent' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-5 py-2.5 text-sm text-white/60 font-light"
                    style={{ outline: 'none', background: 'transparent' }}
                  >
                    cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim() || isSaving}
                    className="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-white text-black rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ outline: 'none' }}
                  >
                    {isSaving ? (isCreateMode ? 'creating...' : 'saving...') : (isCreateMode ? 'create task' : 'save changes')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
