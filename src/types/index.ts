
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  audioUrl: string;
  duration: number;
  genre: string;
  language: "hindi" | "english";
}

export type MoodType = 'happy' | 'sad' | 'energetic' | 'romantic' | 'relaxed' | 'party' | 'focus';

export interface Chat {
  id: string;
  matchId: string;
  users: string[];
  messages: Message[];
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string | null;
  receiverId: string | null;
  content: string;
  timestamp: Date;
  isBot?: boolean;
}

export interface MusicContextType {
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  currentSong: Song | null;
  songs: Song[];
  connectedUsers: User[];
  chatOpen: boolean;
  currentChat: Chat | null;
  activeListeners: Record<string, number>;
  loadSong: (song: Song) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seekToPosition: (position: number) => void;
  findMatch: (song: Song) => Promise<void>;
  forceMatch: (song: Song) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  testMatchmaking: (song: Song) => void;
  registerConnectedUser: (user: User) => void;
  unregisterConnectedUser: (userId: string) => void;
  addMockConnectedUsers: () => void;
  fetchMatchUserDetails: (userId: string, matchId: string, songId: string) => Promise<void>;
  setChatOpen: (isOpen: boolean) => void;
  setCurrentChat: (chat: Chat | null) => void;
  getRecommendedSongs: (count?: number) => Promise<Song[]>;
  getMostListenedGenre: () => Promise<string | null>;
  getMoodRecommendations: (mood: MoodType) => Promise<Song[]>;
  getSongsByGenre: (genre: string) => Song[];
  getSongsByLanguage: (language: "hindi" | "english") => Song[];
  loadingSongs: boolean;
  loadingError: string | null;
  searchResults: Song[];
  searchQuery: string;
  searchSongs: (query: string) => void;
  playRecommendedSong: () => Promise<void>;
}
