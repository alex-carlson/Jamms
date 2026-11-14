"use client";

import { X } from "lucide-react";
import UserPlaylistsLoader from "./UserPlaylistsLoader";

interface PlaylistSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelHandle?: string;
  channelId?: string;
  apiKey?: string;
  onPlaylistSelect: (playlistId: string, playlistTitle: string) => void;
}

export default function PlaylistSelectorModal({
  isOpen,
  onClose,
  channelHandle,
  channelId,
  apiKey,
  onPlaylistSelect,
}: PlaylistSelectorModalProps) {
  if (!isOpen) return null;

  const handlePlaylistSelect = (playlistId: string, playlistTitle: string) => {
    onPlaylistSelect(playlistId, playlistTitle);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-red-600">Select a Playlist</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <UserPlaylistsLoader
          channelHandle={channelHandle}
          channelId={channelId}
          apiKey={apiKey}
          onPlaylistSelect={handlePlaylistSelect}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
