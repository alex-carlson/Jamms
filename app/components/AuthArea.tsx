import LoginComponent from "./LoginComponent";
import OAuthSetupGuide from "./OAuthSetupGuide";
import PlaylistForm from "./PlaylistForm";
import React from "react";

interface AuthAreaProps {
  authLoading: boolean;
  showManualInput: boolean;
  isAuthenticated: boolean;
  isManualProcessing: boolean;
  signIn: () => void;
  authError: string | null;
  googleLoaded: boolean;
  setShowManualInput: (show: boolean) => void;
  handlePlaylistSubmit: (url: string, shouldShare: boolean) => void;
  isLoading: boolean;
  shareWithCommunity: boolean;
  onShareWithCommunityChange: (share: boolean) => void;
}

export default function AuthArea({
  authLoading,
  showManualInput,
  isAuthenticated,
  isManualProcessing,
  signIn,
  authError,
  googleLoaded,
  setShowManualInput,
  handlePlaylistSubmit,
  isLoading,
  shareWithCommunity,
  onShareWithCommunityChange,
}: AuthAreaProps) {
  return (
    <>
      {/* Sign-in / Manual Input */}
      {!authLoading && !showManualInput && !isAuthenticated && !isManualProcessing && (
        <div className="content bg-white max-w-4xl mx-auto">
          <LoginComponent onSignIn={signIn} isLoading={authLoading} error={authError} googleLoaded={googleLoaded} onManualInputClick={() => setShowManualInput(true)} />
          {authError?.includes("authorized origins") && <OAuthSetupGuide />}
        </div>
      )}
      {(!authLoading && showManualInput && !isLoading) && (
        <div className="content bg-white max-w-4xl mx-auto">
          <PlaylistForm
            onSubmit={handlePlaylistSubmit}
            isLoading={isLoading}
            onBackToSignIn={() => setShowManualInput(false)}
            shareWithCommunity={shareWithCommunity}
            onShareWithCommunityChange={onShareWithCommunityChange}
          />
        </div>
      )}
    </>
  );
}
