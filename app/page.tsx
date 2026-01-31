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
import {
  extractPlaylistId,
  createEmbedUrl,
  createAlternativeEmbedUrl,
  createDirectEmbedUrl,
  createAutoplayEmbedUrl,
  createAutoplayAlternativeEmbedUrl,
  createAutoplayDirectEmbedUrl,
  estimatePlaylistSize,
  shuffleArray
} from "./hooks/useYouTubeUtils";

interface PlaylistData {
  id: string;
  embedUrl: string;
  originalUrl: string;
  totalVideos?: number;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistData | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  // Authentication and YouTube API hooks
  const { user, isAuthenticated, isLoading: authLoading, signIn, signOut, getAccessToken, error: authError } = useGoogleAuth();
  const { playlists, isLoading: playlistsLoading, error: playlistsError, fetchPlaylists } = useYouTubeAPI(getAccessToken);

  // Fetch playlists when user is authenticated
  useEffect(() => {
    if (isAuthenticated && playlists.length === 0) {
      fetchPlaylists();
    }
  }, [isAuthenticated]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [embedError, setEmbedError] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [totalVideos, setTotalVideos] = useState<number>(50); // Default estimate
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const youtubePlayerRef = useRef<any>(null);

  // Custom hooks
  const { startOverlayTimer, startTitleTimer, clearTimers, resetOverlayAndTitle, ...overlayProps } = useOverlayAndTitle(currentVideoIndex);

  const goToNextVideo = () => {
    if (!currentPlaylist) return;

    // Use YouTube Player API to go to next video automatically
    if (youtubePlayerRef.current?.nextVideo) {
      youtubePlayerRef.current.nextVideo();
    } else {
      // Fallback: increment video index manually
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
    }

    // Start overlay timer for new video
    if (powerHourActive) {
      startOverlayTimer();
      startTitleTimer();
    }
  };

  const { powerHourActive, timeRemaining, startPowerHour: basePowerHour, stopPowerHour: baseStopPowerHour, resetTimer } = usePowerHourTimer(goToNextVideo);

  const handleVideoPlay = () => {
    // Auto-start power hour when user presses play (if not already active)
    if (!powerHourActive) {
      startPowerHour();
    }
  };

  const handleVideoEnd = () => {
    // This is called when a video ends naturally (not forced by timer)
    if (powerHourActive) {
      // Start overlay timer for the next video that YouTube will auto-advance to
      startOverlayTimer();
      startTitleTimer();
    }
  };

  const startPowerHour = () => {
    basePowerHour();

    // Start overlay timer for current video
    startOverlayTimer();
    startTitleTimer();
  };

  const stopPowerHour = () => {
    baseStopPowerHour();

    // Clear overlay timer and hide overlay
    clearTimers();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleShuffle = () => {
    if (!currentPlaylist) return;

    if (!isShuffled) {
      // Create array of video indices based on estimated playlist size
      const indices = Array.from({ length: totalVideos }, (_, i) => i);
      const shuffled = shuffleArray(indices);
      setShuffledIndices(shuffled);
      setIsShuffled(true);

      // Update current video to use shuffled index
      const shuffledCurrentIndex = shuffled[currentVideoIndex] || 0;
      setCurrentPlaylist({
        ...currentPlaylist,
        embedUrl: createEmbedUrl(currentPlaylist.id, shuffledCurrentIndex)
      });
    } else {
      // Turn off shuffle, go back to original order
      setIsShuffled(false);
      setShuffledIndices([]);
      setCurrentPlaylist({
        ...currentPlaylist,
        embedUrl: createEmbedUrl(currentPlaylist.id, currentVideoIndex)
      });
    }
  };

  const handlePlaylistSubmit = async (url: string) => {
    setIsLoading(true);

    // Extract playlist ID and create playlist data
    const playlistId = extractPlaylistId(url);
    if (playlistId) {
      const estimatedTotal = estimatePlaylistSize(playlistId);
      setTotalVideos(estimatedTotal);

      const playlistData: PlaylistData = {
        id: playlistId,
        embedUrl: createEmbedUrl(playlistId, 0),
        originalUrl: url,
        totalVideos: estimatedTotal
      };

      setTimeout(() => {
        setCurrentPlaylist(playlistData);
        setCurrentVideoIndex(0);
        setEmbedError(false);
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  };

  // Handle playlist selection from YouTube API
  const handleYouTubePlaylistSelect = (playlist: YouTubePlaylist) => {
    const playlistData: PlaylistData = {
      id: playlist.id,
      embedUrl: createEmbedUrl(playlist.id, 0),
      originalUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
      totalVideos: playlist.itemCount
    };

    setCurrentPlaylist(playlistData);
    setCurrentVideoIndex(0);
    setTotalVideos(playlist.itemCount);
    setEmbedError(false);
  };

  // Handle sign out
  const handleSignOut = () => {
    signOut();
    resetPlaylist();
    setShowManualInput(false);
  };

  const resetPlaylist = () => {
    // Clear any active timer
    resetTimer();

    // Clear overlay timer
    clearTimers();
    resetOverlayAndTitle();

    setCurrentPlaylist(null);
    setCurrentVideoIndex(0);
    setEmbedError(false);
    setIsShuffled(false);
    setShuffledIndices([]);
    setTotalVideos(50); // Reset to default
    setIsFullscreen(false);
  };

  const handleTryFormat1 = () => {
    if (currentPlaylist) {
      const actualVideoIndex = isShuffled && shuffledIndices.length > 0
        ? shuffledIndices[currentVideoIndex] || currentVideoIndex
        : currentVideoIndex;
      const embedUrl = powerHourActive
        ? createAutoplayAlternativeEmbedUrl(currentPlaylist.id, actualVideoIndex)
        : createAlternativeEmbedUrl(currentPlaylist.id, actualVideoIndex);
      setCurrentPlaylist({
        ...currentPlaylist,
        embedUrl: embedUrl
      });
      setEmbedError(false);
    }
  };

  const handleTryFormat2 = () => {
    if (currentPlaylist) {
      const actualVideoIndex = isShuffled && shuffledIndices.length > 0
        ? shuffledIndices[currentVideoIndex] || currentVideoIndex
        : currentVideoIndex;
      const embedUrl = powerHourActive
        ? createAutoplayDirectEmbedUrl(currentPlaylist.id, actualVideoIndex)
        : createDirectEmbedUrl(currentPlaylist.id, actualVideoIndex);
      setCurrentPlaylist({
        ...currentPlaylist,
        embedUrl: embedUrl
      });
      setEmbedError(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-black">
      <div className="container mx-auto px-4 py-16">
        {/* Loading state during authentication */}
        {authLoading && (
          <div className="max-w-md mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Initializing...</p>
          </div>
        )}

        {/* Not authenticated - show login */}
        {!authLoading && !isAuthenticated && !showManualInput && (
          <div className="space-y-6">
            <LoginComponent onSignIn={signIn} isLoading={false} error={authError} />
            {authError && authError.includes("authorized origins") && (
              <OAuthSetupGuide />
            )}
            <div className="text-center">
              <button
                onClick={() => setShowManualInput(true)}
                className={`text-sm px-4 py-2 rounded-lg transition-colors ${authError
                  ? "bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                  }`}
              >
                {authError ? "→ Use Manual Playlist URL Instead" : "Or enter a playlist URL manually"}
              </button>
            </div>
          </div>
        )}

        {/* Manual input fallback */}
        {!authLoading && showManualInput && !currentPlaylist && (
          <div className="space-y-4">
            <PlaylistForm onSubmit={handlePlaylistSubmit} isLoading={isLoading} />
            <div className="text-center">
              <button
                onClick={() => setShowManualInput(false)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
              >
                ← Back to Google Sign In
              </button>
            </div>
          </div>
        )}

        {/* Authenticated but no playlist selected - show playlist selector */}
        {!authLoading && isAuthenticated && !currentPlaylist && !showManualInput && user && (
          <div className="space-y-6">
            <PlaylistSelector
              user={user}
              playlists={playlists}
              isLoading={playlistsLoading}
              error={playlistsError}
              onPlaylistSelect={handleYouTubePlaylistSelect}
              onRefreshPlaylists={fetchPlaylists}
              onSignOut={handleSignOut}
            />
            <div className="text-center">
              <button
                onClick={() => setShowManualInput(true)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
              >
                Or enter a playlist URL manually
              </button>
            </div>
          </div>
        )}

        {/* Playlist selected - show player */}
        {currentPlaylist && (
          <div className={`mx-auto transition-all duration-300 ${isFullscreen ? 'max-w-full px-2' : 'max-w-6xl'}`}>
            <PlayerHeader
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onResetPlaylist={resetPlaylist}
            />

            <VideoPlayer
              ref={youtubePlayerRef}
              currentPlaylist={currentPlaylist}
              isFullscreen={isFullscreen}
              embedError={embedError}
              isShuffled={isShuffled}
              shuffledIndices={shuffledIndices}
              currentVideoIndex={currentVideoIndex}
              powerHourActive={powerHourActive}
              onEmbedError={() => setEmbedError(true)}
              onTryFormat1={handleTryFormat1}
              onTryFormat2={handleTryFormat2}
              onVideoPlay={handleVideoPlay}
              onVideoEnd={handleVideoEnd}
              {...overlayProps}
            />

            <PlayerControls
              timeRemaining={timeRemaining}
              powerHourActive={powerHourActive}
              isShuffled={isShuffled}
              onToggleShuffle={toggleShuffle}
              onStartPowerHour={startPowerHour}
              onStopPowerHour={stopPowerHour}
              onNextVideo={goToNextVideo}
            />
          </div>
        )}
      </div>
    </div>
  );
}
