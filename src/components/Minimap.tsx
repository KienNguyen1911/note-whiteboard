import React, { useMemo, useState, useRef } from 'react';
import { Note, ViewState } from '../types';

interface MinimapProps {
  notes: Note[];
  viewState: ViewState;
  windowSize: { width: number; height: number };
  onNavigate?: (x: number, y: number) => void;
}

const MINIMAP_WIDTH = 240;
const MINIMAP_HEIGHT = 160;
const PADDING = 20; // Padding around the content in world units (before scaling)

export const Minimap: React.FC<MinimapProps> = ({ notes, viewState, windowSize, onNavigate }) => {
  const { bounds, scale, contentOffset } = useMemo(() => {
    // 1. Calculate World Viewport
    // The viewport in world coordinates
    // viewState.offset is the translation applied TO the world to get to screen.
    // Screen = World * scale + offset
    // World = (Screen - offset) / scale
    
    const viewportX = -viewState.offset.x / viewState.scale;
    const viewportY = -viewState.offset.y / viewState.scale;
    const viewportW = windowSize.width / viewState.scale;
    const viewportH = windowSize.height / viewState.scale;

    // 2. Calculate Bounds including notes and viewports
    let minX = viewportX;
    let minY = viewportY;
    let maxX = viewportX + viewportW;
    let maxY = viewportY + viewportH;

    if (notes.length > 0) {
      const noteMinX = Math.min(...notes.map(n => n.x));
      const noteMinY = Math.min(...notes.map(n => n.y));
      const noteMaxX = Math.max(...notes.map(n => n.x + n.width));
      const noteMaxY = Math.max(...notes.map(n => n.y + n.height));

      minX = Math.min(minX, noteMinX);
      minY = Math.min(minY, noteMinY);
      maxX = Math.max(maxX, noteMaxX);
      maxY = Math.max(maxY, noteMaxY);
    }

    // Add some padding to the bounds
    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;

    // 3. Calculate Scale to fit in Minimap
    const scaleX = MINIMAP_WIDTH / (worldWidth + PADDING * 2);
    const scaleY = MINIMAP_HEIGHT / (worldHeight + PADDING * 2);
    const minimapScale = Math.min(scaleX, scaleY);

    // 4. Calculate Offset to center content in Minimap
    // We want (minX - PADDING) to map to 0 (or centered)
    // Actually, let's just use the top-left of the bounds as the origin for the minimap
    
    // Center the content if aspect ratios match, otherwise just align top-left logic
    const contentW = (worldWidth + PADDING * 2) * minimapScale;
    const contentH = (worldHeight + PADDING * 2) * minimapScale;
    
    const offsetX = (MINIMAP_WIDTH - contentW) / 2;
    const offsetY = (MINIMAP_HEIGHT - contentH) / 2;

    return {
      bounds: { minX: minX - PADDING, minY: minY - PADDING },
      scale: minimapScale,
      contentOffset: { x: offsetX, y: offsetY },
      viewport: { x: viewportX, y: viewportY, w: viewportW, h: viewportH }
    };
  }, [notes, viewState, windowSize]);

  // Helper to map world coordinates to minimap coordinates
  const toMinimap = (x: number, y: number) => {
    return {
      x: (x - bounds.minX) * scale + contentOffset.x,
      y: (y - bounds.minY) * scale + contentOffset.y
    };
  };

  const viewportRect = useMemo(() => {
     const { viewport } = {
        viewport: { 
            x: -viewState.offset.x / viewState.scale,
            y: -viewState.offset.y / viewState.scale,
            w: windowSize.width / viewState.scale,
            h: windowSize.height / viewState.scale
        }
     };
     const pos = toMinimap(viewport.x, viewport.y);
     return {
         x: pos.x,
         y: pos.y,
         w: viewport.w * scale,
         h: viewport.h * scale
     };
  }, [viewState, windowSize, bounds, scale, contentOffset]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
      setIsNavigating(true);
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      handleNavigation(e);
      e.stopPropagation(); // Prevent bubbling to main canvas
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (isNavigating) {
          handleNavigation(e);
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      setIsNavigating(false);
  };

  const handleNavigation = (e: React.PointerEvent) => {
      if (!onNavigate || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert Minimap Click -> World Coordinate
      // Minimap = (World - Bounds.min) * Scale + ContentOffset
      // World = (Minimap - ContentOffset) / Scale + Bounds.min
      
      const worldX = (clickX - contentOffset.x) / scale + bounds.minX;
      const worldY = (clickY - contentOffset.y) / scale + bounds.minY;
      
      onNavigate(worldX, worldY);
  };

  return (
    <div 
        ref={containerRef}
        className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg rounded-lg overflow-hidden pointer-events-auto cursor-crosshair"
        style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
    >
      {/* Notes */}
      {notes.map(note => {
          const pos = toMinimap(note.x, note.y);
          return (
            <div
                key={note.id}
                className={`absolute rounded-xs ${note.color.replace('bg-', 'bg-opacity-50 bg-')}`} // Use reduced opacity
                style={{
                    left: pos.x,
                    top: pos.y,
                    width: note.width * scale,
                    height: note.height * scale,
                    backgroundColor: '#cbd5e1' // Fallback or override if needed, but let's try classes first
                }}
            >
             {/* We rely on tailwind classes from note.color. 
                 NoteColor enum has values like 'bg-yellow-200'.
                 We can map them to darker shades for visibility or keep as is.
             */}
              <div className={`w-full h-full ${note.color}`}></div>
            </div>
          );
      })}

      {/* Viewport Indicator */}
      <div 
        className="absolute border-2 border-red-500/50 bg-red-500/10 pointer-events-none transition-all duration-75"
        style={{
            left: viewportRect.x,
            top: viewportRect.y,
            width: viewportRect.w,
            height: viewportRect.h,
        }}
      />
    </div>
  );
};
