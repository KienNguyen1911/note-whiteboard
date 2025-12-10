import { NoteColor } from "./types";

export const DEFAULT_NOTE_WIDTH = 240;
export const DEFAULT_NOTE_HEIGHT = 180;
export const DEFAULT_NOTE_COLOR = NoteColor.YELLOW;

export const NOTE_COLORS = [
  { value: NoteColor.YELLOW, label: 'Vàng' },
  { value: NoteColor.BLUE, label: 'Xanh dương' },
  { value: NoteColor.GREEN, label: 'Xanh lá' },
  { value: NoteColor.RED, label: 'Đỏ' },
  { value: NoteColor.PURPLE, label: 'Tím' },
  { value: NoteColor.GRAY, label: 'Xám' },
];

export const STORAGE_KEY = 'whiteboard_notes_db_v1';