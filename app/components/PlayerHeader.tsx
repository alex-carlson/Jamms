"use client";

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
    return (
        <div className="header w-full absolute left-0 top-0 bg-black z-10 p-6">
            <h2 className="text-2xl">{showTitle ? videoName : " "}</h2>
        </div>
    );
}
