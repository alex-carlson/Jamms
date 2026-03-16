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

// xoroshiro128+ pseudorandom number generator
class Xoroshiro128Plus {
    private state0: number;
    private state1: number;

    constructor(seed?: number) {
        // Initialize with seed or current time
        const s = seed ?? Date.now();
        // Split seed into two 32-bit values for 64-bit state
        this.state0 = s >>> 0;
        this.state1 = (s * 0x9e3779b9) >>> 0;

        // Warm up the generator
        for (let i = 0; i < 10; i++) {
            this.next();
        }
    }

    private rotl(x: number, k: number): number {
        return ((x << k) | (x >>> (32 - k))) >>> 0;
    }

    next(): number {
        const s0 = this.state0;
        let s1 = this.state1;
        const result = (s0 + s1) >>> 0;

        s1 ^= s0;
        this.state0 = (this.rotl(s0, 26) ^ s1 ^ (s1 << 9)) >>> 0;
        this.state1 = this.rotl(s1, 13);

        return result;
    }

    // Generate random float between 0 and 1
    random(): number {
        return this.next() / 0x100000000;
    }

    // Generate random integer between 0 (inclusive) and max (exclusive)
    randomInt(max: number): number {
        return Math.floor(this.random() * max);
    }
}

// Xoroshiro-based shuffle algorithm
export const shuffleArray = (array: number[], seed?: number): number[] => {
    const shuffled = [...array];
    const rng = new Xoroshiro128Plus(seed);

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = rng.randomInt(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};