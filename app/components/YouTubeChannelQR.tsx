"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, X } from "lucide-react";

interface YouTubeChannelQRProps {
  channelHandle?: string;
  channelId?: string;
  onClose?: () => void;
  showPlaylists?: boolean;
}

export default function YouTubeChannelQR({
  channelHandle,
  channelId,
  onClose,
  showPlaylists = false,
}: YouTubeChannelQRProps) {
  const [copied, setCopied] = useState(false);

  // Get the origin (site URL)
  const getOrigin = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://jamms.com';
  };

  // Create the QR code URL - points back to the site to load user's playlists
  // The site will use these params to fetch and display the user's playlists
  const qrCodeUrl = showPlaylists
    ? channelHandle
      ? `${getOrigin()}?channel=@${channelHandle}&loadPlaylists=true`
      : channelId
      ? `${getOrigin()}?channel=${channelId}&loadPlaylists=true`
      : getOrigin()
    : channelHandle
    ? `https://youtube.com/@${channelHandle}`
    : channelId
    ? `https://youtube.com/channel/${channelId}`
    : "https://youtube.com";

  const downloadQR = () => {
    const qrElement = document.querySelector("canvas");
    if (qrElement) {
      const link = document.createElement("a");
      link.href = qrElement.toDataURL("image/png");
      link.download = `youtube-channel-qr.png`;
      link.click();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCodeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-red-50 to-white rounded-lg border border-red-100">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex-1" />
        <h2 className="text-2xl font-bold text-red-600">Scan to View Channel</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-2 hover:bg-red-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-red-600" />
          </button>
        )}
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <QRCodeSVG
          value={qrCodeUrl}
          size={256}
          level="H"
          includeMargin={true}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>

      {/* Channel Info */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          {showPlaylists
            ? "Scan to load your channel playlists on Jamms"
            : "Scan this QR code with your phone to open the YouTube channel"}
        </p>
        <p className="text-xs text-gray-500 break-all">{qrCodeUrl}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Copy size={18} />
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <button
          onClick={downloadQR}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <Download size={18} />
          Download QR
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
        <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          {showPlaylists ? (
            <>
              <li>Share this QR code with others</li>
              <li>When scanned on mobile or desktop, it opens Jamms</li>
              <li>Your playlists will automatically load</li>
              <li>Users can start playing immediately</li>
            </>
          ) : (
            <>
              <li>Show this QR code to your phone or another device</li>
              <li>Scan using the camera app or QR code scanner</li>
              <li>The YouTube app will open with your channel</li>
              <li>All your playlists will be available</li>
            </>
          )}
        </ol>
      </div>
    </div>
  );
}
