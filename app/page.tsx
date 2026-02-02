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
  shuffleArray
} from "./hooks/useYouTubeUtils";

export interface PlaylistData {
  id: string;
  embedUrl: string;
  originalUrl: string;
  totalVideos?: number;
  shuffledData: number[];
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistData | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  const { user, isAuthenticated, isLoading: authLoading, signIn, signOut, getAccessToken, error: authError, googleLoaded, isTokenExpiringSoon } = useGoogleAuth();
  const { playlists, isLoading: playlistsLoading, error: playlistsError, fetchPlaylists } = useYouTubeAPI(getAccessToken);
  const [shuffledPlaylists, setShuffledPlaylists] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated && playlists.length === 0) {
      fetchPlaylists();
    }
  }, [isAuthenticated]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [videoCount, setVideoCount] = useState(0);
  const [embedError, setEmbedError] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [totalVideos, setTotalVideos] = useState<number>(60)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState(false);
  const youtubePlayerRef = useRef<any>(null);
  const timerIncrementRef = useRef(false); // Prevent double increments from timer

  const { startOverlayTimer, startTitleTimer, clearTimers, resetOverlayAndTitle, ...overlayProps } = useOverlayAndTitle(currentVideoIndex);

  const goToNextVideo = () => {
    if (!currentPlaylist || shuffledIndices.length === 0) {
      console.log('No current playlist or shuffled indices, returning');
      return;
    }

    setCurrentVideoIndex(prev => {
      const nextIndex = Number(prev) + 1;
      return nextIndex;
    });
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  }

  const handleTimerExpired = () => {
    timerIncrementRef.current = true;
    goToNextVideo();

    setTimeout(() => {
      timerIncrementRef.current = false;
    }, 100);
  };

  const { powerHourActive, timeRemaining, videoDuration, setVideoDuration, startPowerHour: basePowerHour, stopPowerHour: baseStopPowerHour, resetTimer, resetTimerToFull } = usePowerHourTimer(handleTimerExpired);

  const handleVideoPlay = () => {
    if (!powerHourActive) {
      startPowerHour();
    }
  };

  const handleVideoEnd = () => {
    if (powerHourActive) {
      startOverlayTimer();
      startTitleTimer();
    }
  };

  const handlePlayerReady = () => {
    if (powerHourActive) {
      startPowerHour();
      startOverlayTimer();
      startTitleTimer();
    }
  };

  const shufflePlaylistOrder = () => {
    const shuffled = [...playlists];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledPlaylists(shuffled);
  };

  const resetPlaylistOrder = () => {
    setShuffledPlaylists([]);
  };

  const startPowerHour = () => {
    basePowerHour();

    startOverlayTimer();
    startTitleTimer();
  };

  const stopPowerHour = () => {
    baseStopPowerHour();

    clearTimers();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePlaylistSubmit = async (url: string) => {
    setIsLoading(true);

    const playlistId = extractPlaylistId(url);
    if (playlistId) {
      const estimatedTotal = 60;

      const videosToUse = estimatedTotal;
      const indices = Array.from({ length: estimatedTotal }, (_, i) => i);
      const shuffled = shuffleArray(indices);

      setTotalVideos(videosToUse);
      setShuffledIndices(shuffled);

      const playlistData: PlaylistData = {
        id: playlistId,
        embedUrl: createEmbedUrl(playlistId, shuffled[0]),
        originalUrl: url,
        totalVideos: videosToUse,
        shuffledData: shuffled
      };

      setTimeout(() => {
        setCurrentPlaylist(playlistData);
        setCurrentVideoIndex(0);
        setVideoCount(0); // Reset running count for new playlist
        setEmbedError(false);
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  };

  const handleYouTubePlaylistSelect = (playlist: YouTubePlaylist) => {
    const videosToUse = playlist.itemCount;
    const indices = Array.from({ length: playlist.itemCount }, (_, i) => i);
    const shuffled = shuffleArray(indices);

    setTotalVideos(videosToUse);
    setShuffledIndices(shuffled);

    const playlistData: PlaylistData = {
      id: playlist.id,
      embedUrl: createEmbedUrl(playlist.id, shuffled[0]),
      originalUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
      totalVideos: videosToUse,
      shuffledData: shuffled
    };

    setCurrentPlaylist(playlistData);
    setCurrentVideoIndex(0);
    setVideoCount(0); // Reset running count for new playlist
    setEmbedError(false);
  };

  const handleSignOut = () => {
    signOut();
    resetPlaylist();
    setShowManualInput(false);
  };

  const resetPlaylist = () => {
    resetTimer();

    clearTimers();
    resetOverlayAndTitle();

    setCurrentPlaylist(null);
    setCurrentVideoIndex(0);
    setVideoCount(0); // Reset running count
    setEmbedError(false);
    setShuffledIndices([]);
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

        {!authLoading && isAuthenticated && !currentPlaylist && !showManualInput && user && (
          <div className="space-y-6">
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

        {currentPlaylist && (
          <div className={`mx-auto transition-all duration-300 ${isFullscreen ? 'max-w-full px-2' : 'max-w-6xl'}`}>
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
              onPlayerReady={handlePlayerReady}
              isMuted={isMuted}
              {...overlayProps}
            />

            <PlayerControls
              timeRemaining={timeRemaining}
              powerHourActive={powerHourActive}
              videoDuration={videoDuration}
              currentVideoIndex={currentVideoIndex}
              totalVideos={totalVideos}
              onDurationChange={setVideoDuration}
              onStartPowerHour={handleVideoPlay}
              onStopPowerHour={stopPowerHour}
              onNextVideo={goToNextVideo}
              onMuteToggle={toggleMute}
              isMuted={isMuted}
            />
          </div>
        )}
      </div>
    </div>
  );
}
