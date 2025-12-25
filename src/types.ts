export enum NoteColor {
  YELLOW = 'bg-yellow-200',
  BLUE = 'bg-blue-200',
  GREEN = 'bg-green-200',
  RED = 'bg-red-200',
  PURPLE = 'bg-purple-200',
  GRAY = 'bg-gray-200',
}

export interface Position {
  x: number;
  y: number;
}

export interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: NoteColor;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface DragState {
  isDragging: boolean;
  noteId: string | null;
  offsetX: number;
  offsetY: number;
}

export interface ViewState {
  scale: number;
  offset: Position;
}