"use client";

import { useState, useEffect } from "react";
import { Play, RefreshCw, User, LogOut, Shuffle, RotateCcw } from "lucide-react";
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
    onShufflePlaylists: () => void;
    onResetPlaylistOrder: () => void;
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
    onShufflePlaylists,
    onResetPlaylistOrder,
    isShuffled,
}: PlaylistSelectorProps) {
    const [selectedPlaylist, setSelectedPlaylist] = useState<YouTubePlaylist | null>(null);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header with User Info */}
            <div className="text-center mb-8">
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                    ACarCrash Power Hours
                </h1>
                <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-md">
                        <img
                            src={user.picture}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                        />
                        <div className="text-left">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
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
                <p className="text-xl text-gray-600 dark:text-gray-300">
                    Select one of your YouTube playlists to create a power hour
                </p>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Your Playlists {isShuffled && <span className="text-sm font-normal text-blue-600">(Shuffled)</span>}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={isShuffled ? onResetPlaylistOrder : onShufflePlaylists}
                        disabled={isLoading || playlists.length === 0}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isShuffled ? (
                            <>
                                <RotateCcw className="h-4 w-4" />
                                <span>Reset Order</span>
                            </>
                        ) : (
                            <>
                                <Shuffle className="h-4 w-4" />
                                <span>Shuffle</span>
                            </>
                        )}
                    </button>
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
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading your playlists...</p>
                </div>
            )}

            {/* Playlists Grid */}
            {!isLoading && playlists.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playlists.map((playlist) => (
                        <div
                            key={playlist.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 ${selectedPlaylist?.id === playlist.id
                                    ? "ring-2 ring-red-600 ring-opacity-50"
                                    : ""
                                }`}
                            onClick={() => setSelectedPlaylist(playlist)}
                        >
                            {/* Playlist Thumbnail */}
                            <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                                {playlist.thumbnail ? (
                                    <img
                                        src={playlist.thumbnail}
                                        alt={playlist.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Play className="h-12 w-12 text-gray-400" />
                                    </div>
                                )}
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                    {playlist.itemCount} videos
                                </div>
                            </div>

                            {/* Playlist Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                    {playlist.title}
                                </h3>
                                {playlist.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                        {playlist.description}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Created: {new Date(playlist.publishedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Playlists Message */}
            {!isLoading && playlists.length === 0 && !error && (
                <div className="text-center py-12">
                    <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No Playlists Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
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

            {/* Selection Confirmation */}
            {selectedPlaylist && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Selected Playlist
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {selectedPlaylist.title} ({selectedPlaylist.itemCount} videos)
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSelectedPlaylist(null)}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onPlaylistSelect(selectedPlaylist)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Play className="h-4 w-4" />
                            <span>Start Power Hour</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}