"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
    const remainingRef = useRef<number>(initialVideoDuration);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const onTimerExpiredRef = useRef(onTimerExpired);
    const currentVideoIndexRef = useRef(currentVideoIndex);

    // Overlay/Title state
    const [showOverlay, setShowOverlay] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [showHeaderBackground, setShowHeaderBackground] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [currentVideoTitle, setCurrentVideoTitle] = useState("");
    const currentVideoTitleRef = useRef("");
    const [overlaySecondsRemaining, setOverlaySecondsRemaining] = useState(0);
    const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearAllTimers = useCallback(() => {
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
        setShowHeaderBackground(false);
        setVideoTitle("");
        setOverlaySecondsRemaining(0);
    }, []);

    useEffect(() => {
        onTimerExpiredRef.current = onTimerExpired;
    }, [onTimerExpired]);

    useEffect(() => {
        currentVideoIndexRef.current = currentVideoIndex;
    }, [currentVideoIndex]);

    useEffect(() => {
        currentVideoTitleRef.current = currentVideoTitle;
    }, [currentVideoTitle]);

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
    }, [clearAllTimers]);

    // Reset showTitle immediately when video changes
    // Unified timer logic
    const runTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setPowerHourActive(true);
        const titleRevealAfterSeconds = durationRef.current === 30 ? 15 : 30;
        const overlayLeadInSeconds = 5;

        timerRef.current = setInterval(() => {
            remainingRef.current -= 1;
            const seconds = remainingRef.current;
            const elapsedSeconds = Math.max(0, durationRef.current - seconds);
            setTimeRemaining(seconds);
            setShowHeaderBackground(elapsedSeconds < 5 && seconds > 0);

            // Overlay countdown logic
            if (
                elapsedSeconds >= titleRevealAfterSeconds - overlayLeadInSeconds
                && elapsedSeconds < titleRevealAfterSeconds
            ) {
                setShowOverlay(true);
                setOverlaySecondsRemaining(titleRevealAfterSeconds - elapsedSeconds);
            }
            else if (elapsedSeconds >= titleRevealAfterSeconds && seconds > 0) {
                setShowTitle(true);
                setShowOverlay(false);
                setOverlaySecondsRemaining(0);
                setVideoTitle(
                    currentVideoTitleRef.current?.trim()
                        ? currentVideoTitleRef.current.replace(" - YouTube", "")
                        : `Video ${currentVideoIndexRef.current + 1}`
                );
            } else {
                setShowOverlay(false);
                setOverlaySecondsRemaining(0);
            }

            // Timer end
            if (seconds <= 0) {
                onTimerExpiredRef.current();
                clearAllTimers();
                setPowerHourActive(false);
            }
        }, 1000);
    }, [clearAllTimers]);

    const startVideoTimer = useCallback(() => {
        clearAllTimers();
        remainingRef.current = durationRef.current;
        setTimeRemaining(remainingRef.current);
        setShowOverlay(false);
        setShowTitle(false);
        setShowHeaderBackground(true);
        setOverlaySecondsRemaining(0);
        runTimer();
    }, [clearAllTimers, runTimer]);

    const stopPowerHour = () => {
        setPowerHourActive(false);
        clearAllTimers();
    };

    const pausePowerHour = useCallback(() => {
        setPowerHourActive(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const resumePowerHour = useCallback(() => {
        if (remainingRef.current <= 0) {
            remainingRef.current = durationRef.current;
            setTimeRemaining(remainingRef.current);
        }
        runTimer();
    }, [runTimer]);

    const resetTimer = () => {
        clearAllTimers();
        setPowerHourActive(false);
        remainingRef.current = durationRef.current;
        setTimeRemaining(remainingRef.current);
    };

    const resetTimerToFull = () => {
        if (powerHourActive) {
            remainingRef.current = durationRef.current;
            setTimeRemaining(remainingRef.current);
        }
    };

    const setVideoDuration = useCallback((value: number, syncTimeRemaining = false) => {
        const clamped = Math.max(1, Math.floor(value));
        _setVideoDuration(clamped);
        durationRef.current = clamped;
        if (syncTimeRemaining) {
            remainingRef.current = clamped;
            setTimeRemaining(remainingRef.current);
        }
    }, []);

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
        pausePowerHour,
        resumePowerHour,
        stopPowerHour,
        resetTimer,
        resetTimerToFull,
        // Overlay/Title
        showOverlay,
        showTitle,
        showHeaderBackground,
        videoTitle,
        currentVideoTitle,
        overlaySecondsRemaining,
        startTitleTimer,
        clearTimers: clearAllTimers,
        resetOverlayAndTitle,
    };
};
