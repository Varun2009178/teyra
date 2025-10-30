'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Check, Trash2, Edit2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ParsedTask {
  title: string;
  tempId?: string;
}

interface AITaskParserProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: () => void;
}

export function AITaskParser({ isOpen, onClose, onTasksCreated }: AITaskParserProps) {
  const [inputText, setInputText] = useState('');
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error('Please paste some text to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/parse-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) throw new Error('Failed to parse tasks');

      const data = await response.json();

      if (data.tasks && data.tasks.length > 0) {
        // Add temp IDs for editing
        const tasksWithIds = data.tasks.map((task: ParsedTask, index: number) => ({
          ...task,
          tempId: `temp-${Date.now()}-${index}`
        }));
        setParsedTasks(tasksWithIds);
        toast.success(`Found ${data.tasks.length} tasks!`);
      } else {
        toast.error('No actionable tasks found in the text');
      }
    } catch (error) {
      console.error('Error parsing tasks:', error);
      toast.error('Failed to analyze text. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTasks = async () => {
    if (parsedTasks.length === 0) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: parsedTasks })
      });

      if (!response.ok) throw new Error('Failed to create tasks');

      toast.success(`Added ${parsedTasks.length} tasks!`);
      onTasksCreated();
      handleClose();
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast.error('Failed to add tasks. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setInputText('');
    setParsedTasks([]);
    setEditingId(null);
    onClose();
  };

  const handleRemoveTask = (tempId: string) => {
    setParsedTasks(prev => prev.filter(task => task.tempId !== tempId));
  };

  const handleStartEdit = (task: ParsedTask) => {
    setEditingId(task.tempId || null);
    setEditText(task.title);
  };

  const handleSaveEdit = (tempId: string) => {
    setParsedTasks(prev => prev.map(task =>
      task.tempId === tempId ? { ...task, title: editText } : task
    ));
    setEditingId(null);
    setEditText('');
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="liquid-glass-strong rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden pointer-events-auto shadow-2xl">
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">import tasks</h2>
                    <p className="text-sm text-white/50 mt-1">paste emails, messages, or notes</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 liquid-glass-subtle transition-all"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {parsedTasks.length === 0 ? (
                  <div className="space-y-3">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="paste anything - emails, slack messages, meeting notes..."
                      className="w-full h-56 px-4 py-3 liquid-glass-input rounded-lg text-white text-sm placeholder-white/30 focus:outline-none transition-all resize-none"
                    />

                    <motion.button
                      whileHover={{ scale: inputText.trim() ? 1.01 : 1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !inputText.trim()}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        inputText.trim() && !isAnalyzing
                          ? 'bg-white hover:bg-white/90 text-black'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      {isAnalyzing ? (
                        <>
                          <motion.div
                            className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          extract tasks
                        </>
                      )}
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-white/60">found {parsedTasks.length} {parsedTasks.length === 1 ? 'task' : 'tasks'}</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setParsedTasks([])}
                        className="text-xs text-white/50 hover:text-white/90 transition-colors"
                      >
                        start over
                      </motion.button>
                    </div>

                    {/* Parsed Tasks List - Simple Notion Style */}
                    <div className="space-y-2">
                      {parsedTasks.map((task, index) => (
                        <motion.div
                          key={task.tempId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-center gap-2 px-3 py-2.5 liquid-glass-task rounded-lg hover:bg-white/5 transition-all"
                        >
                          {editingId === task.tempId ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 px-2 py-1 liquid-glass-input rounded text-white text-sm focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(task.tempId!);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                              />
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSaveEdit(task.tempId!)}
                                className="px-2 py-1 bg-white text-black rounded text-xs font-medium"
                              >
                                save
                              </motion.button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 text-white/90 text-sm">{task.title}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={async () => {
                                    // Add single task
                                    try {
                                      const response = await fetch('/api/tasks', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ title: task.title })
                                      });

                                      if (!response.ok) {
                                        const error = await response.json();
                                        throw new Error(error.error || 'Failed to add task');
                                      }

                                      toast.success('task added!');
                                      handleRemoveTask(task.tempId!);
                                      // Small delay before refreshing to ensure task is saved
                                      setTimeout(() => onTasksCreated(), 300);
                                    } catch (error) {
                                      console.error('Error adding task:', error);
                                      toast.error(error instanceof Error ? error.message : 'failed to add task');
                                    }
                                  }}
                                  className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-green-400 hover:bg-white/10"
                                  title="add this task"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleStartEdit(task)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveTask(task.tempId!)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </motion.button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {parsedTasks.length > 0 && (
                <div className="px-6 pb-6 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAddTasks}
                    disabled={isAdding}
                    className="w-full px-4 py-2.5 bg-white hover:bg-white/90 text-black text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAdding ? (
                      <>
                        <motion.div
                          className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        adding...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        add {parsedTasks.length} {parsedTasks.length === 1 ? 'task' : 'tasks'}
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
