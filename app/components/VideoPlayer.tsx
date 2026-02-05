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
    embedError: boolean;
    shuffledIndices: number[];
    currentVideoIndex: number;
    videoDuration: number;
    powerHourActive: boolean;
    onEmbedError: () => void;
    onVideoPlay?: () => void;
    onVideoEnd?: () => void
    onPlayerReady?: () => void;
    onVideoSeekedReady?: () => void;
}

export default forwardRef<any, VideoPlayerProps>(function VideoPlayer({
    currentPlaylist,
    currentVideoIndex,
    videoDuration,
    powerHourActive,
    onEmbedError,
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

    const seekToThird = useCallback(() => {
        if (!playerRef.current || seekingRef.current) {
            return;
        }

        seekingRef.current = true;

        try {
            const duration = playerRef.current?.getDuration();
            const timerDuration = videoDuration;

            if (duration && duration > 0) {

                const startTime = Math.floor(duration / 3);

                // if video is short, that it plays at the beginning
                const isShorterThanTimer = (duration - timerDuration) < 0;
                const isStartTimeTooLate = (duration - startTime) < 0;

                if (isShorterThanTimer || isStartTimeTooLate) {
                    playerRef.current?.seekTo(0, true);
                    return;
                }

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
                    fs: 1, // Disable fullscreen button
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
        <div className={`bg-black rounded-2xl overflow-hidden shadow-2xl mb-6`}>
            <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                <div
                    ref={containerRef}
                    className="absolute top-0 left-0 w-full h-full"
                    id={`youtube-player-${currentPlaylist?.id || 'default'}`}
                />
            </div>
        </div>
    );
});