'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ModernNotesEditor from '@/components/ModernNotesEditor';
import CommandMenu from '@/components/CommandMenu';
import { useCommandMenu } from '@/hooks/useCommandMenu';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

function NotesPageContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [noteContent, setNoteContent] = useState('');
  const [noteId, setNoteId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showModal, setShowModal] = useState(true); // Default to true, hide if seen before
  const { isOpen, closeMenu, openMenu } = useCommandMenu();

  // Check if user is Pro
  useEffect(() => {
    if (!user) return;
    setIsPro(user.publicMetadata?.isPro === true);
  }, [user]);

  // Hide modal if already seen - wait for user to load
  useEffect(() => {
    if (!user) return;

    const hasSeenModal = localStorage.getItem('hasSeenNotesModal');
    console.log('🔍 Notes modal check:', { hasSeenModal, userId: user.id });

    if (hasSeenModal === 'true') {
      console.log('❌ Modal already seen, hiding it');
      setShowModal(false);
    } else {
      console.log('✅ First visit, showing modal');
      // Keep modal visible (already true by default)
    }
  }, [user]);

  // Load note from URL or latest note
  useEffect(() => {
    if (!user) return;

    const loadNote = async () => {
      try {
        // Prevent scrolling
        window.scrollTo(0, 0);
        
        const noteIdParam = searchParams?.get('id');
        
        if (noteIdParam) {
          // Load specific note
          const response = await fetch(`/api/notes/${noteIdParam}`);
          if (response.ok) {
            const note = await response.json();
            setNoteContent(note.content || '');
            setNoteTitle(note.title || '');
            setNoteId(note.id);
            setShowModal(false); // Don't show modal when loading specific note
            // Ensure no scrolling
            setTimeout(() => window.scrollTo(0, 0), 0);
            return;
          }
        }

        // Load latest note if no ID specified
        const response = await fetch('/api/notes');
        if (!response.ok) return;

        const notes = await response.json();
        if (notes && notes.length > 0) {
          const latestNote = notes[0];
          setNoteContent(latestNote.content || '');
          setNoteTitle(latestNote.title || '');
          setNoteId(latestNote.id);
        }
        // Ensure no scrolling
        setTimeout(() => window.scrollTo(0, 0), 0);
      } catch (error) {
        console.error('error loading note:', error);
      }
    };

    loadNote();
  }, [user, searchParams]);

  // Auto-save - faster for better reactivity
  useEffect(() => {
    if (!user) return;
    if (!noteContent.trim() && !noteTitle.trim()) return; // Don't save empty notes

    const timeoutId = setTimeout(async () => {
      try {
        setIsSaving(true);

        if (!noteId && (noteContent.trim() || noteTitle.trim())) {
          // Create new note when content is typed - faster response
          const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: noteTitle.trim() || 'untitled',
              content: noteContent.trim()
            })
          });

          if (response.ok) {
            const note = await response.json();
            setNoteId(note.id);
            setNoteTitle(note.title || '');
            // Update URL without reload or scroll, but only if we're already on notes page
            if (window.location.pathname === '/dashboard/notes') {
              router.replace(`/dashboard/notes?id=${note.id}`, { scroll: false });
            }
            // Prevent any auto-scrolling
            window.scrollTo(0, 0);
            // Dispatch event to refresh command menu and sidebar
            window.dispatchEvent(new CustomEvent('teyra:note-updated'));
            console.log('✅ Note created successfully:', note.id, note.title);
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ Failed to create note:', response.status, errorData);
            toast.error(`Failed to save note: ${errorData.error || 'Unknown error'}`);
          }
        } else if (noteId) {
          // Update existing note
          const response = await fetch(`/api/notes/${noteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              content: noteContent.trim(),
              title: noteTitle.trim() || 'untitled'
            })
          });
          
          if (response.ok) {
            // Dispatch event to refresh command menu and sidebar
            window.dispatchEvent(new CustomEvent('teyra:note-updated'));
            console.log('✅ Note updated successfully:', noteId);
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ Failed to update note:', response.status, errorData);
            toast.error(`Failed to save note: ${errorData.error || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('❌ Error saving note:', error);
        toast.error('Failed to save note');
      } finally {
        setIsSaving(false);
      }
    }, 500); // Reduced from 1000ms to 500ms for faster reactivity

    return () => clearTimeout(timeoutId);
  }, [noteContent, noteId, noteTitle, user, router]);

  const handleCloseModal = () => {
    localStorage.setItem('hasSeenNotesModal', 'true');
    setShowModal(false);
  };

  const handleContentChange = (content: string) => {
    setNoteContent(content);
  };

  const handleTitleChange = (title: string) => {
    setNoteTitle(title);
  };

  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  const handleDeleteNote = async () => {
    if (!noteId || isDeletingNote) return;

    const confirmed = window.confirm('Are you sure you want to delete this note? This action cannot be undone.');
    if (!confirmed) return;

    setIsDeletingNote(true);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Note deleted');
        // Clear current note
        setNoteContent('');
        setNoteTitle('');
        setNoteId(null);
        // Navigate to notes page without ID
        router.push('/dashboard/notes');
        // Dispatch event to refresh command menu and sidebar
        window.dispatchEvent(new CustomEvent('teyra:note-updated'));
      } else {
        toast.error('Failed to delete note');
      }
    } catch (error) {
      console.error('error deleting note:', error);
      toast.error('Failed to delete note');
    } finally {
      setIsDeletingNote(false);
    }
  };

  const handleCreateNewNote = async () => {
    // Don't allow creating empty notes - user must type something first
    if (isCreatingNote || (!noteContent.trim() && !noteTitle.trim())) {
      return;
    }
    
    setIsCreatingNote(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: noteTitle.trim() || 'untitled',
          content: noteContent.trim() 
        })
      });

      if (response.ok) {
        const note = await response.json();
        // Clear current note state
        setNoteContent('');
        setNoteTitle('');
        setNoteId(null);
        // Dispatch event to refresh command menu
        window.dispatchEvent(new CustomEvent('teyra:note-updated'));
        // Navigate to new note
        router.push(`/dashboard/notes?id=${note.id}`);
      } else {
        console.error('Failed to create note');
      }
    } catch (error) {
      console.error('error creating note:', error);
    } finally {
      setIsCreatingNote(false);
    }
  };

  // Auto-save title changes
  useEffect(() => {
    if (!user || !noteId || !noteTitle.trim()) return;

    const timeoutId = setTimeout(async () => {
      try {
        await fetch(`/api/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: noteTitle.trim() || 'untitled' })
        });
      } catch (error) {
        console.error('error saving title:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [noteTitle, noteId, user]);

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
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
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
              className="w-full bg-white hover:bg-white/90 text-black font-medium py-3 rounded-xl transition-colors"
              style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
            >
              start writing
            </button>
          </motion.div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar 
        isPro={isPro} 
        showSettings={true}
        showAccountButton={true}
        onAccountClick={() => {
          // You can add account modal logic here if needed
        }}
        onCommandMenuClick={openMenu}
      />

      {/* Main Content */}
      <div className="lg:ml-64 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header with New Note Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 flex items-center gap-3">
            {/* Note Title Input */}
            <input
              type="text"
              value={noteTitle || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="untitled"
              className="flex-1 bg-transparent text-white/90 text-2xl sm:text-3xl font-light outline-none border-none focus:outline-none focus:ring-0 placeholder-white/30"
              style={{
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
                textDecoration: 'none',
                WebkitTextDecoration: 'none'
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {/* Save Indicator */}
            {isSaving && (
              <div className="text-white/40 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                <span>Saving...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Delete Button */}
            {noteId && (
              <button
                onClick={handleDeleteNote}
                disabled={isDeletingNote}
                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-xl text-red-400 text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {/* New Note Button - Disabled until user types something */}
            <button
              onClick={handleCreateNewNote}
              disabled={isCreatingNote || (!noteContent.trim() && !noteTitle.trim())}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 rounded-xl text-white text-sm font-medium transition-all flex items-center gap-2 liquid-glass-hover disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/10"
              title={(!noteContent.trim() && !noteTitle.trim()) ? 'Type something to create a new note' : 'Create new note'}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{isCreatingNote ? 'Creating...' : 'New Note'}</span>
            </button>
          </div>
        </div>
        
        <ModernNotesEditor
          initialContent={noteContent}
          onContentChange={handleContentChange}
          isSaving={isSaving}
        />
      </div>

      {/* Command Menu */}
      <CommandMenu isOpen={isOpen} onClose={closeMenu} />

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

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen dark-gradient-bg flex items-center justify-center">
        <div className="text-white/60">loading...</div>
      </div>
    }>
      <NotesPageContent />
    </Suspense>
  );
}
