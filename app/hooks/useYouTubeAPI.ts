"use client";

import { useState, useEffect } from "react";

export interface YouTubePlaylist {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    itemCount: number;
    publishedAt: string;
}

interface UseYouTubeAPIReturn {
    playlists: YouTubePlaylist[];
    isLoading: boolean;
    error: string | null;
    fetchPlaylists: () => Promise<void>;
}

export const useYouTubeAPI = (getAccessToken: () => string | null): UseYouTubeAPIReturn => {
    const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPlaylists = async () => {
        const token = getAccessToken();
        if (!token) {
            setError("No access token available");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch user's playlists using YouTube Data API v3
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            const formattedPlaylists: YouTubePlaylist[] = data.items.map((item: any) => ({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description || "",
                thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
                itemCount: item.contentDetails?.itemCount || 0,
                publishedAt: item.snippet.publishedAt,
            }));

            setPlaylists(formattedPlaylists);
        } catch (err) {
            console.error("Error fetching playlists:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch playlists");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPlaylistVideos = async (playlistId: string) => {
        const token = getAccessToken();
        if (!token) {
            throw new Error("No access token available");
        }

        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.items.length;
        } catch (err) {
            console.error("Error fetching playlist videos:", err);
            return 0;
        }
    };

    return {
        playlists,
        isLoading,
        error,
        fetchPlaylists,
    };
};