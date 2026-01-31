"use client";

import { useState, useEffect } from "react";
import { saveAuthData, getAuthData, clearAuthData, isTokenExpiringSoon } from "../utils/cookies";

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
    googleLoaded: boolean;
    isTokenExpiringSoon: () => boolean;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
    const [user, setUser] = useState<GoogleUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [googleLoaded, setGoogleLoaded] = useState(false);

    // Effect to restore authentication from cookies on page load
    useEffect(() => {
        const restoreAuthFromCookies = () => {
            const authData = getAuthData();
            if (authData) {
                setUser(authData.userInfo);
                setAccessToken(authData.accessToken);
                setIsAuthenticated(true);
                console.log('Restored authentication from cookies');
                
                // Check if token is expiring soon and might need refresh
                if (isTokenExpiringSoon(10)) {
                    console.log('Access token expires soon, user may need to re-authenticate');
                }
            }
        };

        restoreAuthFromCookies();
    }, []);

    useEffect(() => {
        const initializeGoogleAuth = () => {
            if (typeof window === "undefined") return;

            // Check if we have a valid client ID
            if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
                setError("Google Client ID not configured. Please check your environment variables.");
                setIsLoading(false);
                return;
            }

            // Check if Google is already loaded
            if (window.google) {
                setGoogleLoaded(true);
                setIsLoading(false);
                return;
            }

            // Load Google Identity Services for token-only auth (more reliable)
            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => {
                // Wait a bit for the script to fully initialize
                setTimeout(() => {
                    if (window.google) {
                        setGoogleLoaded(true);
                        setIsLoading(false);
                    } else {
                        // Retry after a longer delay
                        setTimeout(() => {
                            if (window.google) {
                                setGoogleLoaded(true);
                                setIsLoading(false);
                            } else {
                                setError("Google authentication failed to initialize properly");
                                setIsLoading(false);
                            }
                        }, 2000);
                    }
                }, 500);
            };
            script.onerror = () => {
                console.error("Failed to load Google Identity Services script");
                setError("Failed to load Google authentication services");
                setIsLoading(false);
            };
            document.head.appendChild(script);
        };

        initializeGoogleAuth();
    }, []);

    const signIn = () => {
        if (typeof window === "undefined") {
            setError("Cannot sign in on server side");
            return;
        }

        if (!googleLoaded || !window.google) {
            setError("Google authentication is still loading. Please wait a moment and try again.");
            return;
        }

        if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
            setError("Google Client ID not configured");
            return;
        }

        setError(null);

        try {
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

                            const userData = {
                                id: userInfo.id,
                                name: userInfo.name,
                                email: userInfo.email,
                                picture: userInfo.picture,
                            };

                            setUser(userData);
                            setIsAuthenticated(true);
                            setError(null);

                            // Save to cookies for persistence
                            const expiresIn = response.expires_in || 3600; // Default 1 hour
                            saveAuthData(response.access_token, userData, expiresIn);
                            console.log('Authentication data saved to cookies');
                        } catch (error) {
                            console.error("Error fetching user info:", error);
                            setError("Failed to get user information");
                        }
                    } else if (response.error) {
                        if (response.error === 'popup_closed') {
                            setError("Sign-in was cancelled. Please try again.");
                        } else {
                            setError(`Sign-in failed: ${response.error}. Please try again.`);
                        }
                    }
                },
        });

        // Request access token (opens popup)
        tokenClient.requestAccessToken();
        } catch (error) {
            console.error("Error during sign in:", error);
            setError("Sign-in failed. Please refresh the page and try again.");
        }
    };

    const signOut = () => {
        if (typeof window !== "undefined" && window.google && accessToken) {
            try {
                // Revoke the token
                window.google.accounts.oauth2.revoke(accessToken, () => {
                    console.log('Token revoked');
                });
            } catch (error) {
                console.error('Error revoking token:', error);
            }
        }

        // Clear cookies
        clearAuthData();
        console.log('Authentication data cleared from cookies');

        setUser(null);
        setAccessToken(null);
        setIsAuthenticated(false);
        setError(null);
    };

    const getAccessToken = () => {
        // Check if token is expiring soon
        if (accessToken && isTokenExpiringSoon(5)) {
            console.log('Access token is expiring soon. User should re-authenticate.');
            setError('Your session is expiring soon. Please sign in again.');
        }
        return accessToken;
    };

    const checkTokenExpiration = () => {
        return isTokenExpiringSoon(5);
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
        getAccessToken,
        error,
        googleLoaded, // Export this so components can check if Google is ready
        isTokenExpiringSoon: checkTokenExpiration,
    };
};

// Add global types for Google Identity Services
declare global {
    interface Window {
        google: any;
    }
}