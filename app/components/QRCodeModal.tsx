"use client";

import { useState } from "react";
import { X } from "lucide-react";
import YouTubeChannelQR from "./YouTubeChannelQR";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelHandle?: string;
  channelId?: string;
  channelName?: string;
  showPlaylists?: boolean;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  channelHandle,
  channelId,
  channelName,
  showPlaylists = false,
}: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <YouTubeChannelQR
          channelHandle={channelHandle}
          channelId={channelId}
          onClose={onClose}
          showPlaylists={showPlaylists}
        />
      </div>
    </div>
  );
}
