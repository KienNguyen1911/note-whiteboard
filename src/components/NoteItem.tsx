import React, { useRef, useEffect, useState } from 'react';
import { Note, NoteColor } from '../types';
import { Trash2, Maximize2 } from 'lucide-react'; // Assuming we can use lucide-react icons, otherwise stick to text or svg

interface NoteItemProps {
  note: Note;
  onMouseDown: (e: React.PointerEvent, noteId: string) => void;
  onUpdateContent: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onChangeColor: (id: string, color: NoteColor) => void;
  onResizeStart: (e: React.PointerEvent, noteId: string) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({ 
  note, 
  onMouseDown, 
  onUpdateContent,
  onDelete,
  onChangeColor,
  onResizeStart,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-focus logic for new empty notes could go here if desired
  
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent drag if clicking on the delete button or textarea (let text selection happen)
    // We only drag via the header/body background
    onMouseDown(e, note.id);
  };

  const handleStopPropagation = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`absolute flex flex-col shadow-lg rounded-lg transition-shadow duration-200 ${note.color} ${isHovered ? 'shadow-xl ring-2 ring-blue-400/30' : ''}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
        touchAction: 'none', // Critical for pointer events
        transform: 'translate3d(0,0,0)', // Hardware accel
      }}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header / Drag Handle */}
      <div className="h-6 w-full cursor-move flex items-center justify-between px-2 opacity-50 hover:opacity-100 transition-opacity rounded-t-lg">
        <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-slate-500/20"></div>
            <div className="w-2 h-2 rounded-full bg-slate-500/20"></div>
        </div>
        <button
            onPointerDown={handleStopPropagation}
            onClick={() => onDelete(note.id)}
            className="text-slate-600 hover:text-red-600 transition-colors"
            title="Xóa note"
        >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-3 pt-0 cursor-text h-full">
        <textarea
          ref={textareaRef}
          value={note.content}
          onChange={(e) => onUpdateContent(note.id, e.target.value)}
          onPointerDown={handleStopPropagation} // Allow text selection without dragging note
          placeholder="Viết gì đó..."
          className="w-full h-full bg-transparent resize-none outline-none text-slate-800 placeholder-slate-500 font-medium leading-relaxed"
          style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
        />
      </div>

      {/* Footer / Resizer (Visual only for now) */}
      <div 
        className="h-3 w-full cursor-se-resize flex justify-end px-1 absolute bottom-0 right-0 opacity-0 hover:opacity-100"
        onPointerDown={(e) => onResizeStart(e as React.PointerEvent, note.id)}
      >
         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m21 15-6 6"/><path d="m21 3-18 18"/></svg>
      </div>
    </div>
  );
};