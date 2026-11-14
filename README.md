# Jamms Power Hour

A Next.js application that creates power hours from your YouTube playlists. Each song plays for 60 seconds before automatically advancing to the next track.

## Features

- 🎵 Connect to your YouTube account to access your playlists
- ⏰ Automatic 60-second intervals with seamless transitions
- 🔀 Shuffle support for randomized playlist order
- 📱 Responsive design for desktop and mobile
- 🎮 Manual controls for play, pause, and skip

## Environment Setup

Before running the application, you need to set up Google OAuth for YouTube API access:

### 1. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Go to "Credentials" and create an OAuth 2.0 client ID
5. Add your domain to authorized JavaScript origins:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Get the Firebase values from Firebase Console > Project Settings > Your apps > Config.
The `NEXT_PUBLIC_` variables are included in the browser bundle and are fixed at build time.
Do not put private credentials in them.

`.env.local` is ignored by Git and is not automatically available to remote builds.
Set the same variables in your hosting provider's build environment for each deployment
environment (for example, Production and Preview on Vercel), then redeploy. For Cloudflare,
they must be available when running `npm run cf:build`; Worker runtime variables alone
do not configure the client bundle.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
