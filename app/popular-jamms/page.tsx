"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import Toast, { useToasts } from "../components/Toast";
import { supabase, PlaylistPlay } from "../../lib/supabase";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useYouTubeAPI } from "../hooks/useYouTubeAPI";

type PlaylistMeta = {
  title: string;
  thumbnail: string;
  author: string;
};

let lastPopularLoadToastAt = 0;

export default function PopularJamms() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<PlaylistPlay[]>([]);
  const [playlistMeta, setPlaylistMeta] = useState<Record<string, PlaylistMeta>>({});
  const [loading, setLoading] = useState(true);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<number | null>(null);
  const { toasts, dismissToast, showError, showSuccess } = useToasts();
  const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const { isAuthenticated, getAccessToken } = useGoogleAuth();
  const { playlists: userPlaylists, fetchPlaylists } = useYouTubeAPI(getAccessToken);

  const ownedPlaylistIds = useMemo(
    () => new Set((userPlaylists || []).map((playlist) => playlist.id)),
    [userPlaylists]
  );

  useEffect(() => {
    loadPopularPlaylists();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userPlaylists.length === 0) {
      fetchPlaylists();
    }
  }, [isAuthenticated, userPlaylists.length, fetchPlaylists]);

  const loadPopularPlaylists = async () => {
    try {
      setLoading(true);

      // Check if Supabase client was created successfully
      if (!supabase) {
        throw new Error('Supabase client not initialized. Check environment variables in .env.local');
      }

      // First test with popular_jamms table (which we know works)
      try {
        const { data: testData, error: testError } = await supabase
          .from('popular_jamms')
          .select('*')
          .limit(5);

        if (testError || !testData) {
          // Ignore this probe failure and continue with playlist_plays query
        }
      } catch {
        // Ignore this probe failure and continue with playlist_plays query
      }

      // Now try playlist_plays
      const { data, error } = await supabase
        .from('playlist_plays')
        .select('*')
        .order('plays', { ascending: false })
        .limit(20);

      if (error) {
        // Check for specific error types
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          throw new Error('Table "playlist_plays" does not exist. Please run the SQL setup script in your Supabase dashboard.');
        }

        if (error.message?.includes('permission denied') || error.message?.includes('insufficient_privilege')) {
          throw new Error('Permission denied. RLS may be blocking access. Try temporarily disabling RLS on playlist_plays table.');
        }

        throw new Error(`Database query failed: ${error.message || JSON.stringify(error)}`);
      }

      const loadedPlaylists = data || [];
      setPlaylists(loadedPlaylists);
      await loadPlaylistMetadata(loadedPlaylists);

      // Show success message only if we got data
      if (data && data.length > 0) {
        const now = Date.now();
        if (now - lastPopularLoadToastAt > 2000) {
          lastPopularLoadToastAt = now;
          showSuccess('Popular playlists loaded!', `Found ${data.length} playlists`);
        }
      }

    } catch (err) {
      let errorMessage = 'Unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = `Unexpected error: ${JSON.stringify(err)}`;
      }

      showError('Failed to load popular playlists', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const extractPlaylistId = (playlist: PlaylistPlay): string | null => {
    if (playlist.playlist_id?.trim()) {
      return playlist.playlist_id.trim();
    }

    const fromUrl = playlist.youtube_url?.match(/[?&]list=([a-zA-Z0-9_-]+)/)?.[1];
    return fromUrl || null;
  };

  const loadPlaylistMetadata = async (items: PlaylistPlay[]) => {
    try {
      if (!youtubeApiKey || items.length === 0) {
        setPlaylistMeta({});
        return;
      }

      const playlistIds = Array.from(
        new Set(items.map(extractPlaylistId).filter((id): id is string => Boolean(id)))
      );

      if (playlistIds.length === 0) {
        setPlaylistMeta({});
        return;
      }

      const params = new URLSearchParams({
        part: 'snippet',
        id: playlistIds.join(','),
        maxResults: '50',
        key: youtubeApiKey,
      });

      const response = await fetch(`https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const nextMeta: Record<string, PlaylistMeta> = {};

      for (const item of payload.items || []) {
        const snippet = item.snippet || {};
        nextMeta[item.id] = {
          title: snippet.title || 'Untitled playlist',
          author: snippet.channelTitle || 'Unknown author',
          thumbnail:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            snippet.thumbnails?.default?.url ||
            '',
        };
      }

      setPlaylistMeta(nextMeta);
    } catch {
      setPlaylistMeta({});
    }
  };

  const handlePlayPlaylist = (youtubeUrl: string) => {
    const normalizedUrl = youtubeUrl.trim();
    const allowedPatterns = [
      /^https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=[a-zA-Z0-9_-]+/,
      /^https?:\/\/(?:www\.)?youtube\.com\/watch\?.*[&?]list=[a-zA-Z0-9_-]+/,
      /^https?:\/\/youtu\.be\/.*[&?]list=[a-zA-Z0-9_-]+/
    ];

    if (!allowedPatterns.some((pattern) => pattern.test(normalizedUrl))) {
      showError('Invalid playlist URL', 'Could not open this playlist because the URL format is not supported.');
      return;
    }

    const params = new URLSearchParams({ playlist: normalizedUrl });
    router.push(`/?${params.toString()}`);
  };

  const handleDeletePlaylist = async (playlist: PlaylistPlay) => {
    try {
      setDeletingPlaylistId(playlist.id);

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('playlist_plays')
        .delete()
        .eq('id', playlist.id);

      if (error) {
        if (error.message?.includes('permission denied') || error.message?.includes('not allowed')) {
          throw new Error('Delete is blocked by Supabase policy. Add a DELETE policy for playlist_plays to enable removal.');
        }
        throw new Error(error.message || 'Failed to delete playlist');
      }

      setPlaylists((prev) => prev.filter((item) => item.id !== playlist.id));
      showSuccess('Playlist removed', 'Removed from popular playlists', 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete playlist';
      showError('Could not remove playlist', message);
    } finally {
      setDeletingPlaylistId(null);
    }
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
    <div className="min-h-screen bg-gold">
      <Header
        title="POPULAR JAMMS"
        subtitle="Most popular playlists from the community"
      />

      <Navigation currentPage="popular-jamms" />

      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Loading State */}
      {loading && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 text-center">
            <div className="animate-spin h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading popular playlists...</p>
          </div>
        </div>
      )}

      {/* Popular Playlists List */}
      {!loading && (
        <div className="max-w-4xl mx-auto pb-8">
          {playlists.length === 0 ? (
            <div className="bg-white p-8 text-center">
              <p className="text-gray-600">No popular playlists found. Check back soon!</p>
            </div>
          ) : (
            <div className="bg-white shadow-sm overflow-hidden">
              <div className="grid gap-1">
                {playlists.map((playlist, index) => (
                  (() => {
                    const playlistId = extractPlaylistId(playlist);
                    const meta = playlistId ? playlistMeta[playlistId] : undefined;
                    const isOwner = Boolean(playlistId && isAuthenticated && ownedPlaylistIds.has(playlistId));
                    const isDeleting = deletingPlaylistId === playlist.id;

                    return (
                      <div
                        key={playlist.id}
                        className="flex items-center justify-between p-6 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-6">
                          <div className="text-2xl font-bold text-amber-600 w-8">
                            {index + 1}
                          </div>
                          <div className="w-20 h-20 bg-gray-100 overflow-hidden flex-shrink-0">
                            {meta?.thumbnail ? (
                              <div
                                className="w-full h-full bg-center bg-cover"
                                role="img"
                                aria-label={meta.title || 'Playlist thumbnail'}
                                style={{ backgroundImage: `url(${meta.thumbnail})` }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              {meta?.title || 'Untitled playlist'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {meta?.author || 'Unknown author'}
                            </p>
                            <div className="flex gap-4 mt-2">
                              <span className="text-sm text-gray-500">
                                {formatPlays(playlist.plays)} plays
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePlayPlaylist(playlist.youtube_url)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            Play
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => handleDeletePlaylist(playlist)}
                              disabled={isDeleting}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
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