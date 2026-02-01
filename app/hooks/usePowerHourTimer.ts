"use client";

import { useState, useEffect, useRef } from "react";

export const usePowerHourTimer = (onTimerExpired: () => void) => {
    const [powerHourActive, setPowerHourActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(60);
    const [videoDuration, setVideoDuration] = useState(60); // User-configurable duration
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timer on component unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const startPowerHour = () => {
        setPowerHourActive(true);
        setTimeRemaining(videoDuration);

        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Start the timer that continues running
        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    // Move to next video and reset timer
                    onTimerExpired();
                    return videoDuration; // Reset timer with current duration
                }
                return prev - 1;
            });
        }, 1000);

        timerRef.current = timer;
    };

    const stopPowerHour = () => {
        setPowerHourActive(false);
        setTimeRemaining(videoDuration);

        // Clear the timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const resetTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setPowerHourActive(false);
        setTimeRemaining(videoDuration);
    };

    const resetTimerToFull = () => {
        if (powerHourActive) {
            setTimeRemaining(videoDuration);
        }
    };

    return {
        powerHourActive,
        timeRemaining,
        videoDuration,
        setVideoDuration,
        startPowerHour,
        stopPowerHour,
        resetTimer,
        resetTimerToFull,
    };
};