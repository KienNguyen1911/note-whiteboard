import { Note, NoteColor } from "../types";
import { STORAGE_KEY } from "../constants";

/**
 * Trong môi trường browser thuần túy (frontend-only) không có backend, 
 * việc sử dụng file SQLite trực tiếp (.db) đòi hỏi thư viện WASM (như sql.js) 
 * và load file async khá phức tạp cho một bản demo single-file.
 * 
 * Service này được thiết kế theo Pattern Repository, cho phép dễ dàng 
 * thay thế phần ruột (implementation) bằng SQLite thật hoặc API backend sau này 
 * mà không ảnh hưởng đến UI. Hiện tại nó dùng localStorage để đảm bảo dữ liệu bền vững.
 */

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const NoteService = {
  /**
   * Lấy tất cả notes (Tương đương: SELECT * FROM notes)
   */
  getAllNotes: async (): Promise<Note[]> => {
    return new Promise((resolve) => {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          resolve(JSON.parse(data));
        } else {
          resolve([]);
        }
      } catch (e) {
        console.error("Failed to load notes", e);
        resolve([]);
      }
    });
  },

  /**
   * Tạo note mới (Tương đương: INSERT INTO notes ...)
   */
  createNote: async (x: number, y: number, color: NoteColor): Promise<Note> => {
    const notes = await NoteService.getAllNotes();
    
    // Tìm max z-index
    const maxZ = notes.length > 0 ? Math.max(...notes.map(n => n.zIndex)) : 0;

    const newNote: Note = {
      id: generateId(),
      content: '',
      x,
      y,
      width: 240,
      height: 180,
      color,
      zIndex: maxZ + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    notes.push(newNote);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return newNote;
  },

  /**
   * Cập nhật note (Tương đương: UPDATE notes SET ... WHERE id = ?)
   */
  updateNote: async (updatedNote: Note): Promise<void> => {
    const notes = await NoteService.getAllNotes();
    const index = notes.findIndex(n => n.id === updatedNote.id);
    if (index !== -1) {
      notes[index] = { ...updatedNote, updatedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  },

  /**
   * Xóa note (Tương đương: DELETE FROM notes WHERE id = ?)
   */
  deleteNote: async (id: string): Promise<void> => {
    let notes = await NoteService.getAllNotes();
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  },

  /**
   * Cập nhật vị trí note (Tối ưu hóa performance)
   */
  updatePosition: async (id: string, x: number, y: number): Promise<void> => {
    const notes = await NoteService.getAllNotes();
    const note = notes.find(n => n.id === id);
    if (note) {
      note.x = x;
      note.y = y;
      note.updatedAt = Date.now();
      // Đưa note đang di chuyển lên trên cùng (zIndex cao nhất)
      const maxZ = Math.max(...notes.map(n => n.zIndex));
      note.zIndex = maxZ + 1;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  },

  /**
   * Cập nhật nội dung
   */
  updateContent: async (id: string, content: string): Promise<void> => {
    const notes = await NoteService.getAllNotes();
    const note = notes.find(n => n.id === id);
    if (note) {
      note.content = content;
      note.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  },
  
  /**
   * Xóa toàn bộ dữ liệu (Clear DB)
   */
  clearAll: async (): Promise<void> => {
      localStorage.removeItem(STORAGE_KEY);
  }
};