-- Debug script for Supabase Popular Jamms
-- Run this in your Supabase SQL Editor to troubleshoot

-- 1. Check if tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('playlist_plays', 'popular_jamms');

-- 2. Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('playlist_plays', 'popular_jamms');

-- 3. Temporarily DISABLE RLS for testing (CAUTION: Only for debugging!)
ALTER TABLE playlist_plays DISABLE ROW LEVEL SECURITY;

-- 4. Check what data exists in playlist_plays
SELECT * FROM playlist_plays LIMIT 5;

-- 5. View current RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('playlist_plays', 'popular_jamms');

-- 6. TO RE-ENABLE RLS after testing (IMPORTANT: Run this after debugging):
-- ALTER TABLE playlist_plays ENABLE ROW LEVEL SECURITY;

-- 7. Alternative: Create a more permissive RLS policy
DROP POLICY IF EXISTS "Allow public read access" ON playlist_plays;
CREATE POLICY "Allow public read access" ON playlist_plays FOR SELECT USING (true);