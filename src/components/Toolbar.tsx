import React from 'react';
import { NoteColor } from '../types';
import { NOTE_COLORS } from '../constants';

interface ToolbarProps {
  onAddNote: (color: NoteColor) => void;
  onClearAll: () => void;
  onAutoArrange?: () => void;
  noteCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddNote, onClearAll, onAutoArrange, noteCount }) => {
  return (
    <div 
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl p-2 flex items-center space-x-4 border border-slate-200 z-50"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center space-x-2 px-2 border-r border-slate-200 pr-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mới</span>
        {NOTE_COLORS.map((colorObj) => (
          <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddNote(colorObj.value);
            }}
            className={`w-8 h-8 rounded-full shadow-sm hover:scale-110 transition-transform border border-slate-300 ${colorObj.value}`}
            title={`Tạo note màu ${colorObj.label}`}
          />
        ))}
      </div>

      <div className="flex items-center space-x-3 pl-1">
        {onAutoArrange && (
            <button
                onClick={onAutoArrange}
                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Sắp xếp tự động"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
        )}

        <div className="pr-2 text-sm text-slate-500 font-medium">
          {noteCount} Notes
        </div>
      </div>
    </div>
  );
};