import React, { useState, useEffect } from 'react';
import { PageService } from '../services/pageService';
import { Page } from '../types';
import { Plus, Layout, Trash2, ChevronRight, MoreVertical } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPageId = location.pathname.split('/board/')[1];

  const fetchPages = async () => {
    const loadedPages = await PageService.getAllPages();
    setPages(loadedPages);
    
    if (loadedPages.length === 0) {
        const newPage = await PageService.createPage("My First Board");
        setPages([newPage]);
        navigate(`/board/${newPage.id}`);
    } else if (!currentPageId && loadedPages.length > 0) {
        navigate(`/board/${loadedPages[0].id}`);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleCreatePage = async () => {
    const title = prompt("Tên bảng mới:", "New Board");
    if (title) {
        const newPage = await PageService.createPage(title);
        setPages(prev => [...prev, newPage]);
        navigate(`/board/${newPage.id}`);
    }
  };
  
  const handleDeletePage = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm("Bạn có chắc chắn muốn xóa không?")) {
          await PageService.deletePage(id);
          const newPages = pages.filter(p => p.id !== id);
          setPages(newPages);
          if (currentPageId === id) {
              if (newPages.length > 0) {
                  navigate(`/board/${newPages[0].id}`);
              } else {
                  const newPage = await PageService.createPage("My First Board");
                  setPages([newPage]);
                  navigate(`/board/${newPage.id}`);
              }
          }
      }
  };

  return (
    <div 
        className={`
            fixed top-1/2 left-4 -translate-y-1/2 z-50 flex flex-col gap-4 font-sans
            transition-all duration-300 ease-in-out
            max-h-[90vh]
            ${isCollapsed ? 'w-16' : 'w-64'}
        `}
    >
      {/* Container: Glassmorphism */}
      <div className="backdrop-blur-xl bg-white/70 shadow-2xl border border-white/50 rounded-2xl overflow-hidden flex flex-col h-full">
        
        {/* Header */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between bg-white/40">
            {!isCollapsed && (
                <div className="flex items-center gap-2 text-slate-800 font-bold tracking-tight">
                    <div className="p-1.5 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/30 text-white">
                        <Layout size={18} />
                    </div>
                    <span>Boards</span>
                </div>
            )}
             
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`p-1 hover:bg-black/5 rounded-full transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
            >
                {isCollapsed ? <ChevronRight size={20} /> : <div className="text-slate-400"><Layout size={0} className="hidden"/></div>}
                 {/* Hack layout to keep size when expanded, or just use absolute toggle */}
            </button>
            
            {!isCollapsed && (
                <button 
                    onClick={handleCreatePage}
                    className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-700 hover:shadow-lg transition-all active:scale-95"
                    title="Thêm bảng mới"
                >
                    <Plus size={18} />
                </button>
            )}
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {pages.map(page => (
                <div 
                    key={page.id}
                    onClick={() => navigate(`/board/${page.id}`)}
                    className={`
                        group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border
                        ${currentPageId === page.id 
                            ? 'bg-white shadow-lg border-blue-200 ring-2 ring-blue-500/20 scale-[1.02]' 
                            : 'bg-white/40 border-transparent hover:bg-white/80 hover:shadow-md hover:scale-[1.01]'
                        }
                    `}
                >
                   {/* Icon Placeholder for Card Look */}
                   <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
                        ${currentPageId === page.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white'}
                   `}>
                        <span className="text-sm font-bold">{page.title.charAt(0).toUpperCase()}</span>
                   </div>

                   {!isCollapsed && (
                       <div className="flex-1 min-w-0" onDoubleClick={(e) => {
                           e.stopPropagation();
                           const newTitle = prompt("Đổi tên bảng:", page.title);
                           if (newTitle && newTitle !== page.title) {
                               PageService.updatePage(page.id, newTitle).then(() => {
                                   setPages(prev => prev.map(p => p.id === page.id ? { ...p, title: newTitle } : p));
                               });
                           }
                       }}>
                           <h3 className={`font-semibold text-sm truncate ${currentPageId === page.id ? 'text-slate-900' : 'text-slate-600'}`} title="Double click to rename">
                               {page.title}
                           </h3>
                           <p className="text-[10px] text-slate-400">
                               {new Date(page.createdAt).toLocaleDateString()}
                           </p>
                       </div>
                   )}

                   {/* Delete Button (Only Show on Group Hover) */}
                   {!isCollapsed && (
                       <button
                           onClick={(e) => handleDeletePage(e, page.id)}
                           className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                       >
                           <Trash2 size={14} />
                       </button>
                   )}
                </div>
            ))}
            
            {/* Create Button (Collapsed Mode) */}
            {isCollapsed && (
                 <button 
                    onClick={handleCreatePage}
                    className="w-full flex justify-center p-3 bg-slate-100/50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-xl transition-colors"
                >
                    <Plus size={20} />
                </button>
            )}
        </div>

        {/* Footer info */}
        {!isCollapsed && (
            <div className="p-3 text-[10px] text-center text-slate-400 border-t border-white/20">
                {pages.length} Boards
            </div>
        )}
      </div>
    </div>
  );
};

