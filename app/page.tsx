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
  videoIds: string[];
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
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(1);
  const [videoCount, setVideoCount] = useState(0);
  const [embedError, setEmbedError] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [totalVideos, setTotalVideos] = useState<number>(60)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
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
      if (nextIndex >= shuffledIndices.length) {
        console.log('Reached end of shuffled playlist.');
        return prev; // Don't increment past end
      }
      return nextIndex;
    });
  };

  const handleTimerExpired = () => {
    timerIncrementRef.current = true;
    goToNextVideo();

    setTimeout(() => {
      timerIncrementRef.current = false;
    }, 100);
  };

  const { powerHourActive, timeRemaining, videoDuration, setVideoDuration, startPowerHour: basePowerHour, stopPowerHour: baseStopPowerHour, resetTimer, resetTimerToFull } = usePowerHourTimer(handleTimerExpired);

  const onResetTimerToFull = () => {
    resetTimerToFull();
  }

  // Called when user presses Play in the controls. This should be a user gesture
  // so we both cue and start playback here; the timer starts later when playback
  // actually begins (onVideoPlay callback).
  const handleStartFromControls = () => {
    if (youtubePlayerRef.current) {
      try {
        if (typeof youtubePlayerRef.current.playVideoAt === 'function') {
          youtubePlayerRef.current.playVideoAt(currentVideoIndex);
        }
        if (typeof youtubePlayerRef.current.startPlayback === 'function') {
          youtubePlayerRef.current.startPlayback();
        } else if (youtubePlayerRef.current.player && typeof youtubePlayerRef.current.player.playVideo === 'function') {
          youtubePlayerRef.current.player.playVideo();
        }
      } catch (e) {
        console.error('Error while starting playback from controls:', e);
      }
    }
  };

  // Called by VideoPlayer when the player reaches PLAYING state.
  const handlePlaybackStarted = () => {
    if (!powerHourActive) {
      startPowerHour();
    }
  };

  const handleVideoSeekedReady = () => {
    // Seek completed — do not start the timer here. Playback/start is triggered
    // by the user gesture (controls) and the real start is handled in
    // `handlePlaybackStarted` when the player reports PLAYING.
    if (youtubePlayerRef.current && typeof youtubePlayerRef.current.startPlayback === 'function') {
      try { youtubePlayerRef.current.startPlayback(); } catch (e) { console.error(e); }
    }
  };

  // When the current video index changes while a power hour is active,
  // cue the player to the new index so playback moves to the next video.
  useEffect(() => {
    if (!powerHourActive) return;
    if (!youtubePlayerRef.current) return;
    if (typeof youtubePlayerRef.current.playVideoAt !== 'function') return;

    try {
      youtubePlayerRef.current.playVideoAt(currentVideoIndex);
    } catch (e) {
      console.error('Error cueing next video after index change:', e);
    }
  }, [currentVideoIndex, powerHourActive]);

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
    if (youtubePlayerRef.current && youtubePlayerRef.current.stopVideo) {
      youtubePlayerRef.current.stopVideo();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const onNextPressed = () => {
    goToNextVideo();
    onResetTimerToFull();
  }

  // Helper to fetch all video IDs from a playlist (handles pagination)
  const fetchAllPlaylistVideoIds = async (playlistId: string, token: string) => {
    let videoIds: string[] = [];
    let nextPageToken = '';
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      videoIds = videoIds.concat(data.items.map((item: any) => item.snippet.resourceId.videoId));
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);
    return videoIds;
  };

  const handlePlaylistSubmit = async (url: string) => {
    setIsLoading(true);

    const playlistId = extractPlaylistId(url);
    if (playlistId) {
      try {
        const token = getAccessToken();
        const videoIds = await fetchAllPlaylistVideoIds(playlistId, token);
        console.log("VideoIds length: ", videoIds);
        const videosToUse = videoIds.length;
        const indices = Array.from({ length: videosToUse }, (_, i) => i);
        const shuffled = shuffleArray(indices);

        setTotalVideos(shuffled.length);
        setShuffledIndices(shuffled);

        const playlistData: PlaylistData = {
          id: playlistId,
          embedUrl: createEmbedUrl(playlistId, shuffled[0]),
          originalUrl: url,
          totalVideos: videosToUse,
          shuffledData: shuffled,
          videoIds,
        };

        setCurrentPlaylist(playlistData);
        setCurrentVideoIndex(1);
        setVideoCount(0); // Reset running count for new playlist
        setEmbedError(false);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        setEmbedError(true);
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleYouTubePlaylistSelect = (playlist: YouTubePlaylist) => {
    setIsLoading(true);
    (async () => {
      try {
        const token = getAccessToken();
        const videoIds = await fetchAllPlaylistVideoIds(playlist.id, token);
        const videosToUse = videoIds.length;
        console.log("playlist video ids:", videoIds);
        const indices = Array.from({ length: videosToUse }, (_, i) => i);
        const shuffled = shuffleArray(indices);

        setTotalVideos(shuffled.length);
        setShuffledIndices(shuffled);

        const playlistData: PlaylistData = {
          id: playlist.id,
          embedUrl: createEmbedUrl(playlist.id, shuffled[0]),
          originalUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
          totalVideos: videosToUse,
          shuffledData: shuffled,
          videoIds,
        };

        setCurrentPlaylist(playlistData);
        setCurrentVideoIndex(1);
        setVideoCount(0); // Reset running count for new playlist
        setEmbedError(false);
        setIsLoading(false);
      } catch (err) {
        setEmbedError(true);
        setIsLoading(false);
      }
    })();
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
  };

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-black min-h-screen">
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
                </>
              )}
            </div>
          )}

          {currentPlaylist && (
            <div className={`mx-auto transition-all duration-300 max-w-6xl`}>
              {isAuthenticated && isTokenExpiringSoon() && (
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
                onResetPlaylist={resetPlaylist}
              />

              <VideoPlayer
                ref={youtubePlayerRef}
                currentPlaylist={currentPlaylist}
                embedError={embedError}
                shuffledIndices={shuffledIndices}
                currentVideoIndex={currentVideoIndex}
                timerDuration={videoDuration}
                powerHourActive={powerHourActive}
                onEmbedError={() => setEmbedError(true)}
                onVideoPlay={handlePlaybackStarted}
                onVideoEnd={handleVideoEnd}
                onPlayerReady={handlePlayerReady}
                onVideoSeekedReady={handleVideoSeekedReady}
                {...overlayProps}
              />

              <PlayerControls
                timeRemaining={timeRemaining}
                powerHourActive={powerHourActive}
                videoDuration={videoDuration}
                currentVideoIndex={currentVideoIndex}
                totalVideos={totalVideos}
                onDurationChange={setVideoDuration}
                onStartPowerHour={handleStartFromControls}
                onStopPowerHour={stopPowerHour}
                onNextVideo={onNextPressed}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
