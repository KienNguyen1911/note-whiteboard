# Setup Supabase cho Note Whiteboard

## 1. Tạo Supabase Project

1. Truy cập [Supabase Console](https://supabase.com/dashboard)
2. Đăng nhập hoặc tạo tài khoản
3. Tạo project mới (chọn region gần nhất)
4. Chờ project khởi tạo

## 2. Tạo Table `notes`

1. Vào **SQL Editor**
2. Chạy query sau để tạo table:

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  color TEXT NOT NULL,
  z_index INTEGER NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Tạo index để tối ưu performance
CREATE INDEX idx_notes_z_index ON notes(z_index);
CREATE INDEX idx_notes_updated_at ON notes(updated_at);
```

## 3. Cấu hình RLS (Row Level Security) - Tùy chọn

Nếu muốn public access (cho demo), vào **Authentication** > **Policies**:

```sql
-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Public read/write policy
CREATE POLICY "Allow public read" ON notes
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON notes
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON notes
  FOR DELETE USING (true);
```

## 4. Lấy Credentials

1. Vào **Project Settings** > **API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 5. Cấu hình Environment

1. Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

2. Điền credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 6. Chạy Project

```bash
npm run dev
```

## Các Lưu Ý

- ⚠️ **Không commit `.env`** - thêm vào `.gitignore`
- 🔒 Đối với production, cần implement authentication
- 📡 Supabase có free tier với limitations, check pricing
- 🚀 Có thể thêm realtime subscriptions để sync qua các tab

## Troubleshooting

**Lỗi: "Missing Supabase environment variables"**
- Kiểm tra file `.env` có chứa URL và key chưa

**Data không lưu được**
- Kiểm tra RLS policies
- Xem error message trong browser console
- Kiểm tra Supabase logs

**Connection timeout**
- Kiểm tra URL Supabase đúng chưa
- Kiểm tra network connection
