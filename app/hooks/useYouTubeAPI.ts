"use client";

import { useState } from "react";

export interface YouTubePlaylist {
    id: string;
    title: string;
    author: string;
    description: string;
    thumbnail: string;
    itemCount: number;
    publishedAt: string;
    privacyStatus: string;
}

export interface PublicPlaylistVideos {
    videoIds: string[];
    videoTitles: string[];
    videoAuthors: string[];
}

interface UseYouTubeAPIReturn {
    playlists: YouTubePlaylist[];
    isLoading: boolean;
    error: string | null;
    fetchPlaylists: () => Promise<void>;
    getPublicPlaylistVideoIds: (
        playlistUrl: string
    ) => Promise<PublicPlaylistVideos>;
}

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!;

export const useYouTubeAPI = (
    getAccessToken: () => string | null
): UseYouTubeAPIReturn => {
    const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // -----------------------------
    // Fetch authenticated user's playlists (OAuth)
    // -----------------------------
    const fetchPlaylists = async () => {
        const token = getAccessToken();
        if (!token) {
            setError("No access token available");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails,status&mine=true&maxResults=50`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `YouTube API error: ${response.status} ${response.statusText}`
                );
            }

            const data = await response.json();

            const formattedPlaylists: YouTubePlaylist[] = data.items.map(
                (item: any) => ({
                    id: item.id,
                    title: item.snippet.title,
                    author: item.snippet.channelTitle || "",
                    description: item.snippet.description || "",
                    thumbnail:
                        item.snippet.thumbnails?.medium?.url ||
                        item.snippet.thumbnails?.default?.url ||
                        "",
                    itemCount: item.contentDetails?.itemCount || 0,
                    publishedAt: item.snippet.publishedAt,
                    privacyStatus: item.status?.privacyStatus || "public",
                })
            );

            setPlaylists(formattedPlaylists);
        } catch (err) {
            console.error("Error fetching playlists:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to fetch playlists"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // -----------------------------
    // Fetch videos from ANY public playlist (API key only)
    // -----------------------------
    const getPublicPlaylistVideoIds = async (
        playlistUrl: string
    ): Promise<PublicPlaylistVideos> => {
        const playlistId =
            playlistUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/)?.[1] ??
            playlistUrl;

        const videoIds: string[] = [];
        const videoTitles: string[] = [];
        const videoAuthors: string[] = [];

        let pageToken: string | undefined;

        try {
            do {
                const params = new URLSearchParams({
                    key: YT_API_KEY,
                    playlistId,
                    part: "snippet",
                    maxResults: "50",
                });

                if (pageToken) {
                    params.set("pageToken", pageToken);
                }

                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
                );

                if (!res.ok) {
                    throw new Error(
                        `YouTube API error ${res.status}`
                    );
                }

                const data = await res.json();

                for (const item of data.items ?? []) {
                    const videoId =
                        item.snippet?.resourceId?.videoId;
                    const title = item.snippet?.title;
                    const author =
                        item.snippet?.videoOwnerChannelTitle ??
                        item.snippet?.channelTitle;

                    if (videoId) {
                        videoIds.push(videoId);
                        videoTitles.push(title ?? "");
                        videoAuthors.push(author ?? "");
                    }
                }

                pageToken = data.nextPageToken;
            } while (pageToken);
        } catch (err) {
            console.error("Error fetching public playlist:", err);
            throw err;
        }

        return { videoIds, videoTitles, videoAuthors };
    };

    return {
        playlists,
        isLoading,
        error,
        fetchPlaylists,
        getPublicPlaylistVideoIds,
    };
};
