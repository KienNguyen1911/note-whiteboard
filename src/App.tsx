import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note, NoteColor, DragState } from './types';
import { NoteService } from './services/noteService';
import { NoteItem } from './components/NoteItem';
import { Toolbar } from './components/Toolbar';
import { DEFAULT_NOTE_COLOR } from './constants';
import { debounce } from './utils/debounce';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    noteId: null,
    offsetX: 0,
    offsetY: 0,
  });

  // Resize state
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    noteId: string | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  }>({
    isResizing: false,
    noteId: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  // Create debounced save function
  const debouncedUpdateContent = useRef(
    debounce((id: string, content: string) => {
      NoteService.updateContent(id, content).catch(err => 
        console.error('Failed to save content:', err)
      );
    }, 1000)
  ).current;

  // Load notes on mount
  useEffect(() => {
    const fetchNotes = async () => {
      const loadedNotes = await NoteService.getAllNotes();
      setNotes(loadedNotes);
    };
    fetchNotes();
  }, []);

  // --- Actions ---

  const handleAddNote = async (color: NoteColor = DEFAULT_NOTE_COLOR) => {
    // Add note at center of screen (approximate)
    // Or randomized slightly so they don't stack perfectly
    const x = window.innerWidth / 2 - 120 + (Math.random() * 40 - 20);
    const y = window.innerHeight / 2 - 90 + (Math.random() * 40 - 20);
    
    const newNote = await NoteService.createNote(x, y, color);
    setNotes(prev => [...prev, newNote]);
  };

  const handleUpdateContent = useCallback((id: string, content: string) => {
    // Optimistic update - cập nhật UI ngay lập tức
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
    // Gọi debounced save - chỉ gửi request sau 1s khi user dừng gõ
    debouncedUpdateContent(id, content);
  }, [debouncedUpdateContent]);

  const handleDeleteNote = useCallback(async (id: string) => {
    await NoteService.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleClearAll = async () => {
    await NoteService.clearAll();
    setNotes([]);
  };

  const handleChangeColor = useCallback(async (id: string, color: NoteColor) => {
      // Feature implementation left for expansion
      // We would update local state and DB here
      console.log("Change color", id, color);
  }, []);

  // --- Resize Logic ---

  const handleResizeStart = (e: React.PointerEvent, noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);

    setResizeState({
      isResizing: true,
      noteId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: note.width,
      startHeight: note.height,
    });
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeState.isResizing || !resizeState.noteId) return;

    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;

    const newWidth = Math.max(150, resizeState.startWidth + deltaX);
    const newHeight = Math.max(120, resizeState.startHeight + deltaY);

    setNotes(prev =>
      prev.map(n =>
        n.id === resizeState.noteId
          ? { ...n, width: newWidth, height: newHeight }
          : n
      )
    );
  };

  const handleResizeEnd = async (e: React.PointerEvent) => {
    if (resizeState.isResizing && resizeState.noteId) {
      const note = notes.find(n => n.id === resizeState.noteId);
      if (note) {
        await NoteService.updateNote(note);
      }
    }

    setResizeState({
      isResizing: false,
      noteId: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
    });
  };

  // --- Drag Logic ---

  const handlePointerDown = (e: React.PointerEvent, noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Bring to front locally immediately
    const maxZ = notes.length > 0 ? Math.max(...notes.map(n => n.zIndex)) : 0;
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, zIndex: maxZ + 1 } : n));

    // Calculate offset from top-left of the note
    const offsetX = e.clientX - note.x;
    const offsetY = e.clientY - note.y;

    setDragState({
      isDragging: true,
      noteId,
      offsetX,
      offsetY,
    });
    
    // Capture pointer to track movement even if mouse leaves the element
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Handle resize move (priority over drag)
    if (resizeState.isResizing && resizeState.noteId) {
      const deltaX = e.clientX - resizeState.startX;
      const deltaY = e.clientY - resizeState.startY;

      const newWidth = Math.max(150, resizeState.startWidth + deltaX);
      const newHeight = Math.max(120, resizeState.startHeight + deltaY);

      setNotes(prev =>
        prev.map(n =>
          n.id === resizeState.noteId
            ? { ...n, width: newWidth, height: newHeight }
            : n
        )
      );
      return;
    }

    // Handle drag move
    if (!dragState.isDragging || !dragState.noteId) return;

    const newX = e.clientX - dragState.offsetX;
    const newY = e.clientY - dragState.offsetY;

    // Optimistic UI update
    setNotes(prev => prev.map(n => 
      n.id === dragState.noteId 
        ? { ...n, x: newX, y: newY } 
        : n
    ));
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (dragState.isDragging && dragState.noteId) {
      // Persist the final position
      const note = notes.find(n => n.id === dragState.noteId);
      if (note) {
        await NoteService.updatePosition(note.id, note.x, note.y, note.zIndex);
      }
    }

    // Handle resize end
    handleResizeEnd(e);

    setDragState({
      isDragging: false,
      noteId: null,
      offsetX: 0,
      offsetY: 0,
    });
  };
  
  // Double click background to add note
  const handleBackgroundDoubleClick = (e: React.MouseEvent) => {
      // Ensure we are clicking the background, not a note
      if(e.target === e.currentTarget) {
           const x = e.clientX - 120; // Center the note on click
           const y = e.clientY - 90;
           NoteService.createNote(x, y, DEFAULT_NOTE_COLOR).then(newNote => {
               setNotes(prev => [...prev, newNote]);
           });
      }
  };

  return (
    <div 
      className="w-full h-full bg-dot-pattern relative overflow-hidden select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleBackgroundDoubleClick}
    >
      {/* Introduction Hint */}
      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
           <div className="text-center">
               <h1 className="text-4xl font-bold text-slate-400 mb-2">Không gian ghi chú của bạn</h1>
               <p className="text-slate-400">Click đúp chuột hoặc dùng thanh công cụ để thêm note mới.</p>
           </div>
        </div>
      )}

      {/* Notes Layer */}
      {notes.map(note => (
        <NoteItem
          key={note.id}
          note={note}
          onMouseDown={handlePointerDown}
          onUpdateContent={handleUpdateContent}
          onDelete={handleDeleteNote}
          onChangeColor={handleChangeColor}
          onResizeStart={handleResizeStart}
        />
      ))}

      {/* UI Controls */}
      <Toolbar 
        onAddNote={handleAddNote} 
        onClearAll={handleClearAll}
        noteCount={notes.length}
      />
      
      <div className="fixed top-4 right-4 text-slate-300 text-xs pointer-events-none">
        Auto-saved to LocalStorage
      </div>
    </div>
  );
};

export default App;