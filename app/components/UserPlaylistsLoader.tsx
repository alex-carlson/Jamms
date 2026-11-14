"use client";

import { useState, useEffect } from "react";
import { Play, Loader } from "lucide-react";

interface UserPlaylist {
  id: string;
  title: string;
  thumbnail?: string;
  videoCount?: number;
}

interface UserPlaylistsLoaderProps {
  channelHandle?: string;
  channelId?: string;
  apiKey?: string;
  onPlaylistSelect: (playlistId: string, playlistTitle: string) => void;
  onClose: () => void;
}

export default function UserPlaylistsLoader({
  channelHandle,
  channelId,
  apiKey,
  onPlaylistSelect,
  onClose,
}: UserPlaylistsLoaderProps) {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!apiKey) {
          throw new Error("YouTube API key not configured");
        }

        // First, get the channel ID if we only have the handle
        let actualChannelId = channelId;
        
        if (channelHandle && !channelId) {
          const channelSearch = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
            `part=snippet&type=channel&q=${encodeURIComponent(channelHandle)}&key=${apiKey}`
          );
          
          if (!channelSearch.ok) {
            throw new Error("Failed to find channel");
          }
          
          const channelSearchData = await channelSearch.json();
          actualChannelId = channelSearchData.items?.[0]?.id?.channelId;
          
          if (!actualChannelId) {
            throw new Error("Channel not found");
          }
        }

        if (!actualChannelId) {
          throw new Error("Channel ID required");
        }

        // Now fetch playlists for this channel
        const playlistsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlists?` +
          `part=snippet&channelId=${actualChannelId}&maxResults=50&key=${apiKey}`
        );

        if (!playlistsResponse.ok) {
          throw new Error("Failed to fetch playlists");
        }

        const playlistsData = await playlistsResponse.json();
        const fetchedPlaylists: UserPlaylist[] = playlistsData.items?.map((item: any) => ({
          id: item.id,
          title: item.snippet?.title || "Untitled Playlist",
          thumbnail: item.snippet?.thumbnails?.default?.url,
          videoCount: undefined, // Can be enhanced to fetch item count
        })) || [];

        setPlaylists(fetchedPlaylists);

        if (fetchedPlaylists.length === 0) {
          setError("No playlists found for this channel");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load playlists";
        setError(message);
        console.error("Error fetching playlists:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, [channelHandle, channelId, apiKey]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <Loader className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-gray-600">Loading playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-red-600 font-semibold">{error}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Your Playlists</h2>
      
      {playlists.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No playlists found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {playlist.thumbnail && (
                <img
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {playlist.title}
                </h3>
                <button
                  onClick={() => onPlaylistSelect(playlist.id, playlist.title)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Play size={16} />
                  Load Playlist
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
