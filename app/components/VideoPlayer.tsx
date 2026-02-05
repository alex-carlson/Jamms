"use client";

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from "react";
import { PlaylistData } from "../page";

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
    powerHourActive: boolean;
    onEmbedError: () => void;
    onVideoPlay?: () => void;
    onVideoEnd?: () => void;
    onPlayerReady?: () => void;
}

export default forwardRef<any, VideoPlayerProps>(function VideoPlayer(
    { currentPlaylist, currentVideoIndex, videoDuration, powerHourActive, onEmbedError, onVideoPlay, onVideoEnd, onPlayerReady },
    ref
) {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const apiReadyRef = useRef(false);

    // Track if we’ve already done the initial seek+play for a given video
    const initialPlaybackDoneRef = useRef(new Set<string>());
    // Track if player is seeked and playing
    const [isSeekedAndPlaying, setIsSeekedAndPlaying] = useState(false);

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
                            const start = Math.floor(duration / 3);
                            const safeStart = duration < videoDuration || duration - start < 0 ? 0 : start;

                            playerRef.current.seekTo(safeStart, true);
                            playerRef.current.unMute?.();
                            playerRef.current.playVideo();
                        };

                        trySeekAndPlay();
                    }

                    if (state === 1) {
                        setIsSeekedAndPlaying(true);
                        if (onVideoPlay && powerHourActive) onVideoPlay();
                    } else {
                        setIsSeekedAndPlaying(false);
                    }
                    if (state === 0 && onVideoEnd) onVideoEnd();
                },
                onError: (event: any) => {
                    console.error("YouTube player error", event.data);
                    onEmbedError();
                },
            },
        });
    }, [currentPlaylist, currentVideoIndex, videoDuration, powerHourActive, onEmbedError, onVideoPlay, onVideoEnd, onPlayerReady]);

    // Load new video when currentVideoIndex changes (without destroying player)
    useEffect(() => {
        if (!playerRef.current || !currentPlaylist) return;

        setIsSeekedAndPlaying(false); // Set to false when loading new video

        const videoId = currentPlaylist.videoIds[currentPlaylist.shuffledData[currentVideoIndex]];
        if (!videoId) return;

        const key = `${currentPlaylist.id}:${currentVideoIndex}`;
        initialPlaybackDoneRef.current.delete(key);

        // Always cue the new video, then seek to 1/3 when ready
        if (typeof playerRef.current.cueVideoById === "function") {
            playerRef.current.cueVideoById({ videoId, startSeconds: 0 });
        } else if (typeof playerRef.current.loadVideoById === "function") {
            playerRef.current.loadVideoById({ videoId, startSeconds: 0 });
        }

        // Try to seek to 1/3 after a short delay (for Next/timeout)
        setTimeout(() => {
            try {
                const duration = playerRef.current.getDuration?.();
                if (duration && duration > 0) {
                    const start = Math.floor(duration / 3);
                    const safeStart = duration < videoDuration || duration - start < 0 ? 0 : start;
                    playerRef.current.seekTo?.(safeStart, true);
                }
            } catch (e) {
                // Ignore errors
            }
        }, 500);
        setIsSeekedAndPlaying(true); // Set to true after seek/play is complete
    }, [currentVideoIndex, currentPlaylist, videoDuration]);

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
        playerRef.current?.pauseVideo();
    }, []);

    const startPlayback = useCallback(() => {
        playerRef.current?.playVideo();
    }, []);

    useImperativeHandle(ref, () => ({
        playVideoAt,
        stopVideo,
        startPlayback,
        player: playerRef.current,
    }), [playVideoAt, stopVideo, startPlayback]);

    return (
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl mb-6">
            <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                <div
                    ref={containerRef}
                    className={`absolute top-0 left-0 w-full h-full`}
                    id={`youtube-player-${currentPlaylist?.id || 'default'}`}
                />
            </div>
        </div>
    );
});
