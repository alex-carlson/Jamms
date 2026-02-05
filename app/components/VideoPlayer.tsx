"use client";

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

import { PlaylistData } from "../page";

// Declare YouTube Player API types
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
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
    onPlayerReady?: () => void; // New prop for when player is ready
    onVideoSeekedReady?: () => void; // New prop to notify parent when initial seek completed
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
    onPlayerReady,
    onVideoSeekedReady,
}, ref) {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const apiReadyRef = useRef(false);
    const seekingRef = useRef(false);
    const hasInitialSeeked = useRef(new Set<string>());

    // Centralized seek function to prevent conflicts
    const seekToThird = useCallback(() => {
        if (!playerRef.current || seekingRef.current) {
            return;
        }

        seekingRef.current = true;

        try {
            const duration = playerRef.current?.getDuration();
            if (duration && duration > 0) {
                const startTime = Math.floor(duration / 3);
                playerRef.current?.seekTo(startTime, true);
            }
        } catch (e) {
            console.error("Error seeking:", e);
        } finally {
            seekingRef.current = false;
        }
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
    }, [currentPlaylist]);

    // Reset seek tracking for each new video
    useEffect(() => {
        hasInitialSeeked.current.clear();
    }, [currentVideoIndex]);

    const initializePlayer = useCallback(() => {
        if (!window.YT || !containerRef.current || !currentPlaylist) return;

        // Get the correct videoId for shuffled playback
        let videoId: string | undefined = undefined;
        if (
            currentPlaylist.videoIds &&
            currentPlaylist.shuffledData &&
            currentVideoIndex >= 0 &&
            currentVideoIndex < currentPlaylist.shuffledData.length
        ) {
            const shuffledIdx = currentPlaylist.shuffledData[currentVideoIndex];
            if (
                typeof shuffledIdx === 'number' &&
                shuffledIdx >= 0 &&
                shuffledIdx < currentPlaylist.videoIds.length
            ) {
                videoId = currentPlaylist.videoIds[shuffledIdx];
            }
        }

        if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
            console.error('Invalid videoId for YouTube player:', videoId, 'at shuffled index', currentVideoIndex);
            onEmbedError();
            return;
        }

        console.log("Init video player", videoId, 'at shuffled index', currentVideoIndex);

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
                playerVars: {
                    videoId,
                    autoplay: 0,
                    controls: 0, // Hide all player controls
                    rel: 0, // Don't show related videos
                    modestbranding: 1,
                    playsinline: 1,
                    iv_load_policy: 3, // Hide annotations
                    cc_load_policy: 0, // Hide closed captions
                    loop: 0, // Disable looping
                    disablekb: 1, // Disable keyboard controls
                    fs: 0, // Disable fullscreen button
                    showinfo: 0, // Hide video title and uploader info
                    end: 9999999, // Set very high end time to prevent related videos overlay
                },
                events: {
                    onReady: (_event: unknown) => {
                        // Notify parent that player is ready
                        if (onPlayerReady) {
                            onPlayerReady();
                        }
                    },
                    onStateChange: (event: any) => {
                        const state = event.data;
                        // YT.PlayerState: PLAYING = 1, ENDED = 0
                        if (state === 1) {
                            // Only seek once per video
                            const seekKey = `${currentPlaylist.id}:${currentPlaylist.shuffledData[currentVideoIndex]}`;
                            if (!hasInitialSeeked.current.has(seekKey)) {
                                seekToThird();
                                hasInitialSeeked.current.add(seekKey);
                                // Notify parent that seek occurred and video is now playing/ready
                                if (onVideoSeekedReady) {
                                    try {
                                        onVideoSeekedReady();
                                    } catch (e) {
                                        console.error('onVideoSeekedReady callback error', e);
                                    }
                                }
                            }
                            if (onVideoPlay && powerHourActive) {
                                console.log("Playing video at shuffled index: ", currentPlaylist.shuffledData[currentVideoIndex]);
                                onVideoPlay();
                            }
                        } else if (state === 5) {
                            // CUED state - video is loaded but not playing. Seek now and notify parent that seek is ready.
                            const seekKey = `${currentPlaylist.id}:${currentPlaylist.shuffledData[currentVideoIndex]}`;
                            if (!hasInitialSeeked.current.has(seekKey)) {
                                seekToThird();
                                hasInitialSeeked.current.add(seekKey);
                                if (onVideoSeekedReady) {
                                    try {
                                        onVideoSeekedReady();
                                    } catch (e) {
                                        console.error('onVideoSeekedReady callback error', e);
                                    }
                                }
                            }
                        } else if (state === 0 && onVideoEnd) {
                            // Video ended naturally (not stopped by timer)
                            onVideoEnd();
                        }
                    },
                    onError: (event: any) => {
                        console.error("YouTube player error:", event.data, 'for videoId', videoId, 'at shuffled index', currentVideoIndex);
                        // Try to skip to the next video if possible
                        if (typeof window !== 'undefined' && currentPlaylist && currentVideoIndex + 1 < currentPlaylist.shuffledData.length) {
                            setTimeout(() => {
                                // Use a custom event or callback to increment the index in the parent
                                if (typeof window !== 'undefined') {
                                    const nextEvent = new CustomEvent('powerhour-next-video');
                                    window.dispatchEvent(nextEvent);
                                }
                            }, 500);
                        } else {
                            onEmbedError();
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Failed to initialize YouTube player:", error);
            onEmbedError();
        }
    }, [currentPlaylist.shuffledData, currentVideoIndex]);

    const playVideoAt = useCallback((index?: number) => {
        // Allow caller to specify an index; default to currentVideoIndex
        const targetIndex = typeof index === 'number' ? index : currentVideoIndex;
        if (!playerRef.current) {
            console.log('Player not available');
            return;
        }
        try {
            const shuffledIndex = currentPlaylist.shuffledData[targetIndex];
            const videoId = currentPlaylist.videoIds[shuffledIndex];
            console.log("Cueing videoId:", videoId, "at shuffled index:", shuffledIndex);
            // Use cueVideoById so the video is loaded but not played. onStateChange will emit CUED (5) when ready.
            if (typeof playerRef.current.cueVideoById === 'function') {
                playerRef.current.cueVideoById({ videoId, startSeconds: 0 });
            } else if (typeof playerRef.current.loadVideoById === 'function') {
                // As a fallback, load and then immediately pause
                playerRef.current.loadVideoById({ videoId, startSeconds: 0 });
            }
        } catch (e) {
            console.error("Error cueing video:", e);
        }
    }, [currentVideoIndex, currentPlaylist.shuffledData]);

    const startPlayback = useCallback(() => {
        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
            try {
                playerRef.current.playVideo();
            } catch (e) {
                console.error('Error calling playVideo on YT player', e);
            }
        } else {
            console.log('No player.playVideo available');
        }
    }, []);

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
        playVideoAt,
        stopVideo,
        startPlayback,
        player: playerRef.current
    }), [playVideoAt, stopVideo, startPlayback]);

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