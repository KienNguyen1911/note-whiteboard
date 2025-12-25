import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note, NoteColor, DragState, ViewState, Position } from './types';
import { NoteService } from './services/noteService';
import { NoteItem } from './components/NoteItem';
import { Toolbar } from './components/Toolbar';
import { Minimap } from './components/Minimap';
import { DEFAULT_NOTE_COLOR } from './constants';
import { debounce } from './utils/debounce';
import { autoArrangeNotes } from './utils/layoutUtils';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    noteId: null,
    offsetX: 0,
    offsetY: 0,
  });

  // Viewport State
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offset: { x: 0, y: 0 },
  });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  // Window Size State
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // --- Multi-select State ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Coordinate conversion helpers
  const toWorld = useCallback((screenX: number, screenY: number): Position => {
    return {
      x: (screenX - viewState.offset.x) / viewState.scale,
      y: (screenY - viewState.offset.y) / viewState.scale,
    };
  }, [viewState]);

  const toScreen = useCallback((worldX: number, worldY: number): Position => {
    return {
      x: worldX * viewState.scale + viewState.offset.x,
      y: worldY * viewState.scale + viewState.offset.y,
    };
  }, [viewState]);

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

  const handleAddNote = async (color: NoteColor) => {
    // Fallback if color is missing (should stick to type, but good safety)
    const finalColor = color || DEFAULT_NOTE_COLOR;
    
    // Add note at center of screen (approximate)
    // We want it centered in the viewport, so we use toWorld on the center of the window
    const center = toWorld(window.innerWidth / 2, window.innerHeight / 2);
    // Randomize slightly
    const x = center.x - 120 + (Math.random() * 40 - 20);
    const y = center.y - 90 + (Math.random() * 40 - 20);
    
    const newNote = await NoteService.createNote(x, y, finalColor);
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

  const handleAutoArrange = async () => {
      const arrangedNotes = autoArrangeNotes(notes);
      
      // Update local state first for responsiveness
      setNotes(arrangedNotes);

      // Persist all changes
      // Ideally NoteService would have a batch update, but we can loop for now or add one
      // For this demo, let's just update each one. 
      // In a real app we'd want a bulk update endpoint.
      for (const note of arrangedNotes) {
          await NoteService.updatePosition(note.id, note.x, note.y, note.zIndex);
      }
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
      startX: toWorld(e.clientX, e.clientY).x,
      startY: toWorld(e.clientX, e.clientY).y,
      startWidth: note.width,
      startHeight: note.height,
    });
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeState.isResizing || !resizeState.noteId) return;

    const mouseWorld = toWorld(e.clientX, e.clientY);
    const deltaX = mouseWorld.x - resizeState.startX;
    const deltaY = mouseWorld.y - resizeState.startY;

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
    e.stopPropagation(); // Important: Stop canvas start selection

    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Handle Selection Logic
    const isShift = e.shiftKey;
    let newSelected = new Set(selectedIds);

    if (isShift) {
        // Toggle selection
        if (newSelected.has(noteId)) {
            newSelected.delete(noteId);
        } else {
            newSelected.add(noteId);
        }
        setSelectedIds(newSelected);
    } else {
        // If Clicking an unselected note without Shift, clear others and select this one
        if (!newSelected.has(noteId)) {
             newSelected = new Set([noteId]);
             setSelectedIds(newSelected);
        } 
        // If clicking an ALREADY selected note, do not clear (we might be starting a drag)
    }

    // Bring to front locally immediately (only if not already top? or just this one?)
    // If dragging a group, preserving relative Z-index is hard without a deeper system.
    // For now, let's just bump the dragged one or ALL selected?
    // Let's bump THIS one for sure.
    const maxZ = notes.length > 0 ? Math.max(...notes.map(n => n.zIndex)) : 0;
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, zIndex: maxZ + 1 } : n));

    // Calculate offset from top-left of the note in world coordinates
    const mouseWorld = toWorld(e.clientX, e.clientY);
    const offsetX = mouseWorld.x - note.x;
    const offsetY = mouseWorld.y - note.y;

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
      const mouseWorld = toWorld(e.clientX, e.clientY);
      const deltaX = mouseWorld.x - resizeState.startX;
      const deltaY = mouseWorld.y - resizeState.startY;

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

    const mouseWorld = toWorld(e.clientX, e.clientY);
    
    // Calculate Delta for the PRIMARY dragged note
    // But wait, we need to know where it WAS to apply delta to others.
    // Simpler: Calculate the expected NEW position for the primary note, find the delta, apply to all.
    
    // Current primary note in state (before this move frame)
    const primaryNote = notes.find(n => n.id === dragState.noteId);
    if (!primaryNote) return;

    const newPrimaryX = mouseWorld.x - dragState.offsetX;
    const newPrimaryY = mouseWorld.y - dragState.offsetY;

    const deltaX = newPrimaryX - primaryNote.x;
    const deltaY = newPrimaryY - primaryNote.y;

    // Optimistic UI update
    setNotes(prev => prev.map(n => {
        if (selectedIds.has(n.id)) {
             return { ...n, x: n.x + deltaX, y: n.y + deltaY };
        }
        return n;
    }));
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (dragState.isDragging && dragState.noteId) {
      // Persist the final position for ALL selected notes
      const selectedNotes = notes.filter(n => selectedIds.has(n.id));
      for (const note of selectedNotes) {
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


  // --- Infinity Canvas Logic ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
         if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
             const activeTag = document.activeElement?.tagName.toLowerCase();
             if (activeTag === 'textarea' || activeTag === 'input') return;

             const idsToDelete = Array.from(selectedIds);
             idsToDelete.forEach(id => handleDeleteNote(id));
             
             setNotes(prev => prev.filter(n => !selectedIds.has(n.id)));
             setSelectedIds(new Set());
             
             Promise.all(idsToDelete.map(id => NoteService.deleteNote(id)));
         }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, handleDeleteNote]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.max(0.1, Math.min(5, viewState.scale * (1 + delta)));

        // Calculate world point under cursor before zoom
        const mouseWorld = toWorld(e.clientX, e.clientY);

        // Update scale
        // We want the point under the cursor to remain at the same screen position
        // newScreen = mouseWorld * newScale + newOffset
        // e.clientX = mouseWorld.x * newScale + newOffset.x
        // newOffset.x = e.clientX - mouseWorld.x * newScale

        const newOffset = {
            x: e.clientX - mouseWorld.x * newScale,
            y: e.clientY - mouseWorld.y * newScale,
        };

        setViewState({
            scale: newScale,
            offset: newOffset,
        });
    } else {
        // Panning with trackpad or regular scroll
        // Optional: Implement trackpad panning here if desired, 
        // for now let's stick to simple implementation or browser default
        // But preventing default zoom is good practice if we handle it
        if(e.ctrlKey) e.preventDefault();
         setViewState(prev => ({
            ...prev,
            offset: {
                x: prev.offset.x - e.deltaX,
                y: prev.offset.y - e.deltaY,
            }
        }));
    }
  };

  const [panStart, setPanStart] = useState<{x: number, y: number} | null>(null);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
      if (isSpacePressed || e.button === 1) { // Space or Middle Click
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY });
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
          e.preventDefault();
      } else {
          // Start Rubber Band Selection
          setIsSelecting(true);
          const worldPos = toWorld(e.clientX, e.clientY);
          selectionStartRef.current = worldPos;
          setSelectionBox({ x: worldPos.x, y: worldPos.y, width: 0, height: 0 });
          (e.currentTarget as Element).setPointerCapture(e.pointerId);

          // If click on empty space without shift, clear selection
          if (!e.shiftKey) {
              setSelectedIds(new Set());
          }
      }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
      if (isPanning && panStart) {
          const deltaX = e.clientX - panStart.x;
          const deltaY = e.clientY - panStart.y;
          
          setViewState(prev => ({
              ...prev,
              offset: {
                  x: prev.offset.x + deltaX,
                  y: prev.offset.y + deltaY,
              }
          }));
          
          setPanStart({ x: e.clientX, y: e.clientY });
      }

      if (isSelecting && selectionStartRef.current) {
          const currentWorld = toWorld(e.clientX, e.clientY);
          
          const x = Math.min(selectionStartRef.current.x, currentWorld.x);
          const y = Math.min(selectionStartRef.current.y, currentWorld.y);
          const width = Math.abs(currentWorld.x - selectionStartRef.current.x);
          const height = Math.abs(currentWorld.y - selectionStartRef.current.y);

          setSelectionBox({ x, y, width, height });

          // Update real-time selection ? (Expensive loop?)
          // Doing it on move gives immediate feedback.
          // Check intersection
          const newSelection = new Set<string>();
          // If shift key, we probably want to UNION with existing? 
          // Current logic: simple selection box REPLACES or ADDS?
          // Standard behavior: 
          // - Click empty: reset.
          // - Drag box: select items inside. Shift+Drag: Toggle/Add.
          // Let's implement: Box Drag ALWAYS sets the selection to "What is in box". 
          // (Unless we want to get fancy with Shift).
          // Let's stick to "Box sets selection".
          
          notes.forEach(note => {
              // Note rect
              const nRight = note.x + note.width;
              const nBottom = note.y + note.height;
              
              // Box rect
              const bRight = x + width;
              const bBottom = y + height;

              // Check overlap
              const overlaps = !(note.x > bRight || nRight < x || note.y > bBottom || nBottom < y);
              
              if (overlaps) {
                  newSelection.add(note.id);
              }
          });
          
          // If Shift was held, we might want to MERGE with initial selection?
          // For simplicity v1: Box defines selection.
          setSelectedIds(newSelection);
      }
      
      // Pass to note logic
      handlePointerMove(e);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
      if (isPanning) {
          setIsPanning(false);
          setPanStart(null);
      }
      if (isSelecting) {
          setIsSelecting(false);
          setSelectionBox(null);
          selectionStartRef.current = null;
      }
      // Pass to note logic
      handlePointerUp(e);
  };

  const handleMinimapNavigate = (x: number, y: number) => {
      // (x, y) is the World Coordinate we want to center on screen
      // ScreenCenter = World * Scale + Offset
      // Offset = ScreenCenter - World * Scale
      const screenCenterX = windowSize.width / 2;
      const screenCenterY = windowSize.height / 2;
      
      const newOffsetX = screenCenterX - x * viewState.scale;
      const newOffsetY = screenCenterY - y * viewState.scale;
      
      setViewState(prev => ({
          ...prev,
          offset: { x: newOffsetX, y: newOffsetY }
      }));
  };

  return (
    <div 
      className={`w-full h-full bg-dot-pattern relative overflow-hidden select-none ${isSpacePressed || isPanning ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onWheel={handleWheel}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onDoubleClick={(e) => {
           if(e.target === e.currentTarget && !isPanning) {
               const point = toWorld(e.clientX, e.clientY);
               const x = point.x - 120; 
               const y = point.y - 90;
               NoteService.createNote(x, y, DEFAULT_NOTE_COLOR).then(newNote => {
                   setNotes(prev => [...prev, newNote]);
               });
           }
      }}
    >
      <div 
        style={{
            transform: `translate(${viewState.offset.x}px, ${viewState.offset.y}px) scale(${viewState.scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
        }}
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
          note={note} // Position is world coordinates
          onMouseDown={handlePointerDown}
          onUpdateContent={handleUpdateContent}
          onDelete={handleDeleteNote}
          onChangeColor={handleChangeColor}
          onResizeStart={handleResizeStart}
          isSelected={selectedIds.has(note.id)}
        />
      ))}
      
      {/* Selection Box Render */}
      {selectionBox && (
          <div
             className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-50"
             style={{
                 left: selectionBox.x,
                 top: selectionBox.y,
                 width: selectionBox.width,
                 height: selectionBox.height,
             }}
          />
      )}
      </div>

      {/* UI Controls */}
      <Toolbar 
        onAddNote={handleAddNote} 
        onClearAll={handleClearAll}
        onAutoArrange={handleAutoArrange}
        noteCount={notes.length}
      />

      <Minimap 
        notes={notes}
        viewState={viewState}
        windowSize={windowSize}
        onNavigate={handleMinimapNavigate}
      />
      
      <div className="fixed top-4 right-4 text-slate-300 text-xs pointer-events-none">
        Auto-saved to LocalStorage
      </div>
    </div>
  );
};

export default App;