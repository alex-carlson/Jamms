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
        console.error('❌ Supabase client is null');
        throw new Error('Supabase client not initialized. Check environment variables in .env.local');
      }

      console.log('🚀 Testing with popular_jamms table first...');
      
      // First test with popular_jamms table (which we know works)
      try {
        const { data: testData, error: testError } = await supabase
          .from('popular_jamms')
          .select('*')
          .limit(5);
        
        console.log('✅ popular_jamms test result:', { testData, testError });
        
        if (testError) {
          console.error('❌ popular_jamms test failed:', testError);
        } else {
          console.log('✅ popular_jamms works! Found', testData?.length, 'items');
        }
      } catch (popularError) {
        console.error('❌ popular_jamms test threw error:', popularError);
      }

      console.log('🚀 Now trying playlist_plays table...');
      
      // Now try playlist_plays
      const { data, error } = await supabase
        .from('playlist_plays')
        .select('*')
        .order('plays', { ascending: false })
        .limit(20);

      console.log('📊 playlist_plays result:', { 
        data, 
        error, 
        dataLength: data?.length,
        errorCode: error?.code,
        errorMessage: error?.message 
      });

      if (error) {
        console.error('❌ Supabase error details:', JSON.stringify(error, null, 2));
        
        // Check for specific error types
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          throw new Error('Table "playlist_plays" does not exist. Please run the SQL setup script in your Supabase dashboard.');
        }
        
        if (error.message?.includes('permission denied') || error.message?.includes('insufficient_privilege')) {
          throw new Error('Permission denied. RLS may be blocking access. Try temporarily disabling RLS on playlist_plays table.');
        }
        
        throw new Error(`Database query failed: ${error.message || JSON.stringify(error)}`);
      }

      console.log('✅ Successfully loaded playlists:', data?.length || 0, 'items');
      console.log('📋 Playlist data:', data);
      
      setPlaylists(data || []);

      // Show success message only if we got data
      if (data && data.length > 0) {
        showSuccess('Popular playlists loaded!', `Found ${data.length} playlists`);
      }
      
    } catch (err) {
      console.error('💥 Error in loadPopularPlaylists:', err);
      
      let errorMessage = 'Unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
        console.log('📝 Error message:', err.message);
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = `Unexpected error: ${JSON.stringify(err)}`;
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
          <div className="bg-white p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading popular playlists...</p>
          </div>
        </div>
      )}

      {/* Popular Playlists List */}
      {!loading && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {playlists.length === 0 ? (
            <div className="bg-white p-8 text-center">
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