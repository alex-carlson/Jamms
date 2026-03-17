'use client';

import { useState, useEffect } from 'react';
import { parseYouTubeTitleForLyrics } from '../utils/title-parse';

interface LyricsProps {
    artist: string;
    title: string;
    searchQuery?: string;
}

const fetchLyrics = async (artist: string, title: string): Promise<string> => {
    const res = await fetch(
        `https://api.lyrics.ovh/v1/${artist}/${title}`
    );
    const data = await res.json();
    return data.lyrics;
};

const fetchLyricsBySearch = async (searchTerm: string): Promise<string> => {
    try {
        const res = await fetch(
            `https://api.lyrics.ovh/suggest/${encodeURIComponent(searchTerm)}`
        );
        const data = await res.json();

        if (data && data.data && data.data.length > 0) {
            const firstResult = data.data[0];
            return fetchLyrics(firstResult.artist.name, firstResult.title);
        }

        return 'No lyrics found';
    } catch (err) {
        console.error('Error in suggest search:', err);
        throw err;
    }
};

const fetchLyricsByQuery = async (query: string): Promise<string> => {
    // First clean the YouTube title and parse artist/title
    const { artist, title } = parseYouTubeTitleForLyrics(query);

    if (artist && title) {
        // If we have both artist and title, try direct search first
        try {
            return await fetchLyrics(artist, title);
        } catch (err) {
            // If direct search fails, fallback to suggest search
            console.log('Direct search failed, trying suggest search');
        }
    }

    // Use suggest endpoint with the cleaned query
    const cleanQuery = query.trim();
    return fetchLyricsBySearch(cleanQuery);
};

export default function Lyrics({ artist, title, searchQuery }: LyricsProps) {
    const [lyrics, setLyrics] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const getLyrics = async () => {
            try {
                setLoading(true);
                setError('');
                let fetchedLyrics;

                if (searchQuery) {
                    fetchedLyrics = await fetchLyricsByQuery(searchQuery);
                } else {
                    fetchedLyrics = await fetchLyrics(artist, title);
                }

                setLyrics(fetchedLyrics || 'No lyrics found');
            } catch (err) {
                setError('Failed to fetch lyrics');
                console.error('Error fetching lyrics:', err);
            } finally {
                setLoading(false);
            }
        };

        if (searchQuery || (artist && title)) {
            getLyrics();
        }
    }, [artist, title, searchQuery]);

    return (
        <div>
            {loading && <p>Loading lyrics...</p>}
            {error && <p>Error: {error}</p>}
            {!loading && !error && (
                <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-line',
                    color: '#ccc'
                }}>
                    {lyrics}
                </p>
            )}
        </div>
    );
}