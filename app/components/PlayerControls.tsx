"use client";

import { Play, Pause, SkipForward } from "lucide-react";

interface PlayerControlsProps {
    timeRemaining: number;
    powerHourActive: boolean;
    videoDuration: number;
    currentVideoIndex: number;
    totalVideos: number;
    onDurationChange: (duration: number) => void;
    onNextVideo: () => void;
    isPlaying: boolean; // state to determine play/pause icon
}

export default function PlayerControls({
    timeRemaining,
    powerHourActive,
    videoDuration,
    currentVideoIndex,
    totalVideos,
    onNextVideo,
    isPlaying,
}: PlayerControlsProps) {
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

                    <div className="flex flex-wrap gap-3">
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
