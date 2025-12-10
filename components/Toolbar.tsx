import React from 'react';
import { NoteColor } from '../types';
import { NOTE_COLORS } from '../constants';

interface ToolbarProps {
  onAddNote: (color: NoteColor) => void;
  onClearAll: () => void;
  noteCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddNote, onClearAll, noteCount }) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl p-2 flex items-center space-x-4 border border-slate-200 z-50">
      <div className="flex items-center space-x-2 px-2 border-r border-slate-200 pr-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mới</span>
        {NOTE_COLORS.map((colorObj) => (
          <button
            key={colorObj.value}
            onClick={() => onAddNote(colorObj.value)}
            className={`w-8 h-8 rounded-full shadow-sm hover:scale-110 transition-transform border border-slate-300 ${colorObj.value}`}
            title={`Tạo note màu ${colorObj.label}`}
          />
        ))}
      </div>

      <div className="flex items-center space-x-3 pl-1">
        <div className="text-sm text-slate-500 font-medium">
          {noteCount} Notes
        </div>
        <button
          onClick={() => {
            if(window.confirm('Bạn có chắc chắn muốn xóa tất cả note không?')) {
              onClearAll();
            }
          }}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Xóa tất cả"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </button>
      </div>
    </div>
  );
};