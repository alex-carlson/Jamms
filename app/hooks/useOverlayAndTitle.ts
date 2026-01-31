"use client";

import { useState, useEffect, useRef } from "react";

export const useOverlayAndTitle = (currentVideoIndex: number) => {
    const [showOverlay, setShowOverlay] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [currentVideoTitle, setCurrentVideoTitle] = useState("");

    const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
    const titleTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for messages from YouTube iframe to get video titles
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from YouTube
            if (event.origin !== 'https://www.youtube.com' && event.origin !== 'https://www.youtube-nocookie.com') {
                return;
            }

            try {
                // YouTube sends various messages, look for video info
                if (typeof event.data === 'string' && event.data.includes('title')) {
                    const data = JSON.parse(event.data);
                    if (data.title && data.title.length > 0) {
                        setCurrentVideoTitle(data.title);
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
            }
            if (titleTimerRef.current) {
                clearTimeout(titleTimerRef.current);
            }
        };
    }, []);

    const startOverlayTimer = () => {
        // Clear any existing overlay timer
        if (overlayTimerRef.current) {
            clearTimeout(overlayTimerRef.current);
        }

        // Show overlay immediately
        setShowOverlay(true);

        // Hide overlay after 5 seconds
        const timer = setTimeout(() => {
            setShowOverlay(false);
        }, 5000);

        overlayTimerRef.current = timer;
    };

    const startTitleTimer = () => {
        console.log('Starting title timer for video:', currentVideoIndex + 1); // Debug log
        // Clear any existing title timer
        if (titleTimerRef.current) {
            clearTimeout(titleTimerRef.current);
        }

        // Hide title initially
        setShowTitle(false);
        setVideoTitle("");

        // Show title after 15 seconds
        const timer = setTimeout(() => {
            // Use the actual video title if available, otherwise use a simple format
            const title = currentVideoTitle && currentVideoTitle.trim()
                ? currentVideoTitle.replace(' - YouTube', '')
                : `Video ${currentVideoIndex + 1}`;

            setVideoTitle(title);
            setShowTitle(true);
            console.log('Title timer fired:', title); // Debug log
        }, 15000);

        titleTimerRef.current = timer;
    };

    const clearTimers = () => {
        // Clear overlay timer and hide overlay
        if (overlayTimerRef.current) {
            clearTimeout(overlayTimerRef.current);
            overlayTimerRef.current = null;
        }
        setShowOverlay(false);

        // Clear title timer and hide title
        if (titleTimerRef.current) {
            clearTimeout(titleTimerRef.current);
            titleTimerRef.current = null;
        }
        setShowTitle(false);
        setVideoTitle("");
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
        startOverlayTimer,
        startTitleTimer,
        clearTimers,
        resetOverlayAndTitle,
    };
};