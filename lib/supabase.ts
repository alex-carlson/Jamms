import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// Create client only if env vars are present
let supabase: ReturnType<typeof createClient> | null = null

try {
  if (supabaseUrl && supabaseAnonKey) {
    // Validate URL early so malformed env values fail with an actionable message
    new URL(supabaseUrl)
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } else {
    console.error('❌ Supabase environment variables missing:', {
      url: supabaseUrl ? '✅ Set' : '❌ Missing',
      key: supabaseAnonKey ? '✅ Set' : '❌ Missing'
    })
  }
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error)
}

// Export the client (will be null if env vars are missing)
export { supabase }

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