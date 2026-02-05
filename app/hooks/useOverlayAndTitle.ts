"use client";

import { useState, useEffect, useRef } from "react";

export const useOverlayAndTitle = (currentVideoIndex: number, videoDuration: number) => {
    const [showOverlay, setShowOverlay] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [currentVideoTitle, setCurrentVideoTitle] = useState("");
    const [titleCountdown, setTitleCountdown] = useState(0);

    const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for YouTube messages to get video title
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!["https://www.youtube.com", "https://www.youtube-nocookie.com"].includes(event.origin)) return;

            try {
                if (typeof event.data === "string" && event.data.includes("title")) {
                    const data = JSON.parse(event.data);
                    if (data.title) setCurrentVideoTitle(data.title);
                }
            } catch { }
        };

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
            clearAllTimers();
        };
    }, []);

    const startOverlayTimer = () => {
        if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
        setShowOverlay(true);
        overlayTimerRef.current = setTimeout(() => setShowOverlay(false), 5000);
    };

    const startTitleTimer = () => {
        clearCountdown();

        if (!videoDuration || videoDuration <= 0) return;

        const countdownSeconds = Math.ceil(videoDuration / 3);
        setTitleCountdown(countdownSeconds);

        countdownIntervalRef.current = setInterval(() => {
            setTitleCountdown(prev => {
                if (prev <= 1) {
                    clearCountdown();
                    setShowTitle(true);
                    setVideoTitle(
                        currentVideoTitle?.trim()
                            ? currentVideoTitle.replace(" - YouTube", "")
                            : `Video ${currentVideoIndex + 1}`
                    );
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };


    const clearCountdown = () => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    };

    const clearAllTimers = () => {
        if (overlayTimerRef.current) {
            clearTimeout(overlayTimerRef.current);
            overlayTimerRef.current = null;
        }
        clearCountdown();
        setShowOverlay(false);
        setShowTitle(false);
        setVideoTitle("");
        setTitleCountdown(0);
    };

    const resetOverlayAndTitle = () => {
        clearAllTimers();
        setCurrentVideoTitle("");
    };

    return {
        showOverlay,
        showTitle,
        videoTitle,
        currentVideoTitle,
        titleCountdown,
        startOverlayTimer,
        startTitleTimer,
        clearTimers: clearAllTimers,
        resetOverlayAndTitle,
    };
};
