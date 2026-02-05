"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

interface PlayerHeaderProps {
    onResetPlaylist: () => void;
}

export default function PlayerHeader({
    onResetPlaylist,
}: PlayerHeaderProps) {
    return (
        <div className={`flex justify-between items-center mb-6`}>
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Power Hour Player
                </h1>
            </div>
            <div className="flex gap-3">
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