"use client";

import { useRef, useState } from "react";
import { Clipboard, Beer, Link as LinkIcon, User } from "lucide-react";
import UsernamePlaylistSearch from "./UsernamePlaylistSearch";

interface PlaylistFormProps {
    onSubmit: (url: string, shouldShare: boolean) => void;
    isLoading: boolean;
    shareWithCommunity: boolean;
    onShareWithCommunityChange: (value: boolean) => void;
}

export default function PlaylistForm({
    onSubmit,
    isLoading,
    shareWithCommunity,
    onShareWithCommunityChange,
}: PlaylistFormProps) {
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [isValidUrl, setIsValidUrl] = useState(true);
    const [activeTab, setActiveTab] = useState<"url" | "username">("url");
    const shareCheckboxRef = useRef<HTMLInputElement | null>(null);

    const validateYouTubePlaylistUrl = (url: string): boolean => {
        if (!url.trim()) return true; // Allow empty input

        const patterns = [
            /^https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
            /^https?:\/\/(?:www\.)?youtube\.com\/watch\?.*[&?]list=([a-zA-Z0-9_-]+)/,
            /^https?:\/\/youtu\.be\/.*[&?]list=([a-zA-Z0-9_-]+)/
        ];

        return patterns.some(pattern => pattern.test(url));
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setPlaylistUrl(url);
        setIsValidUrl(validateYouTubePlaylistUrl(url));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!playlistUrl.trim()) {
            setIsValidUrl(false);
            return;
        }

        if (!validateYouTubePlaylistUrl(playlistUrl)) {
            setIsValidUrl(false);
            return;
        }

        const shouldShare = shareCheckboxRef.current?.checked ?? shareWithCommunity;
        onSubmit(playlistUrl, shouldShare);
    };

    const handleUsernamePlaylistSelect = (url: string) => {
        const shouldShare = shareCheckboxRef.current?.checked ?? shareWithCommunity;
        onSubmit(url, shouldShare);
    };

    const handlePaste = async () => {
        try {
            // Check if clipboard API is available and document has focus
            if (!navigator.clipboard) {
                alert('Clipboard API not supported. Please manually paste the URL.');
                return;
            }

            // Check if document has focus (required for clipboard access)
            if (!document.hasFocus()) {
                alert('Please click on the page first, then try pasting again.');
                return;
            }

            const text = await navigator.clipboard.readText();
            setPlaylistUrl(text);
            setIsValidUrl(validateYouTubePlaylistUrl(text));
        } catch (err) {
            console.error("Failed to read clipboard contents: ", err);
            // Fallback: focus the input and let user paste manually
            const input = document.getElementById('playlist-url') as HTMLInputElement;
            if (input) {
                input.focus();
                alert('Please paste the URL manually using Ctrl+V (Windows) or Cmd+V (Mac)');
            }
        }
    };

    return (
        <div className="form">
            {/* Header */}
            <div className="text-center mb-12">
                <p className="text-xl text-gray-800 mb-8">
                    Create an automatic power hour from a YouTube playlist
                </p>
            </div>

            {/* Tabs */}
            <div className="max-w-xl mx-auto mb-8">
                <div className="flex border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab("url")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "url"
                            ? "border-b-2 border-red-500 text-red-600 bg-red-50"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                    >
                        <LinkIcon className="h-4 w-4" />
                        Playlist URL
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("username")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "username"
                            ? "border-b-2 border-red-500 text-red-600 bg-red-50"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                    >
                        <User className="h-4 w-4" />
                        Search by Channel
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-xl mx-auto">
                {activeTab === "url" ? (
                    <div className="p-8 mb-8">
                        <p className="w-full text-center mb-8"><a target="_blank" className="text-blue-800" href="https://www.youtube.com/feed/playlists">See your playlists</a></p>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="playlist-url"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    YouTube Playlist URL
                                </label>
                                <div className="relative">
                                    <input
                                        id="playlist-url"
                                        type="url"
                                        value={playlistUrl}
                                        onChange={handleUrlChange}
                                        placeholder="https://www.youtube.com/playlist?list=..."
                                        className={`w-full px-4 py-3 border rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${!isValidUrl ? "border-red-500" : "border-gray-300"}`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={handlePaste}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
                                        disabled={isLoading}
                                    >
                                        <Clipboard className="h-4 w-4" />
                                        <span>Paste</span>
                                    </button>
                                </div>
                                {!isValidUrl && (
                                    <p className="mt-2 text-sm text-red-600">
                                        Please enter a valid YouTube playlist URL
                                    </p>
                                )}
                            </div>

                            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                                <input
                                    ref={shareCheckboxRef}
                                    type="checkbox"
                                    checked={shareWithCommunity}
                                    onChange={(event) => onShareWithCommunityChange(event.target.checked)}
                                    className="h-4 w-4"
                                    disabled={isLoading}
                                />
                                <span>Share this playlist with the community</span>
                            </label>

                            <button
                                type="submit"
                                disabled={isLoading || !playlistUrl.trim() || !isValidUrl}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Beer className="h-5 w-5" />
                                        <span>Load Playlist</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Example URLs */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-700 mb-2">
                                Supported URL formats:
                            </p>
                            <div className="text-xs text-gray-600 space-y-1">
                                <div>youtube.com/playlist?list=PLxxxxxx</div>
                                <div>youtube.com/watch?v=xxxxx&list=PLxxxxxx</div>
                                <div>youtu.be/xxxxx?list=PLxxxxxx</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 mb-8">
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                                <input
                                    ref={shareCheckboxRef}
                                    type="checkbox"
                                    checked={shareWithCommunity}
                                    onChange={(event) => onShareWithCommunityChange(event.target.checked)}
                                    className="h-4 w-4"
                                    disabled={isLoading}
                                />
                                <span>Share selected playlist with the community</span>
                            </label>
                        </div>
                        <UsernamePlaylistSearch
                            onPlaylistSelect={handleUsernamePlaylistSelect}
                            shareWithCommunity={shareWithCommunity}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}