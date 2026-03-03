interface CountdownOverlayProps {
    showOverlay: boolean;
    overlaySecondsRemaining: number;
}

export default function CountdownOverlay({ showOverlay, overlaySecondsRemaining }: CountdownOverlayProps) {
    if (!showOverlay) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div
                key={overlaySecondsRemaining}
                className="text-white text-9xl font-bold animate-countdown"
                style={{
                    animation: 'countdownSlam 1s ease-out forwards'
                }}
            >
                {overlaySecondsRemaining}
            </div>
            <style jsx>{`
                @keyframes countdownSlam {
                    0% {
                        transform: translateY(-100px);
                        opacity: 0;
                    }
                    30% {
                        transform: translateY(0px);
                        opacity: 1;
                    }
                    70% {
                        transform: translateY(0px);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(50px);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}