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
    isLoading: boolean;
    error: string | null;
    getPublicPlaylistVideoIds: (
        playlistUrl: string
    ) => Promise<PublicPlaylistVideos>;
}

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!;

export const useYouTubeAPI = (): UseYouTubeAPIReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        isLoading,
        error,
        getPublicPlaylistVideoIds,
    };
};
