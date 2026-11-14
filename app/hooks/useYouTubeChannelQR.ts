import { useState, useEffect } from "react";

interface ChannelInfo {
  id: string;
  handle: string;
  name: string;
}

export function useYouTubeChannelQR() {
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the authenticated user's channel information
  const fetchChannelInfo = async (accessToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,id&mine=true",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch channel information");
      }

      const data = await response.json();
      const channel = data.items?.[0];

      if (!channel) {
        throw new Error("No channel found");
      }

      // Extract handle (customUrl) if available, otherwise use channel ID
      const handle =
        channel.snippet?.customUrl?.replace("@", "") || channel.id;

      setChannelInfo({
        id: channel.id,
        handle: handle,
        name: channel.snippet?.title || "Your Channel",
      });

      return {
        id: channel.id,
        handle: handle,
        name: channel.snippet?.title || "Your Channel",
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch channel info";
      setError(errorMessage);
      console.error("Error fetching channel info:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate QR code URL for direct channel access
  const getQRCodeUrl = (channelHandle?: string, channelId?: string): string => {
    if (channelHandle) {
      return `https://youtube.com/@${channelHandle}`;
    }
    if (channelId) {
      return `https://youtube.com/channel/${channelId}`;
    }
    return "https://youtube.com";
  };

  return {
    channelInfo,
    isLoading,
    error,
    fetchChannelInfo,
    getQRCodeUrl,
  };
}
