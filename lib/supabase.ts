import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase environment variables missing.');
}

// Use type inference from supabase-js
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PopularJamm = {
  id: number
  title: string
  artist: string
  genre: string
  plays: number
  youtube_id: string
  created_at: string
  updated_at: string
}

export type PlaylistPlay = {
  id: number
  youtube_url: string
  playlist_id: string
  playlist_title: string | null
  playlist_author: string | null
  plays: number
  created_at: string
  updated_at: string
}