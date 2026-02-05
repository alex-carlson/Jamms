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
    // 0 = empty, 1 = hidden, 2 = half opacity with videoName
    const [displayStage, setDisplayStage] = useState<0 | 1 | 2>(0);

    useEffect(() => {
        // After 5 seconds, hide the h2
        const hideTimeout = setTimeout(() => {
            setDisplayStage(1);
        }, 5000);

        // After 20 seconds, show videoName at half opacity
        const showTimeout = setTimeout(() => {
            setDisplayStage(2);
        }, 20000);

        return () => {
            clearTimeout(hideTimeout);
            clearTimeout(showTimeout);
        };
    }, []);

    return (
        <div className="header w-full absolute left-0 top-0 bg-black z-10 p-6">
            {displayStage !== 1 && (
                <h2
                    className="text-2xl transition-opacity duration-500"
                    style={{
                        opacity: displayStage === 2 ? 0.5 : 1,
                    }}
                >
                    {displayStage === 2 ? videoName : " "}
                </h2>
            )}
        </div>
    );
}
