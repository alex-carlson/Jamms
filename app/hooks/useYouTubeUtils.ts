"use client";

export const extractPlaylistId = (url: string): string | null => {
    const patterns = [
        /[&?]list=([a-zA-Z0-9_-]+)/,
        /playlist\?list=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

export const createEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // Use the most reliable format for playlist embeds as the primary option
    // Add index parameter to start at specific video in playlist
    // Remove autoplay to prevent auto-start on load
    // Start videos at 60 seconds (roughly 1/3 through a typical 3-min song)
    return `https://www.youtube.com/embed?list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=0&controls=1&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
};

export const createAlternativeEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // Alternative format with listType parameter
    // Start videos at 60 seconds (roughly 1/3 through a typical 3-min song)
    return `https://www.youtube.com/embed?listType=playlist&list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=0&controls=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
};

export const createDirectEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // YouTube nocookie domain version (sometimes works when regular doesn't)
    // Start videos at 60 seconds (roughly 1/3 through a typical 3-min song)
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=0&controls=1&showinfo=0&rel=0`;
};

export const createAutoplayEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // Version with autoplay for power hour mode
    // Start videos at 60 seconds (roughly 1/3 through a typical 3-min song)
    return `https://www.youtube.com/embed?list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=1&controls=1&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
};

export const createAutoplayAlternativeEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // Alternative format with autoplay and start time
    return `https://www.youtube.com/embed?listType=playlist&list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=1&controls=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
};

export const createAutoplayDirectEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // Direct format with autoplay and start time
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=1&controls=1&showinfo=0&rel=0`;
};

// Fisher-Yates shuffle algorithm
export const shuffleArray = (array: number[]): number[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};