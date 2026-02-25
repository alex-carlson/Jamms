"use client";

import { User, Youtube } from "lucide-react";

interface LoginComponentProps {
    onSignIn: () => void;
    isLoading: boolean;
    error?: string | null;
    googleLoaded?: boolean;
    onManualInputClick?: () => void;
}

export default function LoginComponent({ onSignIn, isLoading, error, googleLoaded = true, onManualInputClick }: LoginComponentProps) {
    return (
        <div className="max-w-4xl mx-auto text-center bg-white">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-5xl font-bold mb-6 pt-4">
                    JAMMS
                </h1>
                <p className="text-xl text-gray-600">
                    Connect your YouTube account to access your playlists
                </p>
            </div>

            <div className="card p-2">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Youtube className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Sign in with Google
                </h2>
                <p className="text-gray-800 text-sm mb-2">
                    We'll access your YouTube playlists to create your power hour experience
                </p>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Sign In Button */}
                <button
                    onClick={onSignIn}
                    disabled={isLoading || !googleLoaded}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Connecting...</span>
                        </>
                    ) : !googleLoaded ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Loading Google Auth...</span>
                        </>
                    ) : (
                        <>
                            <User className="h-5 w-5" />
                            <span>Sign in with Google</span>
                        </>
                    )}
                </button>

                <div className="mt-6 text-xs text-gray-800">
                    <p className="mb-2">We will only access:</p>
                    <ul className="text-left space-y-1">
                        <li>Your YouTube playlists (read-only)</li>
                        <li>Basic profile information</li>
                    </ul>
                </div>
            </div>

            {/* Manual Input Button */}
            {onManualInputClick && (
                <div className="text-center mt-6">
                    <button
                        onClick={onManualInputClick}
                        className={`text-sm px-4 py-2 rounded-lg transition-colors ${error ? "bg-blue-600 hover:bg-blue-700 text-white font-medium" : "text-gray-800 hover:text-gray-900 underline"}`}
                    >
                        {error ? "→ Use Manual Playlist URL Instead" : "Or enter a playlist URL manually"}
                    </button>
                </div>
            )}
        </div>
    );
}