import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-4">
          <strong>Last updated:</strong> February 27, 2026
        </p>
        <p className="mb-4">
          This Privacy Policy explains how we collect, use, and protect your information when you use the Jamms.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Google account information (if you sign in)</li>
          <li>YouTube playlist URLs and related metadata</li>
          <li>Usage statistics (playlist plays, session data)</li>
        </ul>
        <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Your Information</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>To share playlists with the community (if you opt in)</li>
        </ul>
        <h2 className="text-xl font-semibold mt-6 mb-2">Data Sharing & Third Parties</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>We do not sell your personal information</li>
          <li>Google and YouTube APIs are used for authentication and playlist data</li>
          <li>Firestore is used for backend data storage</li>
        </ul>
        <h2 className="text-xl font-semibold mt-6 mb-2">Your Choices</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>You may sign in with Google or use manual input</li>
          <li>You may opt out of sharing playlists with the community</li>
        </ul>
        <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
        <p className="mb-4">
          For questions or concerns about this Privacy Policy, please reach out to me at <a href="mailto:support@powerhour.app" className="text-blue-600 underline">alex@acwd.me</a>.
        </p>
        <Link href="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    </div>
  );
}
