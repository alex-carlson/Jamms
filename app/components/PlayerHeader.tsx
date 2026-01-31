"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

interface PlayerHeaderProps {
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    onResetPlaylist: () => void;
}

export default function PlayerHeader({
    isFullscreen,
    onToggleFullscreen,
    onResetPlaylist,
}: PlayerHeaderProps) {
    return (
        <div className={`flex justify-between items-center mb-6 ${isFullscreen ? 'px-4' : ''}`}>
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Power Hour Player
                </h1>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onToggleFullscreen}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    {isFullscreen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                </button>
                <button
                    onClick={onResetPlaylist}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    ← Back to Setup
                </button>
            </div>
        </div>
    );
}