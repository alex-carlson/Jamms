"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import Toast, { useToasts } from "../components/Toast";
import { supabase, PlaylistPlay } from "../../lib/supabase";

export default function PopularJamms() {
  const [playlists, setPlaylists] = useState<PlaylistPlay[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, dismissToast, showError, showSuccess } = useToasts();

  useEffect(() => {
    loadPopularPlaylists();
  }, []);

  const loadPopularPlaylists = async () => {
    try {
      console.log('🔍 Loading popular playlists from Supabase...');
      console.log('🔧 Environment check:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseClient: supabase ? 'Created' : 'Failed to create'
      });
      
      setLoading(true);

      // Check if Supabase client was created successfully
      if (!supabase) {
        throw new Error('Supabase client not initialized. Check environment variables in .env.local');
      }

      // Check if environment variables are set
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase environment variables not configured. Please check .env.local file.');
      }
      
      console.log('🚀 Making Supabase query...');
      const { data, error } = await supabase
        .from('playlist_plays')
        .select('*')
        .order('plays', { ascending: false })
        .limit(20); // Show top 20 playlists

      console.log('📊 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Successfully loaded playlists:', data?.length || 0, 'items');
      console.log('📋 Playlist data:', data);
      
      setPlaylists(data || []);
    } catch (err) {
      console.error('💥 Error in loadPopularPlaylists:', err);
      
      let errorMessage = 'Unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
          errorMessage = 'Network error: Check your Supabase configuration and internet connection';
        }
      }
      
      showError('Failed to load popular playlists', errorMessage);
    } finally {
      setLoading(false);
      console.log('🏁 Loading complete');
    }
  };

  const handlePlayPlaylist = (youtubeUrl: string, playlistId: string) => {
    // Open YouTube playlist in a new tab
    window.open(youtubeUrl, '_blank');
    showSuccess('Now playing', `Opening playlist on YouTube`, 3000);
  };

  const formatPlays = (plays: number) => {
    if (plays >= 1000000) {
      return `${(plays / 1000000).toFixed(1)}M+`;
    }
    if (plays >= 1000) {
      return `${(plays / 1000).toFixed(1)}K+`;
    }
    return plays.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-yellow-600">
      <Header 
        title="POPULAR JAMMS" 
        subtitle="Most popular playlists from the community"
      />
      
      <Navigation currentPage="popular-jamms" />

      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Loading State */}
      {loading && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading popular playlists...</p>
          </div>
        </div>
      )}

      {/* Popular Playlists List */}
      {!loading && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {playlists.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">No popular playlists found. Check back soon!</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="grid gap-1">
                {playlists.map((playlist, index) => (
                  <div 
                    key={playlist.id}
                    className="flex items-center justify-between p-6 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-2xl font-bold text-amber-600 w-8">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                          Playlist #{playlist.playlist_id.slice(-8)}
                        </h3>
                        <p className="text-gray-600 text-sm break-all">
                          {playlist.youtube_url}
                        </p>
                        <div className="flex gap-4 mt-2">
                          <span className="text-sm bg-amber-100 text-amber-600 px-2 py-1 rounded">
                            Power Hour Playlist
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatPlays(playlist.plays)} plays
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePlayPlaylist(playlist.youtube_url, playlist.playlist_id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        🎵 Open Playlist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-gray-600">
            <p className="text-sm">
              Want to add your playlist to the popular list? 
              <Link href="/" className="text-amber-600 hover:underline ml-1">
                Start a power hour
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}