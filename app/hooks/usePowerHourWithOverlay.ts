"use client";

import { useState, useEffect, useRef } from "react";

export interface PowerHourOverlayOptions {
    onTimerExpired: () => void;
    currentVideoIndex: number;
    initialVideoDuration?: number;
}

export const usePowerHourWithOverlay = ({
    onTimerExpired,
    currentVideoIndex,
    initialVideoDuration = 60,
}: PowerHourOverlayOptions) => {
    // Power hour timer state
    const [powerHourActive, setPowerHourActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(initialVideoDuration);
    const [videoDuration, _setVideoDuration] = useState(initialVideoDuration);
    const durationRef = useRef<number>(initialVideoDuration);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Overlay/Title state
    const [showOverlay, setShowOverlay] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [currentVideoTitle, setCurrentVideoTitle] = useState("");
    const [overlaySecondsRemaining, setOverlaySecondsRemaining] = useState(0);
    const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for YouTube messages to get video title
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!["https://www.youtube.com", "https://www.youtube-nocookie.com"].includes(event.origin)) return;
            try {
                let title = "";
                if (typeof event.data === "string") {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.title && typeof data.title === "string") title = data.title;
                    } catch {
                        const match = event.data.match(/"title":"([^"]+)"/);
                        if (match) title = match[1];
                    }
                } else if (typeof event.data === "object" && event.data && event.data.title) {
                    title = event.data.title;
                }
                if (title) {
                    setCurrentVideoTitle(title.replace(/\s*-\s*YouTube$/, "").trim());
                }
            } catch { }
        };
        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
            clearAllTimers();
        };
    }, []);

    // Reset showTitle immediately when video changes
    useEffect(() => {
        setShowTitle(false);
        startVideoTimer();
    }, [currentVideoIndex]);

    // Unified timer logic
    const startVideoTimer = () => {
        const titleDelay = 40;
        clearAllTimers();
        setPowerHourActive(true);
        setTimeRemaining(durationRef.current);
        setShowOverlay(false);
        setShowTitle(false);
        setOverlaySecondsRemaining(0);
        let seconds = durationRef.current;
        const overlayCountdown = titleDelay;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            seconds--;
            setTimeRemaining(seconds);
            // Overlay countdown logic
            if (seconds <= overlayCountdown && seconds > overlayCountdown - 5) {
                setShowOverlay(true);
                setOverlaySecondsRemaining(seconds - (overlayCountdown - 5));
            }
            else if (seconds <= overlayCountdown - 5 && seconds > 0) {
                setShowTitle(true);
                setShowOverlay(false);
                setOverlaySecondsRemaining(0);
                setVideoTitle(
                    currentVideoTitle?.trim()
                        ? currentVideoTitle.replace(" - YouTube", "")
                        : `Video ${currentVideoIndex + 1}`
                );
            } else {
                setShowOverlay(false);
                setOverlaySecondsRemaining(0);
            }

            // Timer end
            if (seconds <= 0) {
                onTimerExpired();
                clearAllTimers();
            }
        }, 1000);
    };

    const stopPowerHour = () => {
        setPowerHourActive(false);
        clearAllTimers();
    };

    const resetTimer = () => {
        clearAllTimers();
        setPowerHourActive(false);
        setTimeRemaining(durationRef.current);
    };

    const resetTimerToFull = () => {
        if (powerHourActive) {
            setTimeRemaining(durationRef.current);
        }
    };

    const setVideoDuration = (value: number) => {
        const clamped = Math.max(10, Math.min(60, Math.floor(value)));
        _setVideoDuration(clamped);
        durationRef.current = clamped;
        if (powerHourActive) {
            setTimeRemaining(clamped);
        }
    };

    const clearAllTimers = () => {
        if (overlayTimeoutRef.current) {
            clearTimeout(overlayTimeoutRef.current);
            overlayTimeoutRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setShowOverlay(false);
        setShowTitle(false);
        setVideoTitle("");
        setOverlaySecondsRemaining(0);
    };

    const resetOverlayAndTitle = () => {
        clearAllTimers();
        setCurrentVideoTitle("");
    };

    // Provide a startTitleTimer for compatibility
    const startTitleTimer = () => startVideoTimer();

    return {
        // Power hour
        powerHourActive,
        timeRemaining,
        videoDuration,
        setVideoDuration,
        startPowerHour: startVideoTimer,
        stopPowerHour,
        resetTimer,
        resetTimerToFull,
        // Overlay/Title
        showOverlay,
        showTitle,
        videoTitle,
        currentVideoTitle,
        overlaySecondsRemaining,
        startTitleTimer,
        clearTimers: clearAllTimers,
        resetOverlayAndTitle,
    };
};
