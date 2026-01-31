"use client";

import { useState, useEffect } from "react";

interface GoogleUser {
    id: string;
    name: string;
    email: string;
    picture: string;
}

interface UseGoogleAuthReturn {
    user: GoogleUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: () => void;
    signOut: () => void;
    getAccessToken: () => string | null;
    error: string | null;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
    const [user, setUser] = useState<GoogleUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeGoogleAuth = () => {
            if (typeof window === "undefined") return;

            // Check if we have a valid client ID
            if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
                setError("Google Client ID not configured");
                setIsLoading(false);
                return;
            }

            // Load Google Identity Services for token-only auth (more reliable)
            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => {
                setIsLoading(false);
            };
            script.onerror = () => {
                console.error("Failed to load Google Identity Services script");
                setError("Failed to load Google authentication");
                setIsLoading(false);
            };
            document.head.appendChild(script);
        };

        initializeGoogleAuth();
    }, []);

    const signIn = () => {
        if (typeof window === "undefined" || !window.google) {
            setError("Google authentication not loaded");
            return;
        }

        setError(null);

        // Use the token client directly (bypasses One Tap origin restrictions)
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            scope: 'profile email https://www.googleapis.com/auth/youtube.readonly',
            callback: async (response: any) => {
                if (response.access_token) {
                    setAccessToken(response.access_token);

                    // Get user info from Google API
                    try {
                        const userResponse = await fetch(
                            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`
                        );
                        const userInfo = await userResponse.json();

                        setUser({
                            id: userInfo.id,
                            name: userInfo.name,
                            email: userInfo.email,
                            picture: userInfo.picture,
                        });

                        setIsAuthenticated(true);
                        setError(null);
                    } catch (error) {
                        console.error("Error fetching user info:", error);
                        setError("Failed to get user information");
                    }
                } else if (response.error) {
                    if (response.error === 'popup_closed') {
                        setError("Sign-in was cancelled. Please try again.");
                    } else {
                        setError("Sign-in failed. Please try again.");
                    }
                }
            },
        });

        // Request access token (opens popup)
        tokenClient.requestAccessToken();
    };

    const signOut = () => {
        if (window.google && accessToken) {
            // Revoke the token
            window.google.accounts.oauth2.revoke(accessToken, () => {
                console.log('Token revoked');
            });
        }

        setUser(null);
        setAccessToken(null);
        setIsAuthenticated(false);
        setError(null);
    };

    const getAccessToken = () => {
        return accessToken;
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
        getAccessToken,
        error,
    };
};

// Add global types for Google Identity Services
declare global {
    interface Window {
        google: any;
    }
}