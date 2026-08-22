-- Migration to associate monitors with authenticated Supabase users

-- 1. Add user_id column to monitors table
ALTER TABLE public.monitors
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Index on user_id
CREATE INDEX IF NOT EXISTS idx_monitors_user_id ON public.monitors(user_id);

-- 3. Drop old public policies if they exist
DROP POLICY IF EXISTS "Allow public read access to monitors" ON public.monitors;
DROP POLICY IF EXISTS "Allow public insert to monitors" ON public.monitors;
DROP POLICY IF EXISTS "Allow public update to monitors" ON public.monitors;
DROP POLICY IF EXISTS "Allow public delete to monitors" ON public.monitors;

-- 4. User-Scoped RLS Policies for monitors
CREATE POLICY "Users can view their own monitors"
  ON public.monitors FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own monitors"
  ON public.monitors FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own monitors"
  ON public.monitors FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own monitors"
  ON public.monitors FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);