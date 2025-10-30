'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Zap, Brain, CheckCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernNotesEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
  isSaving?: boolean;
}

interface DetectedTask {
  text: string;
  index: number;
  confidence: number;
}

export default function ModernNotesEditor({
  initialContent = '',
  onContentChange,
  isSaving = false
}: ModernNotesEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [detectedTasks, setDetectedTasks] = useState<DetectedTask[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState<'braindump' | 'action' | 'reflection'>('braindump');
  const [showModeInfo, setShowModeInfo] = useState(true);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const modeDescriptions = {
    braindump: {
      title: '✍️ brain dump mode',
      description: 'just write freely. no pressure, no analysis. get everything out of your head.',
      example: 'perfect for: journaling, stream of consciousness, random thoughts'
    },
    action: {
      title: '📋 action mode',
      description: 'automatically detects actionable sentences in your notes and highlights them. click to add them as tasks.',
      example: 'try writing: "i should finish my essay by friday" or "need to email the professor"'
    },
    reflection: {
      title: '🌿 reflection mode',
      description: 'gentle space for mood journaling and self-reflection.',
      example: 'perfect for: how you\'re feeling, gratitude, daily reflections'
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (content.length > 20 && mode === 'action') {
      timeoutRef.current = setTimeout(() => {
        detectTasks(content);
      }, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, mode]);

  const detectTasks = async (text: string) => {
    setIsAnalyzing(true);

    // Detect action-oriented sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const tasks: DetectedTask[] = [];

    sentences.forEach((sentence, index) => {
      const lowerSentence = sentence.toLowerCase();
      const actionWords = ['should', 'need to', 'have to', 'must', 'gonna', 'going to', 'will', 'todo', 'finish', 'complete', 'start', 'work on'];

      const hasActionWord = actionWords.some(word => lowerSentence.includes(word));

      if (hasActionWord) {
        tasks.push({
          text: sentence.trim(),
          index,
          confidence: 0.8
        });
      }
    });

    setDetectedTasks(tasks);
    setIsAnalyzing(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onContentChange(newContent);
  };

  const addTaskToDashboard = async (taskText: string) => {
    // This will integrate with your existing task creation API
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskText })
      });

      if (response.ok) {
        // Show success animation
        return true;
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
    return false;
  };

  const handleQuickAction = async (action: string) => {
    console.log('Quick action clicked:', action);

    switch (action) {
      case 'summarize':
        // TODO: Call AI to summarize the note
        alert('summarize feature coming soon! your note will be condensed into key points.');
        break;
      case 'add-all':
        // Add all detected tasks
        if (detectedTasks.length > 0) {
          for (const task of detectedTasks) {
            await addTaskToDashboard(task.text);
          }
          alert(`added ${detectedTasks.length} tasks to your dashboard!`);
        } else {
          alert('no tasks detected yet. try using action mode and writing actionable sentences!');
        }
        break;
      case 'takeaways':
        // TODO: Call AI to generate takeaways
        alert('takeaways feature coming soon! ai will extract 3 key insights from your note.');
        break;
      case 'motivate':
        // TODO: Call AI for motivation
        alert('motivation feature coming soon! ai will give you encouragement based on your note.');
        break;
    }
  };

  const quickActions = [
    { label: 'summarize note', action: 'summarize' },
    { label: 'add all tasks', action: 'add-all' },
    { label: 'generate takeaways', action: 'takeaways' },
    { label: 'motivate me', action: 'motivate' }
  ];

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Mode Info Card */}
      <AnimatePresence>
        {showModeInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative"
          >
            <button
              type="button"
              onClick={() => setShowModeInfo(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/70 text-xs lowercase"
              style={{
                outline: 'none !important',
                border: 'none !important',
                boxShadow: 'none !important',
                WebkitTapHighlightColor: 'transparent',
                background: 'transparent !important'
              }}
            >
              dismiss
            </button>
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white lowercase">{modeDescriptions[mode].title}</h3>
              <p className="text-sm text-white/70 lowercase leading-relaxed">{modeDescriptions[mode].description}</p>
              <p className="text-xs text-white/50 lowercase italic">{modeDescriptions[mode].example}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mode selector */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <button
          type="button"
          onClick={() => {
            setMode('braindump');
            setShowModeInfo(true);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all lowercase cursor-pointer ${
            mode === 'braindump'
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/50 hover:text-white/70'
          }`}
          style={{ outline: 'none', border: mode === 'braindump' ? '1px solid rgba(255,255,255,0.2)' : 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
        >
          ✍️ brain dump
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('action');
            setShowModeInfo(true);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all lowercase cursor-pointer ${
            mode === 'action'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-white/50 hover:text-white/70'
          }`}
          style={{ outline: 'none', border: mode === 'action' ? '1px solid rgba(168,85,247,0.3)' : 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
        >
          📋 action mode
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('reflection');
            setShowModeInfo(true);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all lowercase cursor-pointer ${
            mode === 'reflection'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-white/50 hover:text-white/70'
          }`}
          style={{ outline: 'none', border: mode === 'reflection' ? '1px solid rgba(59,130,246,0.3)' : 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
        >
          🌿 reflection
        </button>
      </div>

      {/* analyzing indicator */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 right-8 bg-purple-500/10 backdrop-blur-md border border-purple-500/20 rounded-full px-4 py-2 flex items-center gap-2 z-50"
          >
            <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-sm text-purple-300 lowercase">detecting tasks...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* main editor */}
      <textarea
        ref={editorRef}
        value={content}
        onChange={handleInput}
        placeholder="start typing..."
        className="w-full min-h-[600px] bg-transparent text-white/90 text-xl sm:text-2xl leading-loose outline-none ring-0 border-0 focus:outline-none focus:ring-0 focus:border-0 font-normal placeholder-white/20 resize-none"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          caretColor: 'white',
          outline: 'none',
          border: 'none',
          boxShadow: 'none',
        }}
      />

      {/* detected tasks panel */}
      <AnimatePresence>
        {mode === 'action' && detectedTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-8 top-1/2 transform -translate-y-1/2 w-80 max-h-[500px] overflow-y-auto bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4 text-purple-300 lowercase">
              <Zap className="w-5 h-5" />
              <span className="font-medium">detected tasks</span>
            </div>

            <div className="space-y-3">
              {detectedTasks.map((task, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 group hover:border-purple-500/30 transition-all"
                >
                  <p className="text-sm text-white/80 mb-3 leading-relaxed lowercase">
                    {task.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => addTaskToDashboard(task.text)}
                    className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors lowercase"
                    style={{ outline: 'none', border: 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent', background: 'transparent' }}
                  >
                    <Plus className="w-3 h-3" />
                    add to tasks
                  </button>
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                detectedTasks.forEach(task => addTaskToDashboard(task.text));
              }}
              className="w-full mt-4 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl text-sm text-purple-300 font-medium transition-all lowercase"
              style={{ outline: 'none', border: '1px solid rgba(168,85,247,0.3)', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
            >
              add all {detectedTasks.length} tasks
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* save indicator */}
      <div className="flex items-center justify-between mt-8 px-2">
        <div className="text-xs text-white/30 lowercase">
          {isSaving ? (
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" />
              saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400/50 rounded-full" />
              all changes saved
            </span>
          )}
        </div>
        <div className="text-xs text-white/20 lowercase">
          {content.split(/\s+/).filter(w => w).length} words
        </div>
      </div>

      {/* Remove all focus outlines and blue lines */}
      <style jsx global>{`
        textarea {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
        }
        textarea:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
        }
        textarea:focus-visible {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        button {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent !important;
          background-color: transparent !important;
        }
        button:hover {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        button:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        button:focus-visible {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        button:active {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        *:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        *:hover {
          outline: none !important;
        }
        * {
          -webkit-tap-highlight-color: transparent !important;
        }
      `}</style>
    </div>
  );
}
