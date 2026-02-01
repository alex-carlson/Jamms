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
  const { user, isAuthenticated, isLoading: authLoading, signIn, signOut, getAccessToken, error: authError, googleLoaded, isTokenExpiringSoon } = useGoogleAuth();
  const { playlists, isLoading: playlistsLoading, error: playlistsError, fetchPlaylists } = useYouTubeAPI(getAccessToken);

  // Fetch playlists when user is authenticated
  useEffect(() => {
    if (isAuthenticated && playlists.length === 0) {
      fetchPlaylists();
    }
  }, [isAuthenticated]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [embedError, setEmbedError] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [currentShufflePosition, setCurrentShufflePosition] = useState(0); // Track position in shuffle array
  const [totalVideos, setTotalVideos] = useState<number>(50); // Default estimate
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const youtubePlayerRef = useRef<any>(null);

  // Custom hooks
  const { startOverlayTimer, startTitleTimer, clearTimers, resetOverlayAndTitle, ...overlayProps } = useOverlayAndTitle(currentVideoIndex);

  const goToNextVideo = () => {
    console.log('=== goToNextVideo called ===');
    console.log('Current playlist:', currentPlaylist?.id);
    console.log('Current shuffle position:', currentShufflePosition);
    console.log('Shuffled indices:', shuffledIndices);

    if (!currentPlaylist || shuffledIndices.length === 0) {
      console.log('No current playlist or shuffled indices, returning');
      return;
    }

    // Always use shuffle mode now - go to next position in shuffle array
    setCurrentShufflePosition(prevPosition => {
      const nextShufflePosition = (prevPosition + 1) % shuffledIndices.length;
      const nextVideoIndex = shuffledIndices[nextShufflePosition];

      console.log(`Moving from position ${prevPosition} to position ${nextShufflePosition} (video ${nextVideoIndex})`);

      // Update video index
      setCurrentVideoIndex(nextVideoIndex);

      // Use YouTube Player API to jump to the specific video index
      if (youtubePlayerRef.current?.playVideoAt) {
        console.log(`Calling playVideoAt(${nextVideoIndex})`);
        youtubePlayerRef.current.playVideoAt(nextVideoIndex);
      } else {
        console.log('playVideoAt method not available on player');
      }

      return nextShufflePosition;
    });

    // Start overlay timer for new video
    if (powerHourActive) {
      startOverlayTimer();
      startTitleTimer();
    }
  };

  const goToNextVideoManual = () => {
    console.log('=== Manual next video triggered ===');

    // Reset timer to full 60 seconds when manually advancing
    if (powerHourActive) {
      resetTimerToFull();
    }

    // Call the regular next video function
    goToNextVideo();
  };

  const { powerHourActive, timeRemaining, videoDuration, setVideoDuration, startPowerHour: basePowerHour, stopPowerHour: baseStopPowerHour, resetTimer, resetTimerToFull } = usePowerHourTimer(goToNextVideo);

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

  const handlePlaylistSubmit = async (url: string) => {
    setIsLoading(true);

    // Extract playlist ID and create playlist data
    const playlistId = extractPlaylistId(url);
    if (playlistId) {
      const estimatedTotal = estimatePlaylistSize(playlistId);

      // Automatically create shuffled list of 60 videos (or total if less than 60)
      const videosToUse = Math.min(60, estimatedTotal);
      const indices = Array.from({ length: estimatedTotal }, (_, i) => i);
      const shuffled = shuffleArray(indices).slice(0, videosToUse);

      setTotalVideos(videosToUse);
      setShuffledIndices(shuffled);
      setCurrentShufflePosition(0);

      const playlistData: PlaylistData = {
        id: playlistId,
        embedUrl: createEmbedUrl(playlistId, shuffled[0]),
        originalUrl: url,
        totalVideos: videosToUse
      };

      setTimeout(() => {
        setCurrentPlaylist(playlistData);
        setCurrentVideoIndex(shuffled[0]);
        setEmbedError(false);
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  };

  // Handle playlist selection from YouTube API
  const handleYouTubePlaylistSelect = (playlist: YouTubePlaylist) => {
    // Automatically create shuffled list of 60 videos (or total if less than 60)
    const videosToUse = Math.min(60, playlist.itemCount);
    const indices = Array.from({ length: playlist.itemCount }, (_, i) => i);
    const shuffled = shuffleArray(indices).slice(0, videosToUse);

    setTotalVideos(videosToUse);
    setShuffledIndices(shuffled);
    setCurrentShufflePosition(0);

    const playlistData: PlaylistData = {
      id: playlist.id,
      embedUrl: createEmbedUrl(playlist.id, shuffled[0]),
      originalUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
      totalVideos: videosToUse
    };

    setCurrentPlaylist(playlistData);
    setCurrentVideoIndex(shuffled[0]);
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
    setShuffledIndices([]);
    setCurrentShufflePosition(0);
    setTotalVideos(50); // Reset to default
    setIsFullscreen(false);
  };

  const handleTryFormat1 = () => {
    if (currentPlaylist) {
      const embedUrl = powerHourActive
        ? createAutoplayAlternativeEmbedUrl(currentPlaylist.id, currentVideoIndex)
        : createAlternativeEmbedUrl(currentPlaylist.id, currentVideoIndex);
      setCurrentPlaylist({
        ...currentPlaylist,
        embedUrl: embedUrl
      });
      setEmbedError(false);
    }
  };

  const handleTryFormat2 = () => {
    if (currentPlaylist) {
      const embedUrl = powerHourActive
        ? createAutoplayDirectEmbedUrl(currentPlaylist.id, currentVideoIndex)
        : createDirectEmbedUrl(currentPlaylist.id, currentVideoIndex);
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
            <LoginComponent onSignIn={signIn} isLoading={authLoading} error={authError} googleLoaded={googleLoaded} />
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
            {/* Token expiration warning */}
            {isTokenExpiringSoon() && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-600 dark:text-yellow-400">⚠️</div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Session Expiring Soon
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Your login session will expire soon. Consider signing in again for uninterrupted access.
                    </p>
                    <button
                      onClick={() => {
                        signOut();
                        setTimeout(() => signIn(), 100);
                      }}
                      className="mt-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded font-medium transition-colors"
                    >
                      Refresh Session
                    </button>
                  </div>
                </div>
              </div>
            )}

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
            {/* Token expiration warning for active sessions */}
            {isAuthenticated && isTokenExpiringSoon() && !isFullscreen && (
              <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                    <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      Session expiring soon
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setTimeout(() => signIn(), 100);
                    }}
                    className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}

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
              isShuffled={true}
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
              videoDuration={videoDuration}
              onDurationChange={setVideoDuration}
              onStartPowerHour={startPowerHour}
              onStopPowerHour={stopPowerHour}
              onNextVideo={goToNextVideoManual}
            />
          </div>
        )}
      </div>
    </div>
  );
}
