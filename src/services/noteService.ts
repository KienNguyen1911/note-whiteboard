import { Note, NoteColor } from "../types";
import { supabase } from "./supabaseClient";

/**
 * NoteService - Quản lý dữ liệu note sử dụng Supabase
 * Service này được thiết kế theo Pattern Repository, cho phép dễ dàng
 * thay thế phần ruột mà không ảnh hưởng đến UI.
 * 
 * Supabase được sử dụng để lưu trữ dữ liệu trên cloud,
 * đảm bảo dữ liệu bền vững và có thể đồng bộ qua các thiết bị.
 */

const TABLE_NAME = 'notes';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper function để làm tròn số (vì Supabase yêu cầu INTEGER)
const roundToInt = (value: number): number => Math.round(value);

export const NoteService = {
  /**
   * Lấy tất cả notes từ Supabase (SELECT * FROM notes)
   */
  getAllNotes: async (): Promise<Note[]> => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('z_index', { ascending: true });

      if (error) {
        console.error('Error fetching notes from Supabase:', error);
        return [];
      }

      // Convert snake_case from DB to camelCase for app
      return (data as any[]).map(note => ({
        id: note.id,
        content: note.content,
        x: note.x,
        y: note.y,
        width: note.width,
        height: note.height,
        color: note.color,
        zIndex: note.z_index,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      }));
    } catch (e) {
      console.error('Failed to load notes:', e);
      return [];
    }
  },

  /**
   * Tạo note mới trong Supabase (INSERT INTO notes ...)
   */
  createNote: async (x: number, y: number, color: NoteColor): Promise<Note> => {
    try {
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

      // Convert camelCase to snake_case for DB
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          id: newNote.id,
          content: newNote.content,
          x: roundToInt(newNote.x),
          y: roundToInt(newNote.y),
          width: roundToInt(newNote.width),
          height: roundToInt(newNote.height),
          color: newNote.color,
          z_index: newNote.zIndex,
          created_at: newNote.createdAt,
          updated_at: newNote.updatedAt,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating note in Supabase:', error);
        throw error;
      }

      // Convert back to camelCase
      const dbData = data as any;
      return {
        id: dbData.id,
        content: dbData.content,
        x: dbData.x,
        y: dbData.y,
        width: dbData.width,
        height: dbData.height,
        color: dbData.color,
        zIndex: dbData.z_index,
        createdAt: dbData.created_at,
        updatedAt: dbData.updated_at,
      };
    } catch (e) {
      console.error('Failed to create note:', e);
      throw e;
    }
  },

  /**
   * Cập nhật note (UPDATE notes SET ... WHERE id = ?)
   */
  updateNote: async (updatedNote: Note): Promise<void> => {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          id: updatedNote.id,
          content: updatedNote.content,
          x: roundToInt(updatedNote.x),
          y: roundToInt(updatedNote.y),
          width: roundToInt(updatedNote.width),
          height: roundToInt(updatedNote.height),
          color: updatedNote.color,
          z_index: updatedNote.zIndex,
          created_at: updatedNote.createdAt,
          updated_at: Date.now(),
        })
        .eq('id', updatedNote.id);

      if (error) {
        console.error('Error updating note in Supabase:', error);
        throw error;
      }
    } catch (e) {
      console.error('Failed to update note:', e);
      throw e;
    }
  },

  /**
   * Xóa note (DELETE FROM notes WHERE id = ?)
   */
  deleteNote: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting note from Supabase:', error);
        throw error;
      }
    } catch (e) {
      console.error('Failed to delete note:', e);
      throw e;
    }
  },

  /**
   * Cập nhật vị trí note (Tối ưu hóa performance)
   */
  updatePosition: async (id: string, x: number, y: number, zIndex: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          x: roundToInt(x),
          y: roundToInt(y),
          z_index: zIndex,
          updated_at: Date.now(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating position in Supabase:', error);
        throw error;
      }
    } catch (e) {
      console.error('Failed to update position:', e);
      throw e;
    }
  },

  /**
   * Cập nhật nội dung note
   */
  updateContent: async (id: string, content: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          content,
          updated_at: Date.now(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating content in Supabase:', error);
        throw error;
      }
    } catch (e) {
      console.error('Failed to update content:', e);
      throw e;
    }
  },

  /**
   * Xóa toàn bộ dữ liệu (TRUNCATE TABLE notes)
   */
  clearAll: async (): Promise<void> => {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .neq('id', ''); // Delete all rows

      if (error) {
        console.error('Error clearing all notes from Supabase:', error);
        throw error;
      }
    } catch (e) {
      console.error('Failed to clear all notes:', e);
      throw e;
    }
  }
};