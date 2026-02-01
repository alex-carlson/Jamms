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
  const [shuffledPlaylists, setShuffledPlaylists] = useState<any[]>([]);

  // Fetch playlists when user is authenticated
  useEffect(() => {
    if (isAuthenticated && playlists.length === 0) {
      fetchPlaylists();
    }
  }, [isAuthenticated]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoCount, setVideoCount] = useState(0); // Running count from 0, incremented to 1 on first video
  const [embedError, setEmbedError] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [currentShufflePosition, setCurrentShufflePosition] = useState(0); // Track position in shuffle array
  const [totalVideos, setTotalVideos] = useState<number>(50); // Default estimate
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const youtubePlayerRef = useRef<any>(null);
  const timerIncrementRef = useRef(false); // Prevent double increments from timer

  // Custom hooks
  const { startOverlayTimer, startTitleTimer, clearTimers, resetOverlayAndTitle, ...overlayProps } = useOverlayAndTitle(currentVideoIndex);

  const goToNextVideo = (isAutoAdvance = false) => {
    console.log('=== goToNextVideo called ===');
    console.log('Current playlist:', currentPlaylist?.id);
    console.log('Current shuffle position:', currentShufflePosition);
    console.log('Shuffled indices:', shuffledIndices);
    console.log('Is auto advance:', isAutoAdvance);

    if (!currentPlaylist || shuffledIndices.length === 0) {
      console.log('No current playlist or shuffled indices, returning');
      return;
    }

    // Increment counter if this is an auto advance (timer)
    if (isAutoAdvance) {
      setVideoCount(prev => {
        console.log(`Auto: Incrementing video count from ${prev} to ${prev + 1}`);
        return prev + 1;
      });
    }

    // Always use shuffle mode now - go to next position in shuffle array
    setCurrentShufflePosition(prevPosition => {
      const nextShufflePosition = (prevPosition + 1) % shuffledIndices.length;
      const nextVideoIndex = shuffledIndices[nextShufflePosition];

      console.log(`Moving from position ${prevPosition} to position ${nextShufflePosition} (video ${nextVideoIndex})`);

      // Update video index - this will trigger VideoPlayer to recreate with new index
      setCurrentVideoIndex(nextVideoIndex);

      return nextShufflePosition;
    });
  };

  const goToNextVideoManual = () => {
    console.log('=== Manual next video triggered ===');
    console.log('Current video count before manual advance:', videoCount);

    // Increment counter for manual advance
    setVideoCount(prev => {
      console.log(`Manual: Incrementing video count from ${prev} to ${prev + 1}`);
      return prev + 1;
    });

    // Reset timer to full 60 seconds when manually advancing
    if (powerHourActive) {
      resetTimerToFull();
    }

    // Call the regular next video function - don't auto-increment
    goToNextVideo(false); // Pass false for manual advance
  };

  const handleTimerExpired = () => {
    console.log('=== Timer expired - auto advance ===');
    console.log(`Current video count before timer: ${videoCount}`);
    
    // Prevent double increments using ref
    if (timerIncrementRef.current) {
      console.log('Timer increment already in progress, skipping...');
      return;
    }
    
    timerIncrementRef.current = true;
    goToNextVideo(true); // Pass true for auto advance
    console.log('Timer: Finished calling goToNextVideo');
    
    // Reset the ref after a brief delay to allow for the next timer cycle
    setTimeout(() => {
      timerIncrementRef.current = false;
    }, 100);
  };

  const { powerHourActive, timeRemaining, videoDuration, setVideoDuration, startPowerHour: basePowerHour, stopPowerHour: baseStopPowerHour, resetTimer, resetTimerToFull } = usePowerHourTimer(handleTimerExpired);

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

  const handlePlayerReady = () => {
    // This is called when the YouTube player is ready after a video change
    if (powerHourActive) {
      console.log('Player ready - starting overlay timers');
      startOverlayTimer();
      startTitleTimer();
    }
  };

  const shufflePlaylistOrder = () => {
    // Fisher-Yates shuffle algorithm
    const shuffled = [...playlists];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledPlaylists(shuffled);
    console.log('Playlists shuffled:', shuffled.map(p => p.title));
  };

  const resetPlaylistOrder = () => {
    setShuffledPlaylists([]);
    console.log('Playlist order reset to original');
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

      // Automatically create shuffled list using all videos
      const videosToUse = estimatedTotal;
      const indices = Array.from({ length: estimatedTotal }, (_, i) => i);
      const shuffled = shuffleArray(indices);

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
        setVideoCount(0); // Reset running count for new playlist
        setEmbedError(false);
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  };

  // Handle playlist selection from YouTube API
  const handleYouTubePlaylistSelect = (playlist: YouTubePlaylist) => {
    // Automatically create shuffled list using all videos in playlist
    const videosToUse = playlist.itemCount;
    const indices = Array.from({ length: playlist.itemCount }, (_, i) => i);
    const shuffled = shuffleArray(indices);

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
    setVideoCount(0); // Reset running count for new playlist
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
    setVideoCount(0); // Reset running count
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
              playlists={shuffledPlaylists.length > 0 ? shuffledPlaylists : playlists}
              isLoading={playlistsLoading}
              error={playlistsError}
              onPlaylistSelect={handleYouTubePlaylistSelect}
              onRefreshPlaylists={fetchPlaylists}
              onSignOut={handleSignOut}
              onShufflePlaylists={shufflePlaylistOrder}
              onResetPlaylistOrder={resetPlaylistOrder}
              isShuffled={shuffledPlaylists.length > 0}
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
              currentVideoIndex={videoCount}
              powerHourActive={powerHourActive}
              onEmbedError={() => setEmbedError(true)}
              onTryFormat1={handleTryFormat1}
              onTryFormat2={handleTryFormat2}
              onVideoPlay={handleVideoPlay}
              onVideoEnd={handleVideoEnd}
              onPlayerReady={handlePlayerReady}
              {...overlayProps}
            />

            <PlayerControls
              timeRemaining={timeRemaining}
              powerHourActive={powerHourActive}
              videoDuration={videoDuration}
              currentVideoIndex={videoCount}
              totalVideos={totalVideos}
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
