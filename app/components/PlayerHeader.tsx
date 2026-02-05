"use client";

import { useEffect, useState } from "react";

interface PlayerHeaderProps {
    onResetPlaylist: () => void;
    showTitle: boolean;
    countdown: number;
    videoName: string;
}

export default function PlayerHeader({
    onResetPlaylist,
    showTitle,
    countdown,
    videoName,
}: PlayerHeaderProps) {
    // Only show the video title after 20 seconds (countdown === 0)
    // Parent should manage countdown and pass it as a prop

    return (
        <div className="header w-full absolute left-0 top-0 bg-black z-10 p-6">
            {countdown === 0 && videoName?.trim() && (
                <h2
                    className="text-2xl transition-opacity duration-500"
                    style={{ opacity: 0.5 }}
                >
                    {videoName}
                </h2>
            )}
        </div>
    );
}
