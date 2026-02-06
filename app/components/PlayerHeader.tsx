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
    const [showTitleAfterDelay, setShowTitleAfterDelay] = useState(false);
    const [showBar, setShowBar] = useState(true);
    const titleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const barTimerRef = useRef<NodeJS.Timeout | null>(null);

    useImperativeHandle(ref, () => ({
        clearTimer: () => {
            if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
            if (barTimerRef.current) clearTimeout(barTimerRef.current);
            setShowTitleAfterDelay(false);
            setShowBar(true);
        }
    }));

    useEffect(() => {
        setShowTitleAfterDelay(false);
        setShowBar(true);
        if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
        if (barTimerRef.current) clearTimeout(barTimerRef.current);
        if (videoName && videoName.trim()) {
            titleTimerRef.current = setTimeout(() => {
                setShowTitleAfterDelay(true);
                setShowBar(true); // Reveal bar when title is shown
            }, 20000);
            barTimerRef.current = setTimeout(() => {
                setShowBar(false); // Hide bar after 5s
            }, 5000);
        }
        return () => {
            if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
            if (barTimerRef.current) clearTimeout(barTimerRef.current);
        };
    }, [videoName]);

    if (!showBar && !showTitleAfterDelay) return null;

    // Background opacity: 1 for first 5s, 0.5 after title is shown (after 20s)
    const bgOpacity = showTitleAfterDelay ? 0 : 1;

    return (
        <div
            className="header fixed top-0 left-0 w-full z-10 p-6 text-center"
            style={{ backgroundColor: `rgba(0,0,0,${bgOpacity})`, minHeight: '80px' }}
        >
            <h2
                className="text-4xl"
                style={{
                    opacity: showTitleAfterDelay && videoName?.trim() ? 1 : 0,
                    transition: 'opacity 5s cubic-bezier(0.4, 0, 0.2, 1)',
                    textShadow: '2px 2px 8px rgba(0,0,0,0.7), 0 0 2px #000',
                }}
            >
                {showTitleAfterDelay && videoName?.trim() ? videoName : " "}
            </h2>
        </div>
    );
});

export default PlayerHeader;
