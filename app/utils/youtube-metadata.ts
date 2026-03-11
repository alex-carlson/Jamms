// Server-side YouTube API utilities for metadata generation

interface PlaylistMetadata {
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
    videoCount: number;
}

export async function getPlaylistMetadata(playlistId: string): Promise<PlaylistMetadata | null> {
    const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    if (!YT_API_KEY) {
        console.error('YouTube API key not found');
        return null;
    }

    try {
        // Fetch playlist details
        const playlistResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${YT_API_KEY}`,
            { next: { revalidate: 3600 } } // Cache for 1 hour
        );

        if (!playlistResponse.ok) {
            console.error(`YouTube API error: ${playlistResponse.status}`);
            return null;
        }

        const playlistData = await playlistResponse.json();
        const playlist = playlistData.items?.[0];

        if (!playlist) {
            console.error('Playlist not found');
            return null;
        }

        return {
            title: playlist.snippet.title || 'Untitled Playlist',
            description: playlist.snippet.description || 'A YouTube playlist for Power Hour',
            thumbnail: playlist.snippet.thumbnails?.maxres?.url ||
                playlist.snippet.thumbnails?.standard?.url ||
                playlist.snippet.thumbnails?.high?.url ||
                playlist.snippet.thumbnails?.medium?.url ||
                '/background.png',
            channelTitle: playlist.snippet.channelTitle || 'Unknown Channel',
            videoCount: playlist.contentDetails.itemCount || 0
        };
    } catch (error) {
        console.error('Error fetching playlist metadata:', error);
        return null;
    }
}

export function sanitizePlaylistParam(param: string | null): string | null {
    if (!param) return null;
    // Remove any potentially dangerous characters and ensure it's a valid YouTube playlist ID
    const cleaned = param.replace(/[^a-zA-Z0-9_-]/g, '');
    return cleaned.length > 0 ? cleaned : null;
}