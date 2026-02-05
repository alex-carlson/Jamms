"use client";

import { Play, Pause, SkipForward } from "lucide-react";

interface PlayerControlsProps {
    timeRemaining: number;
    powerHourActive: boolean;
    videoDuration: number;
    currentVideoIndex: number;
    totalVideos: number;
    onDurationChange: (duration: number) => void;
    onStartPowerHour: () => void;
    onStopPowerHour: () => void;
    onNextVideo: () => void;
}

export default function PlayerControls({
    timeRemaining,
    powerHourActive,
    videoDuration,
    currentVideoIndex,
    totalVideos,
    onDurationChange,
    onStartPowerHour,
    onStopPowerHour,
    onNextVideo
}: PlayerControlsProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex flex-col gap-4">
                {/* Duration Setting - Only show when not active */}
                {!powerHourActive && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-center sm:text-left">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                Video Duration
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                How long to play each video
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-300">10s</span>
                            <input
                                type="range"
                                min="10"
                                max="60"
                                value={videoDuration}
                                onChange={(e) => onDurationChange(parseInt(e.target.value))}
                                className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-300">60s</span>
                            <div className="ml-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white min-w-[3rem] text-center">
                                {videoDuration}s
                            </div>
                        </div>
                    </div>
                )}

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

                    {/* Video Counter */}
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {currentVideoIndex + 1}/{totalVideos}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Video progress
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {!powerHourActive ? (
                            <button
                                onClick={onStartPowerHour}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
                            >
                                <Play className="h-4 w-4" />
                                <span>Play</span>
                            </button>
                        ) : (
                            <button
                                onClick={onStopPowerHour}
                                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
                            >
                                <Pause className="h-4 w-4" />
                                <span>Pause</span>
                            </button>
                        )}

                        <button
                            onClick={onNextVideo}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <SkipForward className="h-4 w-4" />
                            <span>Next</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}