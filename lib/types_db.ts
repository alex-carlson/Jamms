export type PlaylistPlay = {
  id: number;
  youtube_url: string;
  playlist_id: string;
  playlist_title: string | null;
  playlist_author: string | null;
  plays: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      playlist_plays: {
        Row: {
          id: number
          youtube_url: string
          playlist_id: string
          playlist_title: string | null
          playlist_author: string | null
          plays: number
          created_at: string
          updated_at: string
        }
        Insert: {
          youtube_url: string
          playlist_id: string
          playlist_title?: string | null
          playlist_author?: string | null
          plays?: number
        }
        Update: {
          youtube_url?: string
          playlist_id?: string
          playlist_title?: string | null
          playlist_author?: string | null
          plays?: number
        }
      }
    }
  }
}