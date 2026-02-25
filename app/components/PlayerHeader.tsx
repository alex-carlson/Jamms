"use client";

import { forwardRef } from "react";

interface PlayerHeaderProps {
    onResetPlaylist: () => void;
    showTitle: boolean;
    showHeaderBackground: boolean;
    videoName: string;
    videoAuthor: string;
}

const PlayerHeader = forwardRef<any, PlayerHeaderProps>(function PlayerHeader({
    onResetPlaylist,
    showTitle,
    showHeaderBackground,
    videoName,
    videoAuthor,
}, ref) {
    const bgOpacity = showHeaderBackground ? 1 : 0;

    return (
        <div
            className="header fixed top-0 left-0 w-full z-10 p-6 flex justify-center"
            style={{ backgroundColor: `rgba(0,0,0,${bgOpacity})`, minHeight: '80px' }}
        >
            <div className="max-w-4xl w-full">
                <div
                    className="text-left"
                    style={{
                        opacity: showTitle ? 0 : 0,
                        transform: 'scale(1)',
                        transformOrigin: 'top left',
                        animation: showTitle
                            ? 'player-header-fade-in 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards, player-header-scale-down 2s cubic-bezier(0.4, 0, 0.2, 1) 6.2s forwards'
                            : 'none',
                    }}
                >
                    <h2
                        className="text-4xl text-white transition-opacity duration-500"
                        style={{
                            opacity: 1,
                            textShadow: '2px 2px 8px rgba(0,0,0,0.7), 0 0 2px #000',
                        }}
                    >
                        {videoName}
                    </h2>
                    {videoAuthor && (
                        <p
                            className="mt-1 text-2xl text-gray-300 transition-opacity duration-700"
                            style={{
                                opacity: 1,
                                textShadow: '2px 2px 8px rgba(0,0,0,0.7), 0 0 2px #000',
                            }}
                        >
                            {videoAuthor}
                        </p>
                    )}
                </div>
            </div>
            <style jsx>{`
                @keyframes player-header-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes player-header-scale-down {
                    from { transform: scale(1); }
                    to { transform: scale(0.5); }
                }
            `}</style>
        </div>
    );
});

export default PlayerHeader;
