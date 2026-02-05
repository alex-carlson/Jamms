"use client";

import { useState, useEffect, useRef } from "react";
import PlaylistForm from "./components/PlaylistForm";
import VideoPlayer from "./components/VideoPlayer";
import PlayerControls from "./components/PlayerControls";
import PlayerHeader from "./components/PlayerHeader";
import LoginComponent from "./components/LoginComponent";
import PlaylistSelector from "./components/PlaylistSelector";
import OAuthSetupGuide from "./components/OAuthSetupGuide";
import { usePowerHourTimer } from "./hooks/usePowerHourTimer";
import { useOverlayAndTitle } from "./hooks/useOverlayAndTitle";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { useYouTubeAPI, YouTubePlaylist } from "./hooks/useYouTubeAPI";
import { extractPlaylistId, createEmbedUrl, shuffleArray } from "./hooks/useYouTubeUtils";

export interface PlaylistData {
  id: string;
  embedUrl: string;
  originalUrl: string;
  totalVideos?: number;
  shuffledData: number[];
  videoIds: string[];
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistData | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(1);
  const [videoCount, setVideoCount] = useState(0);
  const [embedError, setEmbedError] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [totalVideos, setTotalVideos] = useState<number>(60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shuffledPlaylists, setShuffledPlaylists] = useState<YouTubePlaylist[]>([]);


  const youtubePlayerRef = useRef<any>(null);
  const timerIncrementRef = useRef(false);

  const { user, isAuthenticated, isLoading: authLoading, signIn, signOut, getAccessToken, error: authError, googleLoaded, isTokenExpiringSoon } = useGoogleAuth();
  const { playlists, isLoading: playlistsLoading, error: playlistsError, fetchPlaylists } = useYouTubeAPI(getAccessToken);
  // Power hour timer comes first
  const { powerHourActive, timeRemaining, videoDuration, setVideoDuration, startPowerHour: baseStart, stopPowerHour: baseStop, resetTimer, resetTimerToFull } =
    usePowerHourTimer(handleTimerExpired);

  // Then call the overlay/title hook
  const { showOverlay, showTitle, videoTitle, currentVideoTitle, titleCountdown, startOverlayTimer, startTitleTimer, clearTimers, resetOverlayAndTitle, ...overlayProps } =
    useOverlayAndTitle(currentVideoIndex, videoDuration);



  // Fetch playlists after login
  useEffect(() => {
    if (isAuthenticated && playlists.length === 0) fetchPlaylists();
  }, [isAuthenticated]);

  function goToNextVideo() {
    if (!currentPlaylist || !shuffledIndices.length) return;
    setCurrentVideoIndex((prev) => Math.min(prev + 1, shuffledIndices.length - 1));
  }

  function handleTimerExpired() {
    if (!timerIncrementRef.current) {
      timerIncrementRef.current = true;
      goToNextVideo();
      setTimeout(() => (timerIncrementRef.current = false), 100);
    }
  }

  const handleStartFromControls = () => {
    try {
      baseStart();
      youtubePlayerRef.current?.playVideoAt?.(currentVideoIndex) || youtubePlayerRef.current?.startPlayback?.() || youtubePlayerRef.current?.player?.playVideo?.();
    } catch (e) {
      console.error("Error starting playback:", e);
    }
  };

  useEffect(() => {
    baseStart();
    if (powerHourActive && youtubePlayerRef.current?.playVideoAt) {
      try { youtubePlayerRef.current.playVideoAt(currentVideoIndex); } catch (e) { console.error(e); }
    }
  }, [currentVideoIndex, powerHourActive]);

