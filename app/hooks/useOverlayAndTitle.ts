"use client";

import { useState, useEffect, useRef } from "react";

export const useOverlayAndTitle = (currentVideoIndex: number, videoDuration: number) => {
    const [showOverlay, setShowOverlay] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [currentVideoTitle, setCurrentVideoTitle] = useState("");
    const [titleCountdown, setTitleCountdown] = useState(0); // New: countdown in seconds

    const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
    const titleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for messages from YouTube iframe to get video titles
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://www.youtube.com' && event.origin !== 'https://www.youtube-nocookie.com') return;

            try {
                if (typeof event.data === 'string' && event.data.includes('title')) {
                    const data = JSON.parse(event.data);
                    if (data.title && data.title.length > 0) {
                        setCurrentVideoTitle(data.title);
                    }
                }
            } catch (e) { }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
            clearTimers();
        };
    }, []);

    const startOverlayTimer = () => {
        if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);

        setShowOverlay(true);

        overlayTimerRef.current = setTimeout(() => {
            setShowOverlay(false);
        }, 5000);
    };

    const startTitleTimer = () => {
        if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        setShowTitle(false);
        setVideoTitle("");
        setTitleCountdown(0);

        // Wait until videoDuration is available
        if (!videoDuration || videoDuration <= 0) {
            const checkDuration = setInterval(() => {
                if (videoDuration && videoDuration > 0) {
                    clearInterval(checkDuration);
                    startCountdown(videoDuration);
                }
            }, 100);
        } else {
            startCountdown(videoDuration);
        }
    };

    const startCountdown = (duration: number) => {
        const countdownSeconds = Math.ceil(duration / 3);
        setTitleCountdown(countdownSeconds);

        countdownIntervalRef.current = setInterval(() => {
            setTitleCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current!);
                    setShowTitle(true);

                    const title = currentVideoTitle && currentVideoTitle.trim()
                        ? currentVideoTitle.replace(' - YouTube', '')
                        : `Video ${currentVideoIndex + 1}`;
                    setVideoTitle(title);

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const clearTimers = () => {
        if (overlayTimerRef.current) {
            clearTimeout(overlayTimerRef.current);
            overlayTimerRef.current = null;
        }
        if (titleTimerRef.current) {
            clearTimeout(titleTimerRef.current);
            titleTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        setShowOverlay(false);
        setShowTitle(false);
        setVideoTitle("");
        setTitleCountdown(0);
    };

    const resetOverlayAndTitle = () => {
        clearTimers();
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
        clearTimers,
        resetOverlayAndTitle,
    };
};
