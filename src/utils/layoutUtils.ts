import { Note } from '../types';
import { DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT } from '../constants';

const GAP = 20;

export const autoArrangeNotes = (notes: Note[]): Note[] => {
    if (notes.length === 0) return [];

    const GAP = 20;

    // 1. Sort notes to preserve relative order (Strict Y-major, then X)
    // This ensures we process notes from top-to-bottom, left-to-right
    const sortedNotes = [...notes].sort((a, b) => {
        if (Math.abs(a.y - b.y) > 10) return a.y - b.y; // Allow small pixel tolerance but mostly strict Y
        return a.x - b.x;
    });

    // Calculate target width (try to keep aspect ratio roughly 3:2 or square)
    const totalArea = sortedNotes.reduce((acc, note) => acc + (note.width * note.height), 0);
    const averageAspectRatio = 3 / 2;
    const calculatedWidth = Math.sqrt(totalArea * averageAspectRatio * 1.2);
    const MAX_WIDTH = Math.max(1000, calculatedWidth);

    const placedNotes: Note[] = [];

    // Helper to check for overlaps
    const checkOverlap = (target: { x: number, y: number, width: number, height: number }) => {
        for (const p of placedNotes) {
            // Check intersection with gap considered attached to the note or not?
            // We usually want exact rectangle intersection.
            // If we place at X, we need space from X to X+W.
            // Existing note P is from P.x to P.x+P.w. 
            // But we enforce GAP between them. 
            // So effectively we check if (RECT) overlaps with (P_RECT expanded by GAP/2) ??
            // Simpler: Check if rectangles overlap.
            // note1.right < note2.left OR note1.left > note2.right ...

            // We want actual gap between them.
            // Intersection condition:
            // !(r1.right + GAP <= r2.left || r1.left >= r2.right + GAP || r1.bottom + GAP <= r2.top || r1.top >= r2.bottom + GAP)

            // Actually standard AABB intersection:
            // Overlap X: target.x < p.x + p.width + GAP && target.x + target.width + GAP > p.x
            // Overlap Y: target.y < p.y + p.height + GAP && target.y + target.height + GAP > p.y

            const overlapX = target.x < (p.x + p.width + GAP) && (target.x + target.width + GAP) > p.x;
            const overlapY = target.y < (p.y + p.height + GAP) && (target.y + target.height + GAP) > p.y;

            if (overlapX && overlapY) return true;
        }
        return false;
    };

    for (const note of sortedNotes) {
        // Generate candidate positions
        // 1. (0,0)
        // 2. To the right of each placed note
        // 3. Below each placed note
        // 4. Start of rows (x=0, below each placed note)

        let candidates: { x: number, y: number }[] = [{ x: 0, y: 0 }];

        for (const p of placedNotes) {
            candidates.push({ x: p.x + p.width + GAP, y: p.y }); // Right
            candidates.push({ x: p.x, y: p.y + p.height + GAP }); // Below
            candidates.push({ x: 0, y: p.y + p.height + GAP }); // New Row
        }

        // Filter valid candidates (within MAX_WIDTH)
        candidates = candidates.filter(c => c.x + note.width <= MAX_WIDTH);

        // Sort candidates: Top-most first, then Left-most
        candidates.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });

        // Find first valid position
        let found = false;
        for (const pos of candidates) {
            if (!checkOverlap({ ...pos, width: note.width, height: note.height })) {
                placedNotes.push({ ...note, x: pos.x, y: pos.y });
                found = true;
                break;
            }
        }

        // If no candidate works (unlikely with infinite bottom), usually just place at bottom
        // Fallback: Max Y of flow
        if (!found) {
            // This theoretically shouldn't happen if we have infinite height candidates (candidates include bottom of every note)
            // But simply place at the very bottom left
            const maxY = placedNotes.length > 0 ? Math.max(...placedNotes.map(n => n.y + n.height + GAP)) : 0;
            placedNotes.push({ ...note, x: 0, y: maxY });
        }
    }

    return placedNotes;
};
