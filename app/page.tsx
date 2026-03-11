import { Suspense } from "react";
import { Metadata } from "next";
import Home from "./Home";
import { getPlaylistMetadata, sanitizePlaylistParam } from "./utils/youtube-metadata";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const playlistParam = typeof params.playlist === 'string' ? params.playlist : null;
  const playlistId = sanitizePlaylistParam(playlistParam);

  // Default metadata
  const defaultMetadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    title: "Jamms Power Hours",
    description: "Evvrybody in the cluub gettin PIPSY",
    openGraph: {
      title: "Jamms Power Hours",
      description: "Evvrybody in the cluub gettin PIPSY",
      type: "website",
      images: [
        {
          url: '/background.png',
          width: 1200,
          height: 630,
          alt: 'Jamms Power Hours',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: "Jamms Power Hours",
      description: "Evvrybody in the cluub gettin PIPSY",
      images: ['/background.png'],
    },
  };

  // If no playlist parameter, return default metadata
  if (!playlistId) {
    return defaultMetadata;
  }

  // Fetch playlist metadata
  const playlistData = await getPlaylistMetadata(playlistId);

  // If playlist data fetch failed, return default metadata
  if (!playlistData) {
    return defaultMetadata;
  }

  // Generate dynamic metadata based on playlist
  const dynamicTitle = `${playlistData.title} - Power Hour`;
  const dynamicDescription = `Join a Power Hour with "${playlistData.title}" by ${playlistData.channelTitle}. ${playlistData.videoCount} songs ready to party! ${playlistData.description.slice(0, 100)}...`;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    title: dynamicTitle,
    description: dynamicDescription,
    openGraph: {
      title: dynamicTitle,
      description: dynamicDescription,
      type: "website",
      images: [
        {
          url: playlistData.thumbnail,
          width: 1200,
          height: 630,
          alt: `${playlistData.title} - Power Hour Playlist`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicTitle,
      description: dynamicDescription,
      images: [playlistData.thumbnail],
    },
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
      <Home />
    </Suspense>
  );
}