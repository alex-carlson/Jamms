"use client";

import { useState, useEffect } from "react";
import { Play, RefreshCw, User, LogOut } from "lucide-react";
import { YouTubePlaylist } from "../hooks/useYouTubeAPI";

interface PlaylistSelectorProps {
    user: {
        name: string;
        email: string;
        picture: string;
    };
    playlists: YouTubePlaylist[];
    isLoading: boolean;
    error: string | null;
    onPlaylistSelect: (playlist: YouTubePlaylist) => void;
    onRefreshPlaylists: () => void;
    onSignOut: () => void;
    isShuffled: boolean;
}

export default function PlaylistSelector({
    user,
    playlists,
    isLoading,
    error,
    onPlaylistSelect,
    onRefreshPlaylists,
    onSignOut,
    isShuffled,
}: PlaylistSelectorProps) {
    const [selectedPlaylist, setSelectedPlaylist] = useState<YouTubePlaylist | null>(null);

    return (
        <>
            <div className="max-w-4xl mx-auto mb-0">
                <div className="text-center py-8 bg-white">
                    <div className="flex items-center justify-center gap-4 mb-6 m">
                        <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-md">
                            <img
                                src={user.picture}
                                alt={user.name}
                                className="w-8 h-8 rounded-full"
                            />
                            <div className="text-left">
                                <p className="text-sm font-medium text-gray-800">
                                    {user.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onSignOut}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                    <p className="text-xl text-gray-800">
                        Select one of your YouTube playlists to create a power hour
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-2">
                {/* Control Buttons */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Your Playlists {isShuffled && <span className="text-sm font-normal text-blue-600">(Shuffled)</span>}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={onRefreshPlaylists}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                        <p className="text-gray-800">Loading your playlists...</p>
                    </div>
                )}

                {/* Playlists List */}
                {!isLoading && playlists.length > 0 && (
                    <div className="space-y-3">
                        {playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                className={`flex gap-4 p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${selectedPlaylist?.id === playlist.id
                                    ? "border-red-600 bg-red-50"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                    }`}
                                onClick={() => onPlaylistSelect(playlist)}
                            >
                                {/* Thumbnail */}
                                <div className="flex-shrink-0 w-[50px] h-[50px] rounded bg-gray-200 overflow-hidden">
                                    {playlist.thumbnail ? (
                                        <img
                                            src={playlist.thumbnail}
                                            alt={playlist.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Play className="h-6 w-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Playlist Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-800 line-clamp-1">
                                        {playlist.title}
                                    </h3>
                                    {playlist.description && (
                                        <p className="text-sm text-gray-700 line-clamp-1 mt-1">
                                            {playlist.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                        <span>{playlist.itemCount} videos</span>
                                        <span>Created: {new Date(playlist.publishedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Playlists Message */}
                {!isLoading && playlists.length === 0 && !error && (
                    <div className="text-center py-12">
                        <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            No Playlists Found
                        </h3>
                        <p className="text-gray-700 mb-6">
                            Create some playlists on YouTube to get started with Power Hour!
                        </p>
                        <a
                            href="https://www.youtube.com/playlist?list=WL"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                            <Play className="h-4 w-4" />
                            <span>Go to YouTube</span>
                        </a>
                    </div>
                )}
            </div>
        </>
    );
}