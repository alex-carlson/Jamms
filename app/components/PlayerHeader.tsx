"use client";

import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";

interface PlayerHeaderProps {
    onResetPlaylist: () => void;
    showTitle: boolean;
    videoName: string;
}

const PlayerHeader = forwardRef<any, PlayerHeaderProps>(function PlayerHeader({
    onResetPlaylist,
    showTitle,
    videoName,
}, ref) {

    // Background opacity: 1 for first 5s, 0 after
    const bgOpacity = showTitle ? 0 : 1;

    return (
        <div
            className="header fixed top-0 left-0 w-full z-10 p-6 text-center"
            style={{ backgroundColor: `rgba(0,0,0,${bgOpacity})`, minHeight: '80px' }}
        >
            <h2
                className="text-4xl"
                style={{
                    opacity: showTitle ? 1 : 0,
                    transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textShadow: '2px 2px 8px rgba(0,0,0,0.7), 0 0 2px #000',
                }}
            >
                {videoName}
            </h2>
        </div>
    );
});

export default PlayerHeader;
