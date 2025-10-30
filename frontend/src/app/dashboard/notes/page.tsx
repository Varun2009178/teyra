'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ModernNotesEditor from '@/components/ModernNotesEditor';
import { motion } from 'framer-motion';

export default function NotesPage() {
  const { user } = useUser();
  const [noteContent, setNoteContent] = useState('');
  const [noteId, setNoteId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Check if user is Pro
  useEffect(() => {
    if (!user) return;
    setIsPro(user.publicMetadata?.isPro === true);
  }, [user]);

  // Show modal on first visit
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenNotesModal');
    if (!hasSeenModal) {
      setShowModal(true);
    }
  }, []);

  // Load existing note
  useEffect(() => {
    if (!user) return;

    const loadNote = async () => {
      try {
        const response = await fetch('/api/notes');
        if (!response.ok) return;

        const notes = await response.json();
        if (notes && notes.length > 0) {
          const latestNote = notes[0];
          setNoteContent(latestNote.content || '');
          setNoteId(latestNote.id);
        }
      } catch (error) {
        console.error('error loading note:', error);
      }
    };

    loadNote();
  }, [user]);

  // Auto-save
  useEffect(() => {
    if (!user) return;

    const timeoutId = setTimeout(async () => {
      try {
        setIsSaving(true);

        if (!noteId && noteContent.trim()) {
          const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'my notes',
              content: noteContent
            })
          });

          if (response.ok) {
            const note = await response.json();
            setNoteId(note.id);
          }
        } else if (noteId) {
          await fetch(`/api/notes/${noteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: noteContent })
          });
        }
      } catch (error) {
        console.error('error saving:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [noteContent, noteId, user]);

  const handleCloseModal = () => {
    localStorage.setItem('hasSeenNotesModal', 'true');
    setShowModal(false);
  };

  const handleContentChange = (content: string) => {
    setNoteContent(content);
  };

  return (
    <div className="min-h-screen dark-gradient-bg noise-texture text-white relative overflow-hidden">
      {/* Vibrant gradient orbs */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-72 h-72 bg-pink-500 rounded-full filter blur-[110px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Welcome Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-lg w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">modern notes</h2>
                <span className="px-2 py-0.5 bg-white/10 text-white/60 text-xs font-bold rounded uppercase tracking-wide">
                  beta
                </span>
              </div>
            </div>
            <div className="space-y-3 text-white/70 text-base mb-6 leading-relaxed">
              <p>
                welcome to notes. a simple, distraction-free space to think, plan, and reflect.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-white/40">•</span>
                  <span>auto-save as you type</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/40">•</span>
                  <span>action mode detects tasks from your writing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/40">•</span>
                  <span>clean, minimalist design</span>
                </li>
              </ul>
            </div>
            <button
              onClick={handleCloseModal}
              className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              start writing
            </button>
          </motion.div>
        </div>
      )}

      {/* Navbar */}
      <Navbar isPro={isPro} showSettings={true} />

      {/* Main Content */}
      <ModernNotesEditor
        initialContent={noteContent}
        onContentChange={handleContentChange}
        isSaving={isSaving}
      />

      {/* Remove all focus outlines */}
      <style jsx global>{`
        [contenteditable] {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        [contenteditable]:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
