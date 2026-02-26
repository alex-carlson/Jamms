"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PlaylistForm from "./components/PlaylistForm";
import VideoPlayer from "./components/VideoPlayer";
import PlayerControls from "./components/PlayerControls";
import PlayerHeader from "./components/PlayerHeader";
import LoginComponent from "./components/LoginComponent";
import PlaylistSelector from "./components/PlaylistSelector";
import OAuthSetupGuide from "./components/OAuthSetupGuide";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { useYouTubeAPI, YouTubePlaylist } from "./hooks/useYouTubeAPI";
import { extractPlaylistId, createEmbedUrl, shuffleArray } from "./hooks/useYouTubeUtils";
import { usePowerHourWithOverlay } from "./hooks/usePowerHourWithOverlay";

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
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistData | null>(null);
  const [playbackStartMode, setPlaybackStartMode] = useState<"thirty-seconds" | "one-third" | "full">("one-third");
  const [showManualInput, setShowManualInput] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
  const [videoCount, setVideoCount] = useState(0);
  const [embedError, setEmbedError] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [totalVideos, setTotalVideos] = useState<number>(60);
  const [shuffledPlaylists, setShuffledPlaylists] = useState<YouTubePlaylist[]>([]);


  const youtubePlayerRef = useRef<any>(null);
  const durationSyncKeyRef = useRef<string | null>(null);
  const timerIncrementRef = useRef(false);
  const previousPlaybackModeRef = useRef(playbackStartMode);

  const { user, isAuthenticated, isLoading: authLoading, signIn, signOut, getAccessToken, error: authError, googleLoaded, isTokenExpiringSoon } = useGoogleAuth();
  const { playlists, isLoading: playlistsLoading, error: playlistsError, fetchPlaylists, getPublicPlaylistVideoIds } = useYouTubeAPI(getAccessToken);

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

  // Fetch playlists after login
  useEffect(() => {
    if (isAuthenticated && playlists.length === 0) fetchPlaylists();
  }, [isAuthenticated]);

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
    await playCanOpenSfx();
    resetTimer();
    baseStart();
    goToNextVideo();
  }

  function handleVideoEnd() {
    if (powerHourActive) {
      startTitleTimer();
    }
  }

  function handlePlayerReady() {
    if (powerHourActive) {
      baseStart();
      startTitleTimer();
    }
  }

  const fetchAllPlaylistVideoIds = async (playlistId: string, token: string) => {
    const videoIds: string[] = [];
    const videoTitles: string[] = [];
    const videoAuthors: string[] = [];
    let nextPageToken = "";
    do {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      videoIds.push(...data.items.map((item: any) => item.snippet.resourceId.videoId));
      videoTitles.push(...data.items.map((item: any) => item.snippet.title));
      videoAuthors.push(...data.items.map((item: any) => item.snippet.videoOwnerChannelTitle ?? item.snippet.channelTitle ?? ""));
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);
    return { videoIds, videoTitles, videoAuthors };
  };

  async function handlePlaylistSubmit(url: string) {
    setIsLoading(true);
    const playlistId = extractPlaylistId(url);
    if (!playlistId) return setIsLoading(false);

    console.log("Submitting playlist");

    try {
      const { videoIds, videoTitles, videoAuthors } = await getPublicPlaylistVideoIds(url);
      const shuffled = shuffleArray(videoIds.map((_, i) => i));
      setTotalVideos(shuffled.length);
      setShuffledIndices(shuffled);

      setCurrentPlaylist({
        id: playlistId,
        embedUrl: createEmbedUrl(playlistId, shuffled[0]),
        originalUrl: url,
        totalVideos: videoIds.length,
        shuffledData: shuffled,
        videoIds,
        videoTitles,
        videoAuthors,
      });
      setCurrentVideoIndex(0);
      setVideoCount(0);
      setEmbedError(false);
    } catch (err) {
      setEmbedError(true);
    } finally {
      setIsLoading(false);
    }
  }

  const handleYouTubePlaylistSelect = async (playlist: YouTubePlaylist) => {
    setIsLoading(true);
    try {
      const token = getAccessToken();
      const { videoIds, videoTitles, videoAuthors } = await fetchAllPlaylistVideoIds(playlist.id, token);
      const shuffled = shuffleArray(videoIds.map((_, i) => i));
      setTotalVideos(shuffled.length);
      setShuffledIndices(shuffled);

      setCurrentPlaylist({
        id: playlist.id,
        embedUrl: createEmbedUrl(playlist.id, shuffled[0]),
        originalUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
        totalVideos: videoIds.length,
        shuffledData: shuffled,
        videoIds,
        videoTitles,
        videoAuthors,
      });
      setCurrentVideoIndex(0);
      setVideoCount(0);
      setEmbedError(false);
    } catch {
      setEmbedError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPlaylist = () => {
    resetTimer();
    clearTimers();
    resetOverlayAndTitle();
    setCurrentPlaylist(null);
    setCurrentVideoIndex(0);
    setVideoCount(0);
    setEmbedError(false);
    setShuffledIndices([]);
    setTotalVideos(60);
  };

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

  const handleSignOut = () => {
    signOut();
    resetPlaylist();
    setShowManualInput(false);
  };

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

    // "full" mode
    if (powerHourActive) {
      resetTimer();
      baseStart();
    }
  }, [playbackStartMode, setVideoDuration, powerHourActive, resetTimer, baseStart]);

  useEffect(() => {
    durationSyncKeyRef.current = null;
  }, [currentPlaylist?.id, currentVideoIndex, playbackStartMode]);

  return (
    <div className={`min-h-screen relative p-2 ${currentPlaylist ? "bg-black" : ""}`}>
      {/* Header - hidden if playing a video */}
      {!currentPlaylist && (
        <div className="max-w-4xl mx-auto mt-8">
          <img src="hamms-background.png" alt="" className="w-full" />
          <div className="text-center py-8 bg-white">
            <h1 className="text-5xl font-bold mb-6 text-red-600 serif">JAMMS</h1>
          </div>
        </div>
      )}

      <div className="container mx-auto pb-2" style={{ position: "relative", zIndex: 1 }}>
        {/* Countdown overlay for last 5 seconds before title */}
        {showOverlay && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-black bg-opacity-70 rounded-xl px-8 py-6 text-white text-6xl font-bold">
              {overlaySecondsRemaining}
            </div>
          </div>
        )}
        {/* Loading during auth */}
        {authLoading && (
          <div className="max-w-md mx-auto text-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-800">Initializing...</p>
          </div>
        )}

        {/* Sign-in / Manual Input */}
        {!authLoading && !showManualInput && !isAuthenticated && (
          <div className="content bg-white max-w-4xl mx-auto">
            <LoginComponent onSignIn={signIn} isLoading={authLoading} error={authError} googleLoaded={googleLoaded} onManualInputClick={() => setShowManualInput(true)} />
            {authError?.includes("authorized origins") && <OAuthSetupGuide />}
          </div>
        )}

        {(!authLoading && showManualInput && !currentPlaylist) && (
          <div className="content bg-white max-w-4xl mx-auto">
            <PlaylistForm onSubmit={handlePlaylistSubmit} isLoading={isLoading} onBackToSignIn={() => setShowManualInput(false)} />
          </div>
        )}

        {/* Playlist Selector */}
        {isAuthenticated && !currentPlaylist && !showManualInput && user && (
          <div className="content">
            {isTokenExpiringSoon() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-600">⚠️</div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Session Expiring Soon</h3>
                    <p className="text-sm text-yellow-700 mt-1">Consider signing in again for uninterrupted access.</p>
                    <button
                      onClick={() => { signOut(); setTimeout(signIn, 100); }}
                      className="mt-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded font-medium transition-colors"
                    >
                      Refresh Session
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="max-w-4xl mx-auto text-center bg-white py-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-800">Loading playlist videos...</p>
              </div>
            )}

            {!isLoading && (
              <>
                <PlaylistSelector
                  user={user}
                  playlists={shuffledPlaylists.length ? shuffledPlaylists : playlists}
                  isLoading={playlistsLoading}
                  error={playlistsError}
                  onPlaylistSelect={handleYouTubePlaylistSelect}
                  onRefreshPlaylists={fetchPlaylists}
                  onSignOut={handleSignOut}
                  onManualInputClick={() => setShowManualInput(true)}
                  isShuffled={!!shuffledPlaylists.length}
                />
              </>
            )}
          </div>
        )}
        {/* Video Player */}
        {currentPlaylist && (
          <div className="mx-auto transition-all duration-300 max-w-6xl">
            {isAuthenticated && isTokenExpiringSoon() && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <span className="text-sm text-yellow-800 font-medium">
                    Session expiring soon
                  </span>
                </div>
                <button
                  onClick={() => { signOut(); setTimeout(signIn, 100); }}
                  className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded transition-colors"
                >
                  Refresh
                </button>
              </div>
            )}

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
              totalVideos={totalVideos}
              onDurationChange={setVideoDuration}
              onPlaybackStartModeChange={setPlaybackStartMode}
              onTogglePlayPause={onTogglePlayPause}
              onNextVideo={onNextPressed}
              isPlaying={powerHourActive}
            />
          </div>
        )}

      </div>
    </div>
  );
}
