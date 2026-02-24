"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, SkipForward } from "lucide-react";

interface PlayerControlsProps {
    timeRemaining: number;
    powerHourActive: boolean;
    videoDuration: number;
    playbackStartMode: "one-third" | "full";
    currentVideoIndex: number;
    totalVideos: number;
    onDurationChange: (duration: number) => void;
    onPlaybackStartModeChange: (mode: "one-third" | "full") => void;
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

    return (
        <div className="fixed bottom-0 left-0 w-full px-6 py-4 text-white">
            <div className="max-w-lg mx-auto flex flex-col gap-4">


                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <div
                            className="text-4xl font-bold text-white dark:text-white mb-2"
                            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7), 0 0 2px #000' }}
                        >
                            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                        </div>
                    </div>

                    <div className="text-center">
                        <div
                            className="text-2xl font-semibold text-white dark:text-gray-300 mb-1"
                            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7), 0 0 2px #000' }}
                        >
                            {currentVideoIndex}/{totalVideos}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setControlsOpen((prev) => !prev)}
                            className="bg-black/60 border border-white/30 text-white rounded-md p-2"
                            aria-label={controlsOpen ? "Collapse controls" : "Expand controls"}
                        >
                            {controlsOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </button>

                        <div
                            className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${controlsOpen ? "max-w-md opacity-100" : "max-w-0 opacity-0"}`}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-white whitespace-nowrap">
                                <span>Start at</span>
                                <select
                                    value={playbackStartMode}
                                    onChange={(e) => onPlaybackStartModeChange(e.target.value as "one-third" | "full")}
                                    className="bg-black/60 border border-white/30 text-white rounded-md px-2 py-1"
                                >
                                    <option value="one-third">1/3 mark</option>
                                    <option value="full">Video start</option>
                                </select>
                            </label>

                            <button
                                onClick={onTogglePlayPause}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 whitespace-nowrap"
                            >
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                <span>{isPlaying ? "Pause" : "Play"}</span>
                            </button>

                            <button
                                onClick={onNextVideo}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 whitespace-nowrap"
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
