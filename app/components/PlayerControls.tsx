"use client";

import { Play, Pause, SkipForward } from "lucide-react";

interface PlayerControlsProps {
    timeRemaining: number;
    powerHourActive: boolean;
    isShuffled: boolean;
    onToggleShuffle: () => void;
    onStartPowerHour: () => void;
    onStopPowerHour: () => void;
    onNextVideo: () => void;
}

export default function PlayerControls({
    timeRemaining,
    powerHourActive,
    isShuffled,
    onToggleShuffle,
    onStartPowerHour,
    onStopPowerHour,
    onNextVideo,
}: PlayerControlsProps) {
    return (
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
                        onClick={onToggleShuffle}
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
                            onClick={onStartPowerHour}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <Play className="h-4 w-4" />
                            <span>Start Power Hour</span>
                        </button>
                    ) : (
                        <button
                            onClick={onStopPowerHour}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
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
    );
}