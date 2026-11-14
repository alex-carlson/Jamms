"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import QRCodeModal from "./QRCodeModal";
import { useYouTubeChannelQR } from "../hooks/useYouTubeChannelQR";

interface ChannelQRButtonProps {
  accessToken?: string;
  channelHandle?: string;
  channelId?: string;
  channelName?: string;
  onShowModal?: () => void;
}

/**
 * Button component that triggers the QR code modal for sharing YouTube channel
 * Can be used in PlayerControls, Header, or any other component
 */
export default function ChannelQRButton({
  accessToken,
  channelHandle,
  channelId,
  channelName,
  onShowModal,
}: ChannelQRButtonProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const { fetchChannelInfo, isLoading } = useYouTubeChannelQR();
  const [localChannelHandle, setLocalChannelHandle] = useState(channelHandle);
  const [localChannelId, setLocalChannelId] = useState(channelId);

  const handleClick = async () => {
    if (onShowModal) {
      onShowModal();
      return;
    }

    // If we already have channel info, just show the modal
    if (localChannelHandle || localChannelId) {
      setShowQRModal(true);
      return;
    }

    // Otherwise, fetch channel info from API
    if (accessToken) {
      const info = await fetchChannelInfo(accessToken);
      if (info) {
        setLocalChannelHandle(info.handle);
        setLocalChannelId(info.id);
        setShowQRModal(true);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Share channel via QR code"
      >
        <QrCode size={18} />
        <span className="text-sm font-medium">
          {isLoading ? "Loading..." : "QR Code"}
        </span>
      </button>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        channelHandle={localChannelHandle}
        channelId={localChannelId}
        channelName={channelName}
      />
    </>
  );
}
