"use client";

import { useState, useEffect, useRef } from "react";

export const usePowerHourTimer = (onTimerExpired: () => void) => {
    const [powerHourActive, setPowerHourActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(60);
    const [videoDuration, _setVideoDuration] = useState(60); // User-configurable duration
    const durationRef = useRef<number>(videoDuration);
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
        setTimeRemaining(durationRef.current);

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
                    return durationRef.current; // Reset timer with current duration
                }
                return prev - 1;
            });
        }, 1000);

        timerRef.current = timer;
    };

    const stopPowerHour = () => {
        setPowerHourActive(false);
        // Do NOT reset timeRemaining; just pause in place
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
        setTimeRemaining(durationRef.current);
    };

    const resetTimerToFull = () => {
        if (powerHourActive) {
            setTimeRemaining(durationRef.current);
        }
    };

    // Public setter that clamps duration between 10 and 60 seconds
    const setVideoDuration = (value: number) => {
        const clamped = Math.max(10, Math.min(60, Math.floor(value)));
        _setVideoDuration(clamped);
        durationRef.current = clamped;
        // If timer is active, update remaining time to the new duration
        if (powerHourActive) {
            setTimeRemaining(clamped);
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