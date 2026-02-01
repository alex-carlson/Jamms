"use client";

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

// Declare YouTube Player API types
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface PlaylistData {
    id: string;
    embedUrl: string;
    originalUrl: string;
    totalVideos?: number;
}

interface VideoPlayerProps {
    currentPlaylist: PlaylistData;
    isFullscreen: boolean;
    embedError: boolean;
    showOverlay: boolean;
    showTitle: boolean;
    videoTitle: string;
    isShuffled: boolean;
    shuffledIndices: number[];
    currentVideoIndex: number;
    powerHourActive: boolean;
    onEmbedError: () => void;
    onTryFormat1: () => void;
    onTryFormat2: () => void;
    onVideoPlay?: () => void; // New prop for detecting play events
    onVideoEnd?: () => void; // New prop for when video ends naturally
}

export default forwardRef<any, VideoPlayerProps>(function VideoPlayer({
    currentPlaylist,
    isFullscreen,
    embedError,
    showOverlay,
    showTitle,
    videoTitle,
    currentVideoIndex,
    powerHourActive,
    onEmbedError,
    onTryFormat1,
    onTryFormat2,
    onVideoPlay,
    onVideoEnd,
}, ref) {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const apiReadyRef = useRef(false);
    const seekingRef = useRef(false);
    const hasInitialSeeked = useRef(new Set<string>());

    // Extract playlist ID from the current playlist
    const getPlaylistId = useCallback(() => {
        if (!currentPlaylist?.id) return null;
        // Remove 'PL' prefix if present for consistency
        return currentPlaylist.id.startsWith('PL') ? currentPlaylist.id : `PL${currentPlaylist.id}`;
    }, [currentPlaylist?.id]);

    // Centralized seek function to prevent conflicts
    const seekToThird = useCallback((videoKey: string) => {
        if (!playerRef.current || seekingRef.current || hasInitialSeeked.current.has(videoKey)) {
            return;
        }

        seekingRef.current = true;

        setTimeout(() => {
            try {
                const duration = playerRef.current?.getDuration();
                if (duration && duration > 0) {
                    const startTime = Math.floor(duration / 3);
                    console.log(`Seeking to ${startTime}s (1/3 of ${duration}s duration) for video ${videoKey}`);
                    playerRef.current?.seekTo(startTime, true);
                    hasInitialSeeked.current.add(videoKey);
                }
            } catch (e) {
                console.error("Error seeking:", e);
            } finally {
                seekingRef.current = false;
            }
        }, 1000);
    }, []);

    // Load YouTube Player API
    useEffect(() => {
        if (typeof window === "undefined") return;

        const loadYouTubeAPI = () => {
            if (!window.YT) {
                const script = document.createElement("script");
                script.src = "https://www.youtube.com/iframe_api";
                script.async = true;
                document.head.appendChild(script);

                window.onYouTubeIframeAPIReady = () => {
                    apiReadyRef.current = true;
                    initializePlayer();
                };
            } else {
                apiReadyRef.current = true;
                initializePlayer();
            }
        };

        loadYouTubeAPI();

        return () => {
            // Cleanup player on unmount
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    console.log("Player cleanup error:", e);
                }
                playerRef.current = null;
            }
        };
    }, []);

    // Initialize or update player when playlist/settings change
    useEffect(() => {
        if (apiReadyRef.current && currentPlaylist) {
            // Clear seek tracking for new playlist
            hasInitialSeeked.current.clear();
            seekingRef.current = false;
            initializePlayer();
        }
    }, [currentPlaylist, powerHourActive]);

    const initializePlayer = useCallback(() => {
        if (!window.YT || !containerRef.current || !currentPlaylist) return;

        const playlistId = getPlaylistId();
        if (!playlistId) {
            onEmbedError();
            return;
        }

        try {
            // Destroy existing player
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            // Clear the container
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            // Create new player
            playerRef.current = new window.YT.Player(containerRef.current, {
                height: '100%',
                width: '100%',
                playerVars: {
                    list: playlistId,
                    listType: 'playlist',
                    index: currentVideoIndex,
                    autoplay: powerHourActive ? 1 : 0,
                    controls: 0, // Hide all player controls
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    iv_load_policy: 3, // Hide annotations
                    cc_load_policy: 0, // Hide closed captions
                    loop: 0, // Disable looping
                    disablekb: 1, // Disable keyboard controls
                    fs: 0, // Disable fullscreen button
                    showinfo: 0, // Hide video title and uploader info
                },
                events: {
                    onReady: (event: any) => {
                        console.log("YouTube player ready");
                        if (powerHourActive) {
                            // Start playing immediately if power hour is active
                            event.target.playVideo();
                            // Use centralized seek function
                            const videoKey = `${playlistId}-${currentVideoIndex}`;
                            seekToThird(videoKey);
                        }
                    },
                    onStateChange: (event: any) => {
                        const state = event.data;
                        // YT.PlayerState: PLAYING = 1, ENDED = 0
                        if (state === 1 && onVideoPlay) {
                            // Get current video index from YouTube and sync our state
                            const playlistIndex = event.target.getPlaylistIndex();
                            console.log(`YouTube is now playing video at index ${playlistIndex}`);

                            // Only seek if power hour is active and this is NOT the same as currentVideoIndex
                            // (avoid double seeking since onReady already handles the initial seek)
                            if (powerHourActive && playlistIndex !== currentVideoIndex) {
                                // This handles cases where YouTube auto-advances or we manually change videos
                                const videoKey = `${playlistId}-${playlistIndex}`;
                                seekToThird(videoKey);
                            }

                            onVideoPlay();
                        } else if (state === 0 && onVideoEnd) {
                            // Video ended naturally (not stopped by timer)
                            onVideoEnd();
                        }
                    },
                    onError: (event: any) => {
                        console.error("YouTube player error:", event.data);
                        onEmbedError();
                    }
                }
            });
        } catch (error) {
            console.error("Failed to initialize YouTube player:", error);
            onEmbedError();
        }
    }, [currentPlaylist, powerHourActive, currentVideoIndex, getPlaylistId, onEmbedError, onVideoPlay, onVideoEnd]);

    // Method to programmatically go to next video
    const nextVideo = useCallback(() => {
        if (playerRef.current && playerRef.current.nextVideo) {
            try {
                playerRef.current.nextVideo();
                // Use centralized seek function with a delay to let YouTube update
                if (powerHourActive) {
                    setTimeout(() => {
                        const playlistIndex = playerRef.current?.getPlaylistIndex();
                        if (playlistIndex !== undefined) {
                            const playlistId = getPlaylistId();
                            const videoKey = `${playlistId}-${playlistIndex}`;
                            seekToThird(videoKey);
                        }
                    }, 500);
                }
            } catch (e) {
                console.error("Error going to next video:", e);
            }
        }
    }, [powerHourActive, seekToThird, getPlaylistId]);

    // Method to play video at specific index (for shuffle mode)
    const playVideoAt = useCallback((index: number) => {
        if (playerRef.current && playerRef.current.playVideoAt) {
            try {
                console.log(`Playing video at index ${index}`);
                // Stop current video first to prevent auto-advance
                if (playerRef.current.pauseVideo) {
                    playerRef.current.pauseVideo();
                }
                // Then jump to the specified index
                playerRef.current.playVideoAt(index);

                // Use centralized seek function
                if (powerHourActive) {
                    const playlistId = getPlaylistId();
                    const videoKey = `${playlistId}-${index}`;
                    seekToThird(videoKey);
                }
            } catch (e) {
                console.error("Error playing video at index:", e);
            }
        }
    }, [powerHourActive, seekToThird, getPlaylistId]);

    // Method to stop current video
    const stopVideo = useCallback(() => {
        if (playerRef.current && playerRef.current.pauseVideo) {
            try {
                playerRef.current.pauseVideo();
            } catch (e) {
                console.error("Error stopping video:", e);
            }
        }
    }, []);

    // Expose player methods to parent component via ref
    useImperativeHandle(ref, () => ({
        nextVideo,
        playVideoAt,
        stopVideo,
        player: playerRef.current
    }), [nextVideo, playVideoAt, stopVideo]);

    // Listen for messages from YouTube iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // YouTube sends postMessage events when player state changes
            if (event.origin !== 'https://www.youtube.com') return;

            try {
                const data = JSON.parse(event.data);
                // YouTube player state: 1 = playing, 2 = paused, 0 = ended
                if (data.info && data.info.playerState === 1 && onVideoPlay) {
                    onVideoPlay();
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onVideoPlay]); return (
        <div className={`bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 ${isFullscreen ? 'mx-4' : ''}`}>
            {/* Black overlay bar to hide YouTube title */}
            {showOverlay && (
                <div className="relative z-10">
                    <div className="absolute top-0 left-0 right-0 bg-black h-[100px] z-10"></div>
                </div>
            )}

            {/* Video Title Overlay - Bottom Left */}
            {showTitle && videoTitle && (
                <div className="relative z-20">
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg backdrop-blur-sm animate-fade-in max-w-md">
                        <h2 className="text-sm font-semibold truncate">
                            {videoTitle}
                        </h2>
                    </div>
                </div>
            )}

            <div className="relative" style={{ paddingBottom: isFullscreen ? '70vh' : '56.25%', height: 0 }}>
                {embedError ? (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 text-white">
                        <div className="text-center p-8">
                            <h3 className="text-xl font-semibold mb-4">Video Unavailable</h3>
                            <p className="text-gray-300 mb-4">This playlist may have embedding restrictions.</p>
                            <div className="space-y-3 mb-4">
                                <button
                                    onClick={onTryFormat1}
                                    className="block w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Try Format #1
                                </button>
                                <button
                                    onClick={onTryFormat2}
                                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Try Format #2
                                </button>
                            </div>
                            <div className="mt-4">
                                <a
                                    href={currentPlaylist?.originalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 underline"
                                >
                                    Open in YouTube
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        className="absolute top-0 left-0 w-full h-full"
                        id={`youtube-player-${currentPlaylist?.id || 'default'}`}
                    />
                )}
            </div>
        </div>
    );
});