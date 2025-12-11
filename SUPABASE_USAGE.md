# Hướng Dẫn Sử Dụng Supabase trong Note Whiteboard

## 📋 Tổng Quan

Dự án này sử dụng **Supabase** để lưu trữ dữ liệu note. Các thay đổi sẽ được tự động lưu lên database.

## 🚀 Features Hiện Tại

| Feature | Status | Supabase Function |
|---------|--------|-------------------|
| Tạo note | ✅ | `createNote()` |
| Sửa nội dung | ✅ | `updateContent()` |
| Xóa note | ✅ | `deleteNote()` |
| Di chuyển note | ✅ | `updatePosition()` |
| Xóa tất cả | ✅ | `clearAll()` |

## 📁 Cấu Trúc File

```
src/services/
├── supabaseClient.ts    # Kết nối Supabase
├── noteService.ts       # CRUD operations
└── errorHandler.ts      # Xử lý lỗi
```

## 🔧 API Reference

### NoteService.getAllNotes()
**Lấy tất cả notes từ database**

```typescript
const notes = await NoteService.getAllNotes();
// Returns: Note[]
```

### NoteService.createNote(x, y, color)
**Tạo note mới**

```typescript
const newNote = await NoteService.createNote(100, 100, NoteColor.YELLOW);
// Returns: Note
```

**Parameters:**
- `x`: number - Vị trí X (pixels)
- `y`: number - Vị trí Y (pixels)
- `color`: NoteColor - Màu sắc

### NoteService.updateContent(id, content)
**Cập nhật nội dung note**

```typescript
await NoteService.updateContent('note-id', 'Nội dung mới');
```

### NoteService.updatePosition(id, x, y, zIndex)
**Cập nhật vị trí và zIndex note**

```typescript
await NoteService.updatePosition('note-id', 200, 150, 10);
```

### NoteService.deleteNote(id)
**Xóa note**

```typescript
await NoteService.deleteNote('note-id');
```

### NoteService.clearAll()
**Xóa tất cả notes**

```typescript
await NoteService.clearAll();
```

## 🎨 Mở Rộng Features

### Thêm Feature: Đổi Màu Note

1. **Thêm method trong `noteService.ts`:**

```typescript
updateColor: async (id: string, color: NoteColor): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        color,
        updatedAt: Date.now(),
      })
      .eq('id', id);

    if (error) throw error;
  } catch (e) {
    console.error('Failed to update color:', e);
    throw e;
  }
}
```

2. **Gọi trong `App.tsx`:**

```typescript
const handleChangeColor = useCallback(async (id: string, color: NoteColor) => {
  setNotes(prev => prev.map(n => n.id === id ? { ...n, color } : n));
  await NoteService.updateColor(id, color);
}, []);
```

### Thêm Feature: Realtime Sync

```typescript
// Lắng nghe thay đổi realtime
const subscribeToNotes = () => {
  const subscription = supabase
    .from('notes')
    .on('*', (payload) => {
      console.log('Change received!', payload)
    })
    .subscribe();
};
```

### Thêm Feature: Search Notes

```typescript
searchNotes: async (query: string): Promise<Note[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .ilike('content', `%${query}%`);

  if (error) throw error;
  return data as Note[];
}
```

## 🐛 Debugging

### Xem Supabase Logs
1. Vào Supabase Dashboard > **Logs**
2. Filter by table `notes`

### Kiểm Tra Data
1. Vào **SQL Editor**
2. Chạy: `SELECT * FROM notes;`

### Enable Debug Mode
Thêm vào `.env`:
```env
VITE_DEBUG=true
```

Sau đó:
```typescript
if (import.meta.env.VITE_DEBUG) {
  console.log('Debug info', data);
}
```

## ⚠️ Lưu Ý Bảo Mật

1. **Credentials**
   - ❌ Không commit `.env`
   - ✅ Sử dụng environment variables
   - 🔒 Rotateate keys thường xuyên

2. **Row Level Security (RLS)**
   - Cần enable RLS cho production
   - Đặt policies phù hợp (user-based access)

3. **API Rate Limiting**
   - Check Supabase pricing
   - Có thể đạt limit trong development

## 📊 Performance Tips

1. **Batch Operations**
```typescript
// ❌ Không nên
for (let note of notes) {
  await NoteService.updateNote(note);
}

// ✅ Nên dùng batch
await supabase
  .from('notes')
  .upsert(notes);
```

2. **Debounce Updates**
```typescript
// Debounce content updates
const debouncedUpdate = debounce(
  (id, content) => NoteService.updateContent(id, content),
  500
);
```

3. **Select Specific Columns**
```typescript
const { data } = await supabase
  .from('notes')
  .select('id, content, x, y'); // Chỉ lấy columns cần thiết
```

## 📝 Changelog

**v1.0.0** - Initial Supabase Integration
- ✅ CRUD operations
- ✅ Position tracking
- ✅ Content editing
- ✅ Error handling

## 🆘 Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Data không lưu | Kiểm tra RLS policies, credentials |
| Slow performance | Thêm indexes, batch operations |
| "Not connected" | Kiểm tra SUPABASE_URL, network |
| Auth issues | Kiểm tra anon key permissions |

---

**Cần giúp?** Xem file `SUPABASE_SETUP.md` để setup chi tiết.
