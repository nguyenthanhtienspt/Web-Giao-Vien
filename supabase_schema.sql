-- ==============================================================================
-- CƠ SỞ DỮ LIỆU TRỢ LÝ LỚP HỌC (SUPABASE POSTGRESQL SCHEMA)
-- Hướng dẫn: Mở Supabase Dashboard -> Vào mục SQL Editor -> Dán toàn bộ nội dung này và bấm "Run"
-- ==============================================================================

-- 1. Bảng hồ sơ Giáo viên (Profiles) liên kết với tài khoản xác thực Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  school_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kích hoạt Row Level Security (RLS) cho bảng profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Chính sách: Giáo viên chỉ được xem và cập nhật hồ sơ của chính mình
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Tự động tạo hồ sơ khi một Giáo viên mới đăng ký tài khoản (Google hoặc Email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 2. Bảng Danh sách lớp học của Giáo viên (Classes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  student_count INT DEFAULT 0,
  students JSONB DEFAULT '[]'::jsonb,
  updated_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kích hoạt Row Level Security (RLS) cho bảng classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Chính sách RLS: Mỗi giáo viên chỉ được Xem, Thêm, Sửa, Xoá các lớp do chính mình tạo
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes' AND policyname = 'Teachers can view own classes') THEN
    CREATE POLICY "Teachers can view own classes" ON public.classes FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes' AND policyname = 'Teachers can insert own classes') THEN
    CREATE POLICY "Teachers can insert own classes" ON public.classes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes' AND policyname = 'Teachers can update own classes') THEN
    CREATE POLICY "Teachers can update own classes" ON public.classes FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes' AND policyname = 'Teachers can delete own classes') THEN
    CREATE POLICY "Teachers can delete own classes" ON public.classes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Chỉ mục để tối ưu tốc độ tải danh sách lớp của giáo viên
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON public.classes(user_id);
