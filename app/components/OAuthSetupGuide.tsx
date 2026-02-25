"use client";

import { ExternalLink, Settings, CheckCircle } from "lucide-react";

export default function OAuthSetupGuide() {
    return (
        <div className="max-w-2xl mx-auto mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
                <Settings className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">
                    Google OAuth Setup Required
                </h3>
            </div>

            <p className="text-blue-700 mb-4">
                To access your YouTube playlists, you need to configure Google Cloud Console:
            </p>

            <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-blue-800 font-medium">
                            1. Go to Google Cloud Console
                        </p>
                        <p className="text-xs text-blue-600">
                            Visit console.developers.google.com and select your project
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-blue-800 font-medium">
                            2. Navigate to APIs & Services → Credentials
                        </p>
                        <p className="text-xs text-blue-600">
                            Find OAuth 2.0 Client ID: <span className="font-mono">803279594480-2vd3tvk06612lmrlkmgvi64kg56f88me</span> and click to edit
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-blue-800 font-medium">
                            3. Find "Authorized JavaScript origins" section
                        </p>
                        <p className="text-xs text-blue-600">
                            Scroll down to the "Authorized JavaScript origins" section (NOT "Authorized redirect URIs")
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-blue-800 font-medium">
                            4. Click "Add URI" and enter:
                        </p>
                        <div className="space-y-2 mt-1">
                            <p className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">
                                http://localhost:3000
                            </p>
                            <p className="text-xs text-blue-700">
                                ⚠️ For JavaScript origins, you DO need the full URL with http://
                            </p>
                        </div>
                    </div>
                </div>                <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-blue-800 font-medium">
                            4. Save and wait 5-10 minutes
                        </p>
                        <p className="text-xs text-blue-600">
                            Google needs time to propagate the changes
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <a
                    href="https://console.developers.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <ExternalLink className="h-4 w-4" />
                    Open Google Console
                </a>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                    💡 <strong>Quick tip:</strong> While waiting for OAuth setup, you can still use the app by entering YouTube playlist URLs manually below.
                </p>
            </div>
        </div>
    );
}