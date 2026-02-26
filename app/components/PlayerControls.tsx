"use client";

import { useState } from "react";
import { Pause, Play, SkipForward } from "lucide-react";

interface PlayerControlsProps {
    timeRemaining: number;
    powerHourActive: boolean;
    videoDuration: number;
    playbackStartMode: "thirty-seconds" | "one-third" | "full";
    currentVideoIndex: number;
    totalVideos: number;
    onDurationChange: (duration: number) => void;
    onPlaybackStartModeChange: (mode: "thirty-seconds" | "one-third" | "full") => void;
    onTogglePlayPause: () => void;
    onNextVideo: () => void;
    isPlaying: boolean; // state to determine play/pause icon
}

export default function PlayerControls({
    timeRemaining,
    playbackStartMode,
    currentVideoIndex,
    totalVideos,
    onPlaybackStartModeChange,
    onTogglePlayPause,
    onNextVideo,
    isPlaying,
}: PlayerControlsProps) {
    const [controlsOpen, setControlsOpen] = useState(true);
    const displayTextClassName = "text-6xl text-white";
    const displayTextStyle = { textShadow: "2px 2px 8px rgba(0,0,0,0.7), 0 0 2px #000" };
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const formattedTime = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${seconds}`;

    return (
        <div className="fixed bottom-0 left-0 w-full px-2 sm:px-6 py-4 text-white flex justify-center">
            <div className="max-w-4xl w-full flex flex-col gap-3">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
                    <div className="text-6xl font-bold text-white w-[6ch] text-right tabular-nums" style={displayTextStyle}>
                        {formattedTime}
                    </div>
                    <div className="text-4xl font-light text-white" style={displayTextStyle}>
                        {currentVideoIndex + 1}/{totalVideos + 1}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setControlsOpen((prev) => !prev)}
                            className={`bg-black/60 border border-white/30 text-white rounded-md p-2 transition-opacity duration-300 flex-shrink-0 ${controlsOpen ? "opacity-100" : "opacity-50"}`}
                            aria-label={controlsOpen ? "Collapse controls" : "Expand controls"}
                        >
                            <span className="inline-flex h-4 w-4 items-center justify-center text-sm font-bold leading-none">
                                {controlsOpen ? "-" : "..."}
                            </span>
                        </button>

                        <div className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-3 overflow-hidden transition-all duration-300 ${controlsOpen ? "max-h-96 max-w-4xl" : "max-h-0 max-w-0"}`}>
                            <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-white whitespace-nowrap">
                                <span className="hidden sm:inline">Duration</span>
                                <select
                                    value={playbackStartMode}
                                    onChange={(e) => onPlaybackStartModeChange(e.target.value as "thirty-seconds" | "one-third" | "full")}
                                    className="bg-black/60 border border-white/30 text-white rounded-md px-2 py-1 text-xs sm:text-sm"
                                >
                                    <option value="thirty-seconds">30s</option>
                                    <option value="one-third">60s</option>
                                    <option value="full">Full</option>
                                </select>
                            </label>

                            <button
                                onClick={onTogglePlayPause}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 sm:py-3 sm:px-6 rounded-lg transition-colors flex items-center space-x-1 sm:space-x-2 whitespace-nowrap text-xs sm:text-sm"
                            >
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                <span>{isPlaying ? "Pause" : "Play"}</span>
                            </button>

                            <button
                                onClick={onNextVideo}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 sm:py-3 sm:px-6 rounded-lg transition-colors flex items-center space-x-1 sm:space-x-2 whitespace-nowrap text-xs sm:text-sm"
                            >
                                <SkipForward className="h-4 w-4" />
                                <span>Next</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
