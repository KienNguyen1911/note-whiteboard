# Setup Supabase cho Note Whiteboard

## 1. Tạo Supabase Project

1. Truy cập [Supabase Console](https://supabase.com/dashboard)
2. Đăng nhập hoặc tạo tài khoản
3. Tạo project mới (chọn region gần nhất)
4. Chờ project khởi tạo

## 2. Tạo Table `notes` và `pages`

1. Vào **SQL Editor**
2. Chạy query sau để tạo table:

```sql
/** 
 * TABLE: pages 
 * Description: Stores individual whiteboard pages
 */
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Page',
  created_at BIGINT NOT NULL
);

/** 
 * TABLE: notes 
 * Description: Stores stickies, linking them to a page
 */
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  page_id TEXT REFERENCES pages(id) ON DELETE CASCADE, -- New foreign key
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
CREATE INDEX idx_notes_page_id ON notes(page_id); -- New index for filtering by page

-- Insert default page if needed (Optional for manual setup, code handles creation)
-- INSERT INTO pages (id, title, created_at) VALUES ('default', 'My First Page', extract(epoch from now()) * 1000);
```

### Migration only (Nếu đã có table `notes` cũ):

Nếu bạn đã có data cũ và muốn giữ lại, hãy chạy lệnh này để migrate:

```sql
-- 1. Create pages table
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Page',
  created_at BIGINT NOT NULL
);

-- 2. Create a default page for existing notes
INSERT INTO pages (id, title, created_at) 
VALUES ('default', 'Home Page', (extract(epoch from now()) * 1000)::bigint);

-- 3. Update notes table
ALTER TABLE notes ADD COLUMN page_id TEXT REFERENCES pages(id) ON DELETE CASCADE;
UPDATE notes SET page_id = 'default' WHERE page_id IS NULL;

-- 4. Add index
CREATE INDEX idx_notes_page_id ON notes(page_id);
```

## 3. Cấu hình RLS (Row Level Security) - Tùy chọn

Nếu muốn public access (cho demo), vào **Authentication** > **Policies**:

```sql
-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Public read/write policy for NOTES
CREATE POLICY "Allow public read notes" ON notes FOR SELECT USING (true);
CREATE POLICY "Allow public insert notes" ON notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notes" ON notes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete notes" ON notes FOR DELETE USING (true);

-- Public read/write policy for PAGES
CREATE POLICY "Allow public read pages" ON pages FOR SELECT USING (true);
CREATE POLICY "Allow public insert pages" ON pages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update pages" ON pages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete pages" ON pages FOR DELETE USING (true);
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
