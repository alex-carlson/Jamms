"use client";

import { useState, useEffect } from "react";
import {
  Clipboard,
  Rocket,
  ChevronDown,
  ChevronUp,
  Shuffle,
  List,
  Play,
  Pause,
  SkipForward
} from "lucide-react";

interface PlaylistData {
  id: string;
  embedUrl: string;
  originalUrl: string;
  totalVideos?: number;
}

export default function Home() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistData | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [powerHourActive, setPowerHourActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [embedError, setEmbedError] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [totalVideos, setTotalVideos] = useState<number>(50); // Default estimate
  const [timerRef, setTimerRef] = useState<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [overlayTimerRef, setOverlayTimerRef] = useState<NodeJS.Timeout | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [showTitle, setShowTitle] = useState<boolean>(false);
  const [titleTimerRef, setTitleTimerRef] = useState<NodeJS.Timeout | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>("");

  // Cleanup timer on component unmount
  useEffect(() => {
    // Listen for messages from YouTube iframe to get video titles
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from YouTube
      if (event.origin !== 'https://www.youtube.com' && event.origin !== 'https://www.youtube-nocookie.com') {
        return;
      }

      try {
        // YouTube sends various messages, look for video info
        if (typeof event.data === 'string' && event.data.includes('title')) {
          const data = JSON.parse(event.data);
          if (data.title && data.title.length > 0) {
            setCurrentVideoTitle(data.title);
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (timerRef) {
        clearInterval(timerRef);
      }
      if (overlayTimerRef) {
        clearTimeout(overlayTimerRef);
      }
      if (titleTimerRef) {
        clearTimeout(titleTimerRef);
      }
    };
  }, [timerRef, overlayTimerRef, titleTimerRef]);

  const validateYouTubePlaylistUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Allow empty input

    const patterns = [
      /^https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
      /^https?:\/\/(?:www\.)?youtube\.com\/watch\?.*[&?]list=([a-zA-Z0-9_-]+)/,
      /^https?:\/\/youtu\.be\/.*[&?]list=([a-zA-Z0-9_-]+)/
    ];

    return patterns.some(pattern => pattern.test(url));
  };

  const extractPlaylistId = (url: string): string | null => {
    const patterns = [
      /[&?]list=([a-zA-Z0-9_-]+)/,
      /playlist\?list=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const createEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // Use the most reliable format for playlist embeds as the primary option
    // Add index parameter to start at specific video in playlist
    // Remove autoplay to prevent auto-start on load
    // Start videos at 60 seconds (roughly 1/3 through a typical 3-min song)
    return `https://www.youtube.com/embed?list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=0&controls=1&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
  };

  const createAlternativeEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // Alternative format with listType parameter
    // Start videos at 60 seconds (roughly 1/3 through a typical 3-min song)
    return `https://www.youtube.com/embed?listType=playlist&list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=0&controls=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
  };

  const createDirectEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // YouTube nocookie domain version (sometimes works when regular doesn't)
    // Start videos at 60 seconds (roughly 1/3 through a typical 3-min song)
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=0&controls=1&showinfo=0&rel=0`;
  };

  const createAutoplayEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // Version with autoplay for power hour mode
    // Start videos at 60 seconds (roughly 1/3 through a typical 3-min song)
    return `https://www.youtube.com/embed?list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=1&controls=1&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
  };

  const createAutoplayAlternativeEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // Alternative format with autoplay and start time
    return `https://www.youtube.com/embed?listType=playlist&list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=1&controls=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
  };

  const createAutoplayDirectEmbedUrl = (playlistId: string, videoIndex: number = 0): string => {
    // Direct format with autoplay and start time
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&index=${videoIndex + 1}&start=60&autoplay=1&controls=1&showinfo=0&rel=0`;
  };

  const startOverlayTimer = () => {
    // Clear any existing overlay timer
    if (overlayTimerRef) {
      clearTimeout(overlayTimerRef);
    }

    // Show overlay immediately
    setShowOverlay(true);

    // Hide overlay after 5 seconds
    const timer = setTimeout(() => {
      setShowOverlay(false);
    }, 5000);

    setOverlayTimerRef(timer);
  };

  const startTitleTimer = () => {
    console.log('Starting title timer for video:', currentVideoIndex + 1); // Debug log
    // Clear any existing title timer
    if (titleTimerRef) {
      clearTimeout(titleTimerRef);
    }

    // Hide title initially
    setShowTitle(false);
    setVideoTitle("");

    // Show title after 15 seconds
    const timer = setTimeout(() => {
      // Use the actual video title if available, otherwise use a simple format
      const title = currentVideoTitle && currentVideoTitle.trim()
        ? currentVideoTitle.replace(' - YouTube', '')
        : `Video ${currentVideoIndex + 1}`;

      setVideoTitle(title);
      setShowTitle(true);
      console.log('Title timer fired:', title); // Debug log
    }, 15000);

    setTitleTimerRef(timer);
  };



  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: number[]): number[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function to get playlist info (simplified - in real app you'd use YouTube API)
  const estimatePlaylistSize = (playlistId: string): number => {
    // Since we can't easily get exact count without YouTube API key,
    // we'll use a reasonable default and let users know it's estimated
    // In a real implementation, you'd fetch from YouTube API
    return 50; // Default estimate
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

  const goToNextVideo = () => {
    if (!currentPlaylist) return;

    const nextIndex = currentVideoIndex + 1;
    setCurrentVideoIndex(nextIndex);

    // Use shuffled index if shuffle is enabled
    const actualVideoIndex = isShuffled && shuffledIndices.length > 0
      ? shuffledIndices[nextIndex] || nextIndex
      : nextIndex;

    // Use autoplay version if power hour is active
    const embedUrl = powerHourActive
      ? createAutoplayEmbedUrl(currentPlaylist.id, actualVideoIndex)
      : createEmbedUrl(currentPlaylist.id, actualVideoIndex);

    setCurrentPlaylist({
      ...currentPlaylist,
      embedUrl: embedUrl
    });
    setTimeRemaining(60);

    // Start overlay timer for new video
    if (powerHourActive) {
      startOverlayTimer();
      startTitleTimer();
    }
  }; const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPlaylistUrl(url);
    setIsValidUrl(validateYouTubePlaylistUrl(url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playlistUrl.trim()) {
      setIsValidUrl(false);
      return;
    }

    if (!validateYouTubePlaylistUrl(playlistUrl)) {
      setIsValidUrl(false);
      return;
    }

    setIsLoading(true);

    // Extract playlist ID and create playlist data
    const playlistId = extractPlaylistId(playlistUrl);
    if (playlistId) {
      const estimatedTotal = estimatePlaylistSize(playlistId);
      setTotalVideos(estimatedTotal);

      const playlistData: PlaylistData = {
        id: playlistId,
        embedUrl: createEmbedUrl(playlistId, 0),
        originalUrl: playlistUrl,
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
      setIsValidUrl(false);
    }
  };

  const startPowerHour = () => {
    setPowerHourActive(true);
    setTimeRemaining(60);

    // Update embed URL to use autoplay version
    if (currentPlaylist) {
      const actualVideoIndex = isShuffled && shuffledIndices.length > 0
        ? shuffledIndices[currentVideoIndex] || currentVideoIndex
        : currentVideoIndex;

      setCurrentPlaylist({
        ...currentPlaylist,
        embedUrl: createAutoplayEmbedUrl(currentPlaylist.id, actualVideoIndex)
      });
    }

    // Clear any existing timer
    if (timerRef) {
      clearInterval(timerRef);
    }

    // Start the 60-second timer that continues running
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next video and reset timer
          goToNextVideo();
          return 60; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);

    setTimerRef(timer);

    // Start overlay timer for current video
    startOverlayTimer();
    startTitleTimer();
  };

  const stopPowerHour = () => {
    setPowerHourActive(false);
    setTimeRemaining(60);

    // Clear the timer
    if (timerRef) {
      clearInterval(timerRef);
      setTimerRef(null);
    }

    // Clear overlay timer and hide overlay
    if (overlayTimerRef) {
      clearTimeout(overlayTimerRef);
      setOverlayTimerRef(null);
    }
    setShowOverlay(false);

    // Clear title timer and hide title
    if (titleTimerRef) {
      clearTimeout(titleTimerRef);
      setTitleTimerRef(null);
    }
    setShowTitle(false);
    setVideoTitle("");

    // Update embed URL to remove autoplay
    if (currentPlaylist) {
      const actualVideoIndex = isShuffled && shuffledIndices.length > 0
        ? shuffledIndices[currentVideoIndex] || currentVideoIndex
        : currentVideoIndex;

      setCurrentPlaylist({
        ...currentPlaylist,
        embedUrl: createEmbedUrl(currentPlaylist.id, actualVideoIndex)
      });
    }
  };

  const resetPlaylist = () => {
    // Clear any active timer
    if (timerRef) {
      clearInterval(timerRef);
      setTimerRef(null);
    }

    // Clear overlay timer
    if (overlayTimerRef) {
      clearTimeout(overlayTimerRef);
      setOverlayTimerRef(null);
    }

    // Clear title timer
    if (titleTimerRef) {
      clearTimeout(titleTimerRef);
      setTitleTimerRef(null);
    }

    setCurrentPlaylist(null);
    setPowerHourActive(false);
    setCurrentVideoIndex(0);
    setTimeRemaining(60);
    setEmbedError(false);
    setIsShuffled(false);
    setShuffledIndices([]);
    setTotalVideos(50); // Reset to default
    setIsFullscreen(false);
    setShowOverlay(false);
    setVideoTitle("");
    setShowTitle(false);
    setCurrentVideoTitle("");
    setPlaylistUrl("");
  };

  const handlePaste = async () => {
    try {
      // Check if clipboard API is available and document has focus
      if (!navigator.clipboard) {
        alert('Clipboard API not supported. Please manually paste the URL.');
        return;
      }

      // Check if document has focus (required for clipboard access)
      if (!document.hasFocus()) {
        alert('Please click on the page first, then try pasting again.');
        return;
      }

      const text = await navigator.clipboard.readText();
      setPlaylistUrl(text);
      setIsValidUrl(validateYouTubePlaylistUrl(text));
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
      // Fallback: focus the input and let user paste manually
      const input = document.getElementById('playlist-url') as HTMLInputElement;
      if (input) {
        input.focus();
        alert('Please paste the URL manually using Ctrl+V (Windows) or Cmd+V (Mac)');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-black">
      <div className="container mx-auto px-4 py-16">
        {!currentPlaylist ? (
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                ACarCrash Power Hours
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Enter a youtube playlist url and create an automatic power hour
              </p>
            </div>

            {/* Main Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="playlist-url"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    YouTube Playlist URL
                  </label>
                  <div className="relative">
                    <input
                      id="playlist-url"
                      type="url"
                      value={playlistUrl}
                      onChange={handleUrlChange}
                      placeholder="https://www.youtube.com/playlist?list=..."
                      className={`w-full px-4 py-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${!isValidUrl
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                        }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
                      disabled={isLoading}
                    >
                      <Clipboard className="h-4 w-4" />
                      <span>Paste</span>
                    </button>
                  </div>
                  {!isValidUrl && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Please enter a valid YouTube playlist URL
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !playlistUrl.trim() || !isValidUrl}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="h-5 w-5" />
                      <span>Load Playlist</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Example URLs */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Supported URL formats:
              </p>
              <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                <div>youtube.com/playlist?list=PLxxxxxx</div>
                <div>youtube.com/watch?v=xxxxx&list=PLxxxxxx</div>
                <div>youtu.be/xxxxx?list=PLxxxxxx</div>
              </div>
            </div>
          </div>
        ) : (
          /* Playlist Player View */
          <div className={`mx-auto transition-all duration-300 ${isFullscreen ? 'max-w-full px-2' : 'max-w-6xl'}`}>
            {/* Header Controls */}
            <div className={`flex justify-between items-center mb-6 ${isFullscreen ? 'px-4' : ''}`}>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Power Hour Player
                </h1>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={toggleFullscreen}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isFullscreen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                </button>
                <button
                  onClick={resetPlaylist}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ← Back to Setup
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className={`bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 ${isFullscreen ? 'mx-4' : ''}`}>
              {/* Black overlay bar to hide YouTube title */}
              {showOverlay && (
                <div className="relative z-10">
                  <div className="absolute top-0 left-0 right-0 bg-black h-[100px] z-10"></div>
                </div>
              )}

              {/* Video Title Overlay - Bottom Left */}
              {showTitle && videoTitle && (
                <div className="relative z-20">
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg backdrop-blur-sm animate-fade-in max-w-md">
                    <h2 className="text-sm font-semibold truncate">
                      {videoTitle}
                    </h2>
                  </div>
                </div>
              )}

              <div className="relative" style={{ paddingBottom: isFullscreen ? '70vh' : '56.25%', height: 0 }}>
                {embedError ? (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 text-white">
                    <div className="text-center p-8">
                      <h3 className="text-xl font-semibold mb-4">Video Unavailable</h3>
                      <p className="text-gray-300 mb-4">This playlist may have embedding restrictions.</p>
                      <div className="space-y-3 mb-4">
                        <button
                          onClick={() => {
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
                          }}
                          className="block w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Try Format #1
                        </button>
                        <button
                          onClick={() => {
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
                          }}
                          className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Try Format #2
                        </button>
                      </div>
                      <div className="mt-4">
                        <a
                          href={currentPlaylist?.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Open in YouTube
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={currentPlaylist.embedUrl}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
                    allowFullScreen
                    title="YouTube Playlist Player"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                    onError={() => setEmbedError(true)}
                  />
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Timer Display */}
                <div className="text-center sm:text-left">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Time remaining in current video
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 max-w-md mx-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-red-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${((60 - timeRemaining) / 60) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                    {60 - timeRemaining}s elapsed
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={toggleShuffle}
                    className={`font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 ${isShuffled
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                      }`}
                    disabled={powerHourActive}
                  >
                    <span>{isShuffled ? '🔀' : '📋'}</span>
                    <span>{isShuffled ? 'Shuffled' : 'Shuffle'}</span>
                  </button>

                  {!powerHourActive ? (
                    <button
                      onClick={startPowerHour}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Power Hour</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopPowerHour}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Pause className="h-4 w-4" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    onClick={goToNextVideo}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <SkipForward className="h-4 w-4" />
                    <span>Next</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