  useEffect(() => {
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.playVideoAt?.(currentVideoIndex);
    }
  }, [currentVideoIndex]);


  function handleVideoEnd() {
    if (powerHourActive) {
      startOverlayTimer();
      startTitleTimer();
    }
  }

  function handlePlayerReady() {
    if (powerHourActive) {
      baseStart();
      startOverlayTimer();
      startTitleTimer();
    }
  }

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  const fetchAllPlaylistVideoIds = async (playlistId: string, token: string) => {
    let videoIds: string[] = [];
    let nextPageToken = "";
    do {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      videoIds.push(...data.items.map((item: any) => item.snippet.resourceId.videoId));
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);
    return videoIds;
  };

  async function handlePlaylistSubmit(url: string) {
    setIsLoading(true);
    const playlistId = extractPlaylistId(url);
    if (!playlistId) return setIsLoading(false);

    try {
      const token = getAccessToken();
      const videoIds = await fetchAllPlaylistVideoIds(playlistId, token);
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
      });
      setCurrentVideoIndex(1);
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
      const videoIds = await fetchAllPlaylistVideoIds(playlist.id, token);
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
      });
      setCurrentVideoIndex(1);
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
    setTotalVideos(50);
  };

  const onNextPressed = () => {
    goToNextVideo();
    resetTimerToFull();
  };

  const shufflePlaylistOrder = () => setShuffledPlaylists(shuffleArray(playlists));
  const resetPlaylistOrder = () => setShuffledPlaylists([]);

  function shuffleArray<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
  }

  const handleSignOut = () => {
    signOut();
    resetPlaylist();
    setShowManualInput(false);
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-black">
      <div className="container mx-auto px-4 py-16">
        {/* Loading during auth */}
        {authLoading && (
          <div className="max-w-md mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Initializing...</p>
          </div>
        )}

        {/* Sign-in / Manual Input */}
        {!authLoading && !isAuthenticated && !showManualInput && (
          <div className="space-y-6">
            <LoginComponent onSignIn={signIn} isLoading={authLoading} error={authError} googleLoaded={googleLoaded} />
            {authError?.includes("authorized origins") && <OAuthSetupGuide />}
            <div className="text-center">
              <button
                onClick={() => setShowManualInput(true)}
                className={`text-sm px-4 py-2 rounded-lg transition-colors ${authError ? "bg-blue-600 hover:bg-blue-700 text-white font-medium" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"}`}
              >
                {authError ? "→ Use Manual Playlist URL Instead" : "Or enter a playlist URL manually"}
              </button>
            </div>
          </div>
        )}

        {(!authLoading && showManualInput && !currentPlaylist) && (
          <div className="space-y-4">
            <PlaylistForm onSubmit={handlePlaylistSubmit} isLoading={isLoading} />
            <div className="text-center">
              <button onClick={() => setShowManualInput(false)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline">
                ← Back to Google Sign In
              </button>
            </div>
          </div>
        )}

        {/* Playlist Selector */}
        {isAuthenticated && !currentPlaylist && !showManualInput && user && (
          <div className="space-y-6">
            {isTokenExpiringSoon() && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-600 dark:text-yellow-400">⚠️</div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Session Expiring Soon</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">Consider signing in again for uninterrupted access.</p>
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
              <div className="max-w-md mx-auto text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading playlist videos...</p>
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
                  onShufflePlaylists={shufflePlaylistOrder}
                  onResetPlaylistOrder={resetPlaylistOrder}
                  isShuffled={!!shuffledPlaylists.length}
                />
                <div className="text-center">
                  <button onClick={() => setShowManualInput(true)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline">
                    Or enter a playlist URL manually
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {/* Video Player */}
        {currentPlaylist && (
          <div className="mx-auto transition-all duration-300 max-w-6xl">
            {isAuthenticated && isTokenExpiringSoon() && (
              <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
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

            <div className="player relative w-full">
              <PlayerHeader
                onResetPlaylist={resetPlaylist}
                showTitle={showTitle}
                countdown={titleCountdown}
                videoName={currentVideoTitle}
              />

              <VideoPlayer
                ref={youtubePlayerRef}
                currentPlaylist={currentPlaylist}
                currentVideoIndex={currentVideoIndex}
                videoDuration={videoDuration}
                powerHourActive={powerHourActive}
                onEmbedError={() => setEmbedError(true)}
                onVideoEnd={handleVideoEnd}
                onPlayerReady={handlePlayerReady}
              />
            </div>

            <PlayerControls
              timeRemaining={timeRemaining}
              powerHourActive={powerHourActive}
              videoDuration={videoDuration}
              currentVideoIndex={currentVideoIndex}
              totalVideos={totalVideos}
              onDurationChange={setVideoDuration}
              onTogglePlayPause={handleStartFromControls}
              onNextVideo={onNextPressed}
              isPlaying={powerHourActive}
            />
          </div>
        )}

      </div>
    </div>
  );
}
