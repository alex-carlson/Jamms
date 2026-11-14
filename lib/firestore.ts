import { initializeApp, getApps, getApp } from 'firebase/app';
// The lite SDK uses REST instead of gRPC/protobufjs, which needs runtime code generation that Cloudflare Workers disallow.
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit as firestoreLimit, QueryConstraint } from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb() {
  if (!firebaseConfig.projectId) {
    throw new Error(
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing. Set the Firebase environment variables in the deployment build environment and rebuild.'
    );
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export type PopularJamm = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  plays: number;
  youtube_id: string;
  created_at: string;
  updated_at: string;
};

export type PlaylistPlay = {
  id: string;
  youtube_url: string;
  playlist_id: string;
  playlist_title: string | null;
  playlist_author: string | null;
  plays: number;
  created_at: string;
  updated_at: string;
};

// Firestore helper functions
export const firestoreHelpers = {
  // Query playlist_plays collection
  async getPlaylistPlays(constraints: QueryConstraint[] = []) {
    try {
      const defaultConstraints = [orderBy('plays', 'desc'), firestoreLimit(20)];
      const q = query(collection(getDb(), 'playlist_plays'), ...constraints.length ? constraints : defaultConstraints);
      const snapshot = await getDocs(q);
      return {
        data: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as PlaylistPlay[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? { message: error.message } : error,
      };
    }
  },

  // Get single playlist by URL
  async getPlaylistByUrl(youtubeUrl: string) {
    try {
      const q = query(collection(getDb(), 'playlist_plays'), where('youtube_url', '==', youtubeUrl));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { data: null, error: null };
      }
      const doc = snapshot.docs[0];
      return {
        data: {
          id: doc.id,
          ...doc.data(),
        } as PlaylistPlay,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? { message: error.message } : error,
      };
    }
  },

  // Update playlist plays count
  async updatePlaylistPlays(docId: string, newPlays: number) {
    try {
      const docRef = doc(getDb(), 'playlist_plays', docId);
      await updateDoc(docRef, {
        plays: newPlays,
        updated_at: new Date().toISOString(),
      });
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? { message: error.message } : error,
      };
    }
  },

  // Insert new playlist
  async insertPlaylist(data: Omit<PlaylistPlay, 'id'>) {
    try {
      const docRef = await addDoc(collection(getDb(), 'playlist_plays'), {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? { message: error.message } : error,
      };
    }
  },

  // Delete playlist
  async deletePlaylist(docId: string) {
    try {
      await deleteDoc(doc(getDb(), 'playlist_plays', docId));
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? { message: error.message } : error,
      };
    }
  },

  // Get popular jamms
  async getPopularJamms() {
    try {
      const q = query(collection(getDb(), 'popular_jamms'), orderBy('plays', 'desc'), firestoreLimit(5));
      const snapshot = await getDocs(q);
      return {
        data: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as PopularJamm[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? { message: error.message } : error,
      };
    }
  },
};
