"use client";

import { useEffect, useLayoutEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from "react";
import { PlaylistData } from "../Home";

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface VideoPlayerProps {
    currentPlaylist: PlaylistData;
    currentVideoIndex: number;
    videoDuration: number;
    playbackStartMode: "thirty-seconds" | "one-third" | "full";
    powerHourActive: boolean;
    onEmbedError: () => void;
    onUnplayableVideo?: () => void;
    onVideoDurationDetected?: (durationSeconds: number) => void;
    onVideoPlay?: () => void;
    onVideoEnd?: () => void;
    onPlayerReady?: () => void;
}

export default forwardRef<any, VideoPlayerProps>(function VideoPlayer(
    { currentPlaylist, currentVideoIndex, playbackStartMode, powerHourActive, onEmbedError, onUnplayableVideo, onVideoDurationDetected, onVideoPlay, onVideoEnd, onPlayerReady },
    ref
) {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const apiReadyRef = useRef(false);
    const volumeFadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const getOneThirdModeStart = useCallback((duration: number) => {
        const oneThirdStart = Math.floor(duration / 3);
        const remainingAfterOneThird = duration - oneThirdStart;

        if (remainingAfterOneThird < 60) {
            return Math.max(0, Math.floor(duration - 60));
        }

        return oneThirdStart;
    }, []);

    // Track if we’ve already done the initial seek+play for a given video
    const initialPlaybackDoneRef = useRef(new Set<string>());
    // Track if player is seeked and playing
    const [isSeekedAndPlaying, setIsSeekedAndPlaying] = useState(false);

    const stopVolumeFade = useCallback(() => {
        if (volumeFadeIntervalRef.current) {
            clearInterval(volumeFadeIntervalRef.current);
            volumeFadeIntervalRef.current = null;
        }
    }, []);

    const fadePlayerVolume = useCallback((targetVolume: number, durationMs = 400, onComplete?: () => void) => {
        if (!playerRef.current) {
            onComplete?.();
            return;
        }

        stopVolumeFade();

        const safeTarget = Math.max(0, Math.min(100, Math.floor(targetVolume)));
        if (safeTarget > 0 && typeof playerRef.current.unMute === "function") {
            playerRef.current.unMute();
        }

        const startVolume = typeof playerRef.current.getVolume === "function"
            ? Number(playerRef.current.getVolume()) || 0
            : 0;

        if (durationMs <= 0 || startVolume === safeTarget) {
            if (typeof playerRef.current.setVolume === "function") {
                playerRef.current.setVolume(safeTarget);
            }
            onComplete?.();
            return;
        }

        const stepMs = 50;
        const totalSteps = Math.max(1, Math.round(durationMs / stepMs));
        let step = 0;

        volumeFadeIntervalRef.current = setInterval(() => {
            step += 1;
            const progress = Math.min(1, step / totalSteps);
            const nextVolume = Math.round(startVolume + (safeTarget - startVolume) * progress);

            if (typeof playerRef.current?.setVolume === "function") {
                playerRef.current.setVolume(Math.max(0, Math.min(100, nextVolume)));
            }

            if (progress >= 1) {
                stopVolumeFade();
                if (safeTarget === 0 && typeof playerRef.current?.mute === "function") {
                    playerRef.current.mute();
                }
                onComplete?.();
            }
        }, stepMs);
    }, [stopVolumeFade]);

    // Load YouTube API once
    useEffect(() => {
        if (typeof window === "undefined") return;

        if (!window.YT) {
            const script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            document.head.appendChild(script);

            window.onYouTubeIframeAPIReady = () => {
                apiReadyRef.current = true;
                if (currentPlaylist) initializePlayer();
            };
        } else {
            apiReadyRef.current = true;
            if (currentPlaylist) initializePlayer();
        }

        return () => {
            stopVolumeFade();
            playerRef.current?.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize player only once per playlist
    const initializePlayer = useCallback(() => {
        if (!window.YT || !containerRef.current || !currentPlaylist) return;

        const firstVideoId = currentPlaylist.videoIds[currentPlaylist.shuffledData[0]];
        if (!firstVideoId || firstVideoId.length !== 11) {
            console.error("Invalid videoId", firstVideoId);
            onEmbedError();
            return;
        }

        playerRef.current = new window.YT.Player(containerRef.current, {
            height: "100%",
            width: "100%",
            videoId: firstVideoId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                modestbranding: 1,
                playsinline: 1,
                iv_load_policy: 3,
                cc_load_policy: 0,
                loop: 0,
                disablekb: 1,
                fs: 1,
                showinfo: 0,
                mute: 1,
            },
            events: {
                onReady: () => {
                    if (typeof playerRef.current?.setVolume === "function") {
                        playerRef.current.setVolume(0);
                    }
                    onPlayerReady?.();
                },
                onStateChange: (event: any) => {
                    const state = event.data;
                    const key = `${currentPlaylist.id}:${currentVideoIndex}`;

                    if (state === 1 && !initialPlaybackDoneRef.current.has(key)) {
                        initialPlaybackDoneRef.current.add(key);

                        // Seek to 1/3 of duration
                        const trySeekAndPlay = () => {
                            const duration = playerRef.current.getDuration();
                            if (!duration || duration === 0) {
                                setTimeout(trySeekAndPlay, 100);
                                return;
                            }
                            if (playbackStartMode !== "full") {
                                const safeStart = getOneThirdModeStart(duration);
                                playerRef.current.seekTo(safeStart, true);
                            }
                            playerRef.current.unMute?.();
                            fadePlayerVolume(100, 400);
                            playerRef.current.playVideo();
                        };

                        trySeekAndPlay();
                    }

                    if (state === 1) {
                        fadePlayerVolume(100, 400);
                        setIsSeekedAndPlaying(true);
                        if (onVideoPlay && powerHourActive) onVideoPlay();
                    } else if (state === 0 || state === -1 || state === 3 || state === 5) {
                        fadePlayerVolume(0, 400);
                        setIsSeekedAndPlaying(false);
                    }
                    if (state === 0 && onVideoEnd) onVideoEnd();
                },
                onError: (event: any) => {
                    console.error("YouTube player error", event.data);
                    if (event.data === 150 || event.data === 101) {
                        onUnplayableVideo?.();
                        return;
                    }
                    onEmbedError();
                },
            },
        });
    }, [currentPlaylist, currentVideoIndex, playbackStartMode, powerHourActive, onEmbedError, onUnplayableVideo, onVideoPlay, onVideoEnd, onPlayerReady, getOneThirdModeStart, fadePlayerVolume]);

    // Hide synchronously on playlist/index/mode change to prevent thumbnail flash before playback.
    useLayoutEffect(() => {
        fadePlayerVolume(0, 0);
        setIsSeekedAndPlaying(false);
    }, [currentPlaylist?.id, currentVideoIndex, playbackStartMode, fadePlayerVolume]);

    // Load new video when currentVideoIndex changes (without destroying player)
    useEffect(() => {
        if (!playerRef.current || !currentPlaylist) return;

        setIsSeekedAndPlaying(false); // Set to false when loading new video

        const videoId = currentPlaylist.videoIds[currentPlaylist.shuffledData[currentVideoIndex]];
        if (!videoId) return;

        const key = `${currentPlaylist.id}:${currentVideoIndex}`;
        initialPlaybackDoneRef.current.delete(key);

        // For full mode, actively load/play from start. For other modes, cue then seek.
        if (playbackStartMode === "full") {
            if (typeof playerRef.current.loadVideoById === "function") {
                playerRef.current.loadVideoById({ videoId, startSeconds: 0 });
            } else if (typeof playerRef.current.cueVideoById === "function") {
                playerRef.current.cueVideoById({ videoId, startSeconds: 0 });
                playerRef.current.playVideo?.();
            }
        } else if (typeof playerRef.current.cueVideoById === "function") {
            playerRef.current.cueVideoById({ videoId, startSeconds: 0 });
        } else if (typeof playerRef.current.loadVideoById === "function") {
            playerRef.current.loadVideoById({ videoId, startSeconds: 0 });
        }

        // Optionally seek to 1/3 after a short delay (for Next/timeout)
        if (playbackStartMode !== "full") {
            setTimeout(() => {
                try {
                    const duration = playerRef.current.getDuration?.();
                    if (duration && duration > 0) {
                        const safeStart = getOneThirdModeStart(duration);
                        playerRef.current.seekTo?.(safeStart, true);
                    }
                } catch (e) {
                    // Ignore errors
                }
            }, 500);
        }
        // Keep hidden until player emits a visible state (playing/paused)
    }, [currentVideoIndex, currentPlaylist, playbackStartMode, getOneThirdModeStart]);

    useEffect(() => {
        if (!playerRef.current) return;

        let attempts = 0;
        const interval = setInterval(() => {
            attempts += 1;
            const duration = playerRef.current?.getDuration?.();
            if (duration && duration > 0) {
                onVideoDurationDetected?.(Math.floor(duration));
                clearInterval(interval);
                return;
            }
            if (attempts >= 20) {
                clearInterval(interval);
            }
        }, 150);

        return () => clearInterval(interval);
    }, [currentVideoIndex, onVideoDurationDetected]);

    // Expose controls to parent
    const playVideoAt = useCallback((index?: number) => {
        if (!playerRef.current || !currentPlaylist) return;

        const targetIdx = index ?? currentVideoIndex;
        const videoId = currentPlaylist.videoIds[currentPlaylist.shuffledData[targetIdx]];

        if (videoId && typeof playerRef.current.loadVideoById === "function") {
            playerRef.current.loadVideoById({ videoId, startSeconds: 0 });
        }
    }, [currentPlaylist, currentVideoIndex]);

    const stopVideo = useCallback(() => {
        fadePlayerVolume(0, 400, () => {
            playerRef.current?.pauseVideo();
        });
    }, [fadePlayerVolume]);

    const startPlayback = useCallback(() => {
        fadePlayerVolume(0, 0);
        playerRef.current?.playVideo();
        fadePlayerVolume(100, 400);
    }, [fadePlayerVolume]);

    useImperativeHandle(ref, () => ({
        playVideoAt,
        stopVideo,
        startPlayback,
        player: playerRef.current,
    }), [playVideoAt, stopVideo, startPlayback]);

    return (
        <div
            className="fixed inset-0 bg-black z-0 flex items-center justify-center"
            style={{
                width: '100vw',
                height: '100vh',
                opacity: isSeekedAndPlaying ? 1 : 0,
                pointerEvents: 'none',
            }}
        >
            <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ aspectRatio: '16/9', maxWidth: '100vw', maxHeight: '100vh' }}
            >
                <div
                    ref={containerRef}
                    className="w-full h-full"
                    id={`youtube-player-${currentPlaylist?.id || 'default'}`}
                />
            </div>
        </div>
    );
});
