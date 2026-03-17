export const parseYouTubeTitle = (title: string): string => {
    let cleanTitle = title;

    // Remove text in brackets: [Official Video], [HD], [Lyric Video], etc.
    cleanTitle = cleanTitle.replace(/\[.*?\]/g, '');

    // Remove text in parentheses: (Official Music Video), (Lyrics), (HD), etc.
    cleanTitle = cleanTitle.replace(/\(.*?\)/g, '');

    // Remove common standalone phrases (case insensitive)
    const commonPhrases = [
        'official video', 'music video', 'official music video',
        'lyric video', 'lyrics video', 'official lyric video',
        'official audio', 'audio', 'official',
        'hd', '4k', 'uhd', 'hq', 'high quality',
        'remastered', 'remix', 'extended version', 'radio edit',
        'explicit', 'clean version', 'album version',
        'live', 'acoustic', 'unplugged',
        'ft.', 'feat.', 'featuring'
    ];

    // Create regex pattern to match any of these phrases
    const phrasePattern = new RegExp(`\\b(${commonPhrases.join('|')})\\b`, 'gi');
    cleanTitle = cleanTitle.replace(phrasePattern, '');

    // Clean up extra whitespace and punctuation
    cleanTitle = cleanTitle.replace(/\s+/g, ' '); // Multiple spaces to single space
    cleanTitle = cleanTitle.replace(/[|•·\-–—_]+/g, '-'); // Normalize separators
    cleanTitle = cleanTitle.replace(/\s*[-–—]\s*$/, ''); // Remove trailing separators
    cleanTitle = cleanTitle.replace(/^\s*[-–—]\s*/, ''); // Remove leading separators
    cleanTitle = cleanTitle.trim();

    return cleanTitle;
};

export const parseArtistAndTitle = (cleanQuery: string): { artist: string; title: string } => {
    // Try to parse artist and title from the cleaned query
    // Common formats: "Artist - Title", "Artist: Title", "Title by Artist"
    const dashMatch = cleanQuery.match(/^(.+?)\s*[-–]\s*(.+)$/);
    const colonMatch = cleanQuery.match(/^(.+?)\s*[::]\s*(.+)$/);
    const byMatch = cleanQuery.match(/^(.+?)\s+by\s+(.+)$/i);

    let artist = '';
    let title = '';

    if (dashMatch) {
        artist = dashMatch[1].trim();
        title = dashMatch[2].trim();
    } else if (colonMatch) {
        artist = colonMatch[1].trim();
        title = colonMatch[2].trim();
    } else if (byMatch) {
        title = byMatch[1].trim();
        artist = byMatch[2].trim();
    } else {
        // If no pattern matches, use the whole cleaned query as title
        title = cleanQuery;
        artist = '';
    }

    return { artist, title };
};

export const parseYouTubeTitleForLyrics = (title: string): { artist: string; title: string } => {
    const cleanTitle = parseYouTubeTitle(title);
    console.log("Clean title: " + cleanTitle);
    return parseArtistAndTitle(cleanTitle);
};