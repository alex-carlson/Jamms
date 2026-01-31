"use client";

import { User, Youtube } from "lucide-react";

interface LoginComponentProps {
    onSignIn: () => void;
    isLoading: boolean;
    error?: string | null;
    googleLoaded?: boolean;
}

export default function LoginComponent({ onSignIn, isLoading, error, googleLoaded = true }: LoginComponentProps) {
    return (
        <div className="max-w-md mx-auto text-center">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                    ACarCrash Power Hours
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                    Connect your YouTube account to access your playlists
                </p>
            </div>

            {/* Login Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Youtube className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Sign in with Google
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                        We'll access your YouTube playlists to create your power hour experience
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
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

                <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                    <p className="mb-2">We will only access:</p>
                    <ul className="text-left space-y-1">
                        <li>• Your YouTube playlists (read-only)</li>
                        <li>• Basic profile information</li>
                    </ul>
                </div>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-1 gap-4 text-left">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        🎵 Use Your Playlists
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Access all your YouTube playlists directly
                    </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        ⏰ Automatic Timer
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        60-second intervals with seamless transitions
                    </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        🔀 Shuffle Support
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Randomize your playlist for variety
                    </p>
                </div>
            </div>
        </div>
    );
}