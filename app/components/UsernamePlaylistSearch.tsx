"use client";

import { useState } from "react";
import { Search, Play } from "lucide-react";

interface YouTubePlaylistResult {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    itemCount: number;
    url: string;
}

interface UsernamePlaylistSearchProps {
    onPlaylistSelect: (url: string) => void;
    shareWithCommunity: boolean;
}

export default function UsernamePlaylistSearch({
    onPlaylistSelect,
    shareWithCommunity,
}: UsernamePlaylistSearchProps) {
    const [username, setUsername] = useState("");
    const [playlists, setPlaylists] = useState<YouTubePlaylistResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!;

    const searchPlaylists = async () => {
        if (!username.trim()) return;

        setIsLoading(true);
        setError(null);
        setPlaylists([]);

        try {
            // First, search for the channel by username
            const searchResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?` +
                new URLSearchParams({
                    part: 'snippet',
                    type: 'channel',
                    q: username.trim(),
                    maxResults: '5',
                    key: YT_API_KEY,
                })
            );

            if (!searchResponse.ok) {
                throw new Error('Failed to search for channel');
            }

            const searchData = await searchResponse.json();

            if (!searchData.items || searchData.items.length === 0) {
                throw new Error(`No channels found for "${username}". Try the exact channel name or @handle.`);
            }

            // Get the first channel result
            const channel = searchData.items[0];
            const channelId = channel.snippet.channelId || channel.id?.channelId;

            if (!channelId) {
                throw new Error('Could not find channel ID');
            }

            // Now get playlists from this channel
            const playlistsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/playlists?` +
                new URLSearchParams({
                    part: 'snippet,contentDetails',
                    channelId: channelId,
                    maxResults: '25',
                    key: YT_API_KEY,
                })
            );

            if (!playlistsResponse.ok) {
                throw new Error('Failed to fetch playlists');
            }

            const playlistsData = await playlistsResponse.json();

            if (!playlistsData.items || playlistsData.items.length === 0) {
                throw new Error(`No public playlists found for "${channel.snippet.title}"`);
            }

            const formattedPlaylists: YouTubePlaylistResult[] = playlistsData.items.map((item: any) => ({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description || '',
                thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
                itemCount: item.contentDetails?.itemCount || 0,
                url: `https://www.youtube.com/playlist?list=${item.id}`,
            }));

            setPlaylists(formattedPlaylists);
        } catch (err) {
            console.error('Error searching for playlists:', err);
            setError(err instanceof Error ? err.message : 'Failed to search for playlists');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        searchPlaylists();
    };

    const handlePlaylistClick = (playlist: YouTubePlaylistResult) => {
        onPlaylistSelect(playlist.url);
    };

    return (
        <div className="space-y-6">
            {/* Search Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        YouTube Channel Name or @Handle
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter channel name or @handle"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !username.trim()}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <Search className="h-5 w-5" />
                            )}
                            Search
                        </button>
                    </div>
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Playlists Results */}
            {playlists.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Public Playlists ({playlists.length} found)
                    </h3>
                    <div className="grid gap-3">
                        {playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer group"
                                onClick={() => handlePlaylistClick(playlist)}
                            >
                                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    {playlist.thumbnail ? (
                                        <img
                                            src={playlist.thumbnail}
                                            alt={playlist.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                            No image
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 truncate group-hover:text-red-700">
                                        {playlist.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {playlist.itemCount} videos
                                    </p>
                                    {playlist.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {playlist.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-red-600 font-medium">
                                    <Play className="h-5 w-5 fill-current" />
                                    <span className="text-sm">Start Power Hour</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-xs text-gray-500 text-center">
                This searches for public playlists only. Private and unlisted playlists won't appear.
            </p>
        </div>
    );
}