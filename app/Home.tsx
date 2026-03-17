"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CornerDownLeft, List, Music } from "lucide-react";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import VideoPlayer from "./components/VideoPlayer";
import PlayerControls from "./components/PlayerControls";
import PlayerHeader from "./components/PlayerHeader";
import PlaylistForm from "./components/PlaylistForm";
import CountdownOverlay from "./components/CountdownOverlay";
import Footer from "./components/Footer";
import Lyrics from "./components/lyrics";
import { useYouTubeAPI } from "./hooks/useYouTubeAPI";
import { extractPlaylistId, createEmbedUrl, shuffleArray } from "./hooks/useYouTubeUtils";
import { usePowerHourWithOverlay } from "./hooks/usePowerHourWithOverlay";
import { supabase } from "../lib/supabase";
import { Suspense } from "react";

export interface PlaylistData {
  id: string;
  embedUrl: string;
  originalUrl: string;
  totalVideos?: number;
  shuffledData: number[];
  videoIds: string[];
  videoTitles: string[];
  videoAuthors: string[];
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistData | null>(null);
  const [playbackStartMode, setPlaybackStartMode] = useState<"thirty-seconds" | "one-third" | "five-minutes" | "fifteen-minutes" | "full">("one-third");
  const [showManualInput, setShowManualInput] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
  const [videoCount, setVideoCount] = useState(0);
  const [embedError, setEmbedError] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [shuffleProgress, setShuffleProgress] = useState<{ current: number; total: number } | null>(null);
  const [shuffledPlaylists, setShuffledPlaylists] = useState([]);
  const [shareWithCommunity, setShareWithCommunity] = useState(true);
  const [showPlaylistList, setShowPlaylistList] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";


  const youtubePlayerRef = useRef<any>(null);
  const autoLoadedPlaylistIdRef = useRef<string | null>(null);
  const handlePlaylistSubmitRef = useRef<(url: string, shouldShare?: boolean) => void>(() => { });
  const durationSyncKeyRef = useRef<string | null>(null);
  const timerIncrementRef = useRef(false);
  const previousPlaybackModeRef = useRef(playbackStartMode);

  const { isLoading: playlistsLoading, error: playlistsError, getPublicPlaylistVideoIds } = useYouTubeAPI();
  const isManualProcessing = showManualInput && isLoading && !currentPlaylist;

  const sanitizePlaylistParam = (rawValue: string | null): string | null => {
    if (!rawValue) return null;

    const trimmed = rawValue.trim();
    if (!trimmed || trimmed.length > 500) return null;

    if (/^[a-zA-Z0-9_-]{10,100}$/.test(trimmed)) return trimmed;

    const extractedId = extractPlaylistId(trimmed);
    if (extractedId) return extractedId;

    const allowedPatterns = [
      /^https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=[a-zA-Z0-9_-]+/,
      /^https?:\/\/(?:www\.)?youtube\.com\/watch\?.*[&?]list=[a-zA-Z0-9_-]+/,
      /^https?:\/\/youtu\.be\/.*[&?]list=[a-zA-Z0-9_-]+/
    ];

    if (!allowedPatterns.some((pattern) => pattern.test(trimmed))) return null;

    return extractPlaylistId(trimmed);
  };

  // Power hour timer comes first
  const {
    powerHourActive,
    timeRemaining,
    videoDuration,
    setVideoDuration,
    startPowerHour: baseStart,
    pausePowerHour,
    resumePowerHour,
    stopPowerHour: baseStop,
    resetTimer,
    resetTimerToFull,
    showOverlay,
    showTitle,
    showHeaderBackground,
    overlaySecondsRemaining,
    startTitleTimer,
    clearTimers,
    resetOverlayAndTitle,
    // ...other returned values
  } = usePowerHourWithOverlay({
    onTimerExpired: handleTimerExpired,
    currentVideoIndex,
    initialVideoDuration: 60,
  });

  const goToNextVideo = useCallback(() => {
    if (!currentPlaylist || !shuffledIndices.length) return;
    setCurrentVideoIndex((prev) => Math.min(prev + 1, shuffledIndices.length - 1));
  }, [currentPlaylist, shuffledIndices.length]);

  const playCanOpenSfx = (): Promise<void> => {
    return new Promise((resolve) => {
      const audio = new Audio("/sfx/can-open.mp3");
      const cleanup = () => {
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
      };
      const handleEnded = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        resolve();
      };

      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);

      const playPromise = audio.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          cleanup();
          resolve();
        });
      }
    });
  };

  async function handleTimerExpired() {
    timerIncrementRef.current = false;

    // First fade out current video
    if (youtubePlayerRef.current?.stopVideo) {
      youtubePlayerRef.current.stopVideo();
      // Wait for fade out to complete (400ms fade duration)
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    // Then play the can open sound
    await playCanOpenSfx();

    // Reset timer and go to next video (timer will start when video actually begins playing)
    resetTimer();
    goToNextVideo();
  }

  function handleVideoPlay() {
    // Start the timer when the video actually starts playing
    if (!powerHourActive) {
      baseStart();
    }
  }

  function handleVideoEnd() {
    if (powerHourActive) {
      startTitleTimer();
    }
  }

  function handlePlayerReady() {
    // Timer will start when video actually begins playing via handleVideoPlay
    if (powerHourActive) {
      startTitleTimer();
    }
  }

  const trackPlaylistPlay = async (
    youtubeUrl: string,
    shouldShare: boolean,
    isPrivate: boolean = false,
    verifyPublicBeforeInsert: boolean = false,
    playlistTitle?: string,
    playlistAuthor?: string
  ) => {
    try {
      if (isPrivate) return;

      const playlistId = extractPlaylistId(youtubeUrl);
      if (!playlistId) return;

      // Check if playlist exists
      const { data: existingPlaylist, error: selectError } = await supabase
        .from('playlist_plays')
        .select('id, plays')
        .eq('youtube_url', youtubeUrl)
        .maybeSingle<any>();

      if (selectError) {
        console.error('Error checking playlist:', selectError);
        return;
      }

      if (existingPlaylist && typeof existingPlaylist.plays === 'number') {
        await supabase
          .from('playlist_plays')
          .update({
            plays: existingPlaylist.plays + 1,
          })
          .eq('id', existingPlaylist.id);
      } else if (shouldShare) {
        if (verifyPublicBeforeInsert) {
          const statusParams = new URLSearchParams({
            part: 'status',
            id: playlistId,
            key: youtubeApiKey,
          });

          const statusResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlists?${statusParams.toString()}`);
          const statusPayload = statusResponse.ok ? await statusResponse.json() : null;
          const privacyStatus = statusPayload?.items?.[0]?.status?.privacyStatus;

          if (privacyStatus === 'private') {
            return;
          }
        }

        // Insert new playlist with 1 play
        const { error: insertError } = await supabase
          .from('playlist_plays')
          .insert({
            youtube_url: youtubeUrl,
            playlist_id: playlistId,
            playlist_title: playlistTitle || null,
            playlist_author: playlistAuthor || null,
            plays: 1,
          });

        if (insertError) {
          console.error('Error inserting new playlist:', insertError);
        }
      } else {
        // Not shared and doesn't exist: skip database write
        return;
      }
    } catch (error) {
      console.error('Error tracking playlist play:', error);
    }
  };

  async function handlePlaylistSubmit(url: string, shouldShare: boolean = shareWithCommunity) {
    setIsLoading(true);
    setShuffleProgress(null);
    const playlistId = extractPlaylistId(url);
    if (!playlistId) return setIsLoading(false);

    console.log("Submitting playlist");

    try {
      const { videoIds, videoTitles, videoAuthors } = await getPublicPlaylistVideoIds(url, (progress) => {
        setShuffleProgress(progress);
      });
      const shuffled = shuffleArray(videoIds.map((_, i) => i), Math.random());
      setShuffledIndices(shuffled);

      const playlistData = {
        id: playlistId,
        embedUrl: createEmbedUrl(playlistId, shuffled[0]),
        originalUrl: url,
        totalVideos: videoIds.length,
        shuffledData: shuffled,
        videoIds,
        videoTitles,
        videoAuthors,
      };

      setCurrentPlaylist(playlistData);
      setCurrentVideoIndex(0);
      setVideoCount(0);
      setEmbedError(false);

      // Track playlist play in Supabase
      trackPlaylistPlay(url, shouldShare, false, false, undefined, videoAuthors[0] || undefined);
    } catch (err) {
      setEmbedError(true);
    } finally {
      setIsLoading(false);
      setShuffleProgress(null);
    }
  }

  useEffect(() => {
    handlePlaylistSubmitRef.current = handlePlaylistSubmit;
  });

  const resetPlaylist = () => {
    resetTimer();
    clearTimers();
    resetOverlayAndTitle();
    setCurrentPlaylist(null);
    setCurrentVideoIndex(0);
    setVideoCount(0);
    setEmbedError(false);
    setShuffledIndices([]);
    setShowPlaylistList(false);
  };

  useEffect(() => {
    const playlistIdFromQuery = sanitizePlaylistParam(searchParams.get("playlist"));
    if (!playlistIdFromQuery) return;
    if (currentPlaylist) return;
    if (isLoading) return;
    if (autoLoadedPlaylistIdRef.current === playlistIdFromQuery) return;

    autoLoadedPlaylistIdRef.current = playlistIdFromQuery;
    setShowManualInput(true);
    handlePlaylistSubmitRef.current(`https://www.youtube.com/playlist?list=${playlistIdFromQuery}`, shareWithCommunity);
  }, [searchParams, currentPlaylist, isLoading, shareWithCommunity]);

  const onNextPressed = () => {
    // Always reset and start timer to full duration for next video
    resetTimer();
    baseStart();
    goToNextVideo();
  };

  const onTogglePlayPause = () => {
    if (powerHourActive) {
      pausePowerHour();
      youtubePlayerRef.current?.stopVideo?.();
      return;
    }

    resumePowerHour();
    youtubePlayerRef.current?.startPlayback?.();
  };

  const handleUnplayableVideo = useCallback(() => {
    console.warn("Skipping unplayable YouTube video (error 150/101)");
    if (powerHourActive) {
      resetTimer();
      baseStart();
    }
    goToNextVideo();
  }, [powerHourActive, resetTimer, baseStart, goToNextVideo]);

  const handleVideoDurationDetected = useCallback((durationSeconds: number) => {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return;
    if (!currentPlaylist) return;

    const syncKey = `${currentPlaylist.id}:${currentVideoIndex}:${playbackStartMode}`;
    if (durationSyncKeyRef.current === syncKey) return;

    durationSyncKeyRef.current = syncKey;

    if (playbackStartMode === "full") {
      setVideoDuration(durationSeconds, true);
      return;
    }

    if (playbackStartMode === "thirty-seconds") {
      setVideoDuration(durationSeconds < 30 ? durationSeconds : 30, true);
      return;
    }

    if (playbackStartMode === "one-third") {
      setVideoDuration(durationSeconds < 60 ? durationSeconds : 60, true);
      return;
    }

    if (playbackStartMode === "five-minutes") {
      setVideoDuration(durationSeconds < 300 ? durationSeconds : 300, true);
      return;
    }

    if (playbackStartMode === "fifteen-minutes") {
      setVideoDuration(durationSeconds < 900 ? durationSeconds : 900, true);
      return;
    }

    // Default for one-third mode (fallback)
    setVideoDuration(durationSeconds < 60 ? durationSeconds : 60, true);
  }, [playbackStartMode, currentPlaylist, currentVideoIndex, setVideoDuration]);

  useEffect(() => {
    // Only restart timer if playback mode actually changed
    if (previousPlaybackModeRef.current === playbackStartMode) {
      return;
    }
    previousPlaybackModeRef.current = playbackStartMode;

    if (playbackStartMode === "thirty-seconds") {
      setVideoDuration(30, true);
      if (powerHourActive) {
        resetTimer();
        baseStart();
      }
      return;
    }

    if (playbackStartMode === "one-third") {
      setVideoDuration(60, true);
      if (powerHourActive) {
        resetTimer();
        baseStart();
      }
      return;
    }

    if (playbackStartMode === "five-minutes") {
      setVideoDuration(300, true);
      if (powerHourActive) {
        resetTimer();
        baseStart();
      }
      return;
    }

    if (playbackStartMode === "fifteen-minutes") {
      setVideoDuration(900, true);
      if (powerHourActive) {
        resetTimer();
        baseStart();
      }
      return;
    }

    // "full" mode
    if (powerHourActive) {
      resetTimer();
      baseStart();
    }
  }, [playbackStartMode, setVideoDuration, powerHourActive, resetTimer, baseStart]);

  useEffect(() => {
    durationSyncKeyRef.current = null;
  }, [currentPlaylist?.id, currentVideoIndex, playbackStartMode]);

  // Set background color: blue if no playlist, black if playlist
  const bgClass = currentPlaylist ? "bg-black" : "bg-blue";
  return (
    <Suspense fallback={null}>
      <div className={`min-h-screen relative p-2 ${bgClass}`}>
        {currentPlaylist && (
          <>
            <button
              onClick={() => {
                resetPlaylist();
                setShowManualInput(false);
                setEmbedError(false);
                router.replace("/");
              }}
              aria-label="Go home"
              className="fixed top-4 left-4 z-50 text-white p-2 transition-opacity opacity-50 hover:opacity-100"
            >
              <CornerDownLeft className="h-8 w-8" strokeWidth={3} />
            </button>

            <button
              onClick={() => setShowPlaylistList((prev) => !prev)}
              aria-label="Toggle shuffled playlist video names"
              className="fixed top-4 right-4 z-50 text-white p-2 transition-opacity opacity-70 hover:opacity-100"
            >
              <List className="h-8 w-8" strokeWidth={3} />
            </button>

            <button
              onClick={() => setShowLyrics((prev) => !prev)}
              aria-label="Toggle lyrics"
              className="fixed top-4 right-20 z-50 text-white p-2 transition-opacity opacity-70 hover:opacity-100"
            >
              <Music className="h-8 w-8" strokeWidth={3} />
            </button>

            {showPlaylistList && (
              <div className="fixed top-16 right-4 z-50 w-80 max-h-[65vh] overflow-y-auto rounded-lg bg-black/80 border border-white/20 p-2">
                <ul className="space-y-1">
                  {shuffledIndices.map((shuffledIndex, listIndex) => (
                    <li
                      key={`${shuffledIndex}-${listIndex}`}
                      onClick={() => setCurrentVideoIndex(listIndex)}
                      className={`px-3 py-2 text-sm text-white rounded flex items-start gap-2 cursor-pointer ${listIndex === currentVideoIndex ? "bg-white/30 ring-1 ring-white/60 font-semibold" : "bg-transparent"}`}
                    >
                      <span className="min-w-6 text-white/80">{listIndex + 1}.</span>
                      <span>
                        {currentPlaylist.videoTitles[shuffledIndex] || `Video ${listIndex + 1}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showLyrics && currentVideoIndex >= 0 && shuffledIndices.length > 0 && (
              <div className="fixed top-16 right-20 z-50 w-100 max-h-[65vh] overflow-y-auto rounded-lg bg-black/80 border border-white/20 p-4">
                <Lyrics
                  artist={currentPlaylist.videoAuthors[shuffledIndices[currentVideoIndex]] || ""}
                  title={currentPlaylist.videoTitles[shuffledIndices[currentVideoIndex]] || ""}
                  searchQuery={currentPlaylist.videoTitles[shuffledIndices[currentVideoIndex]] || ""}
                />
              </div>
            )}
          </>
        )}

        {/* Header - hidden if playing a video */}
        {!currentPlaylist && (
          <Header title="JAMMS" />
        )}

        {/* Navigation - visible when not playing a video */}
        {!currentPlaylist && !isManualProcessing && (
          <Navigation currentPage="power-hour" />
        )}

        <div className="container mx-auto pb-2" style={{ position: "relative", zIndex: 1 }}>
          <CountdownOverlay showOverlay={showOverlay} overlaySecondsRemaining={overlaySecondsRemaining} />
          {/* Loading during manual playlist processing */}
          {showManualInput && isLoading && (
            <div className="max-w-4xl mx-auto text-center bg-white py-10">
              <div className="w-full max-w-md mx-auto mb-4">
                {shuffleProgress ? (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className="bg-red-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(shuffleProgress.current / shuffleProgress.total) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-800 text-sm">
                      Loading: {shuffleProgress.current} of {shuffleProgress.total}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-800">Shuffling playlist...</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Manual playlist input form */}
          {!currentPlaylist && !isLoading && (
            <div className="content bg-white max-w-4xl mx-auto">
              <PlaylistForm
                onSubmit={handlePlaylistSubmit}
                isLoading={isLoading}
                shareWithCommunity={shareWithCommunity}
                onShareWithCommunityChange={setShareWithCommunity}
              />
            </div>
          )}
          {/* Video Player */}
          {currentPlaylist && (
            <div className="mx-auto transition-all duration-300 max-w-6xl">

              <div className="player relative w-full" id="cast">
                <PlayerHeader
                  key={showTitle ? `showTitle-${currentVideoIndex}` : `hideTitle-${currentVideoIndex}`}
                  onResetPlaylist={resetPlaylist}
                  showTitle={showTitle}
                  showHeaderBackground={showHeaderBackground}
                  videoName={
                    currentPlaylist && currentPlaylist.videoTitles && shuffledIndices.length > 0
                      ? currentPlaylist.videoTitles[shuffledIndices[currentVideoIndex] ?? 0] || ""
                      : ""
                  }
                  videoAuthor={
                    currentPlaylist && currentPlaylist.videoAuthors && shuffledIndices.length > 0
                      ? currentPlaylist.videoAuthors[shuffledIndices[currentVideoIndex] ?? 0] || ""
                      : ""
                  }
                />

                <VideoPlayer
                  ref={youtubePlayerRef}
                  currentPlaylist={currentPlaylist}
                  currentVideoIndex={currentVideoIndex}
                  videoDuration={videoDuration}
                  playbackStartMode={playbackStartMode}
                  powerHourActive={powerHourActive}
                  onEmbedError={() => setEmbedError(true)}
                  onUnplayableVideo={handleUnplayableVideo}
                  onVideoDurationDetected={handleVideoDurationDetected}
                  onVideoPlay={handleVideoPlay}
                  onVideoEnd={handleVideoEnd}
                  onPlayerReady={handlePlayerReady}
                />
              </div>

              <PlayerControls
                timeRemaining={timeRemaining}
                powerHourActive={powerHourActive}
                videoDuration={videoDuration}
                playbackStartMode={playbackStartMode}
                currentVideoIndex={currentVideoIndex}
                totalVideos={shuffledIndices.length}
                onDurationChange={setVideoDuration}
                onPlaybackStartModeChange={setPlaybackStartMode}
                onTogglePlayPause={onTogglePlayPause}
                onNextVideo={onNextPressed}
                isPlaying={powerHourActive}
              />
            </div>
          )}


        </div>
        {!currentPlaylist && (
          <Footer />
        )}
      </div>
    </Suspense>
  );
}
