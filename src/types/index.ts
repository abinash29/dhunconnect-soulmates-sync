
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  audioUrl: string;
  duration: number;
  genre: string;
  language: "hindi" | "english";
}

export interface Match {
  id: string;
  userId: string;
  matchUserId: string;
  songId: string;
  timestamp: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string | null;
  content: string;
  timestamp: Date;
  isBot?: boolean;
}

export interface Chat {
  id: string;
  matchId: string;
  messages: Message[];
  users: [string, string]; // Array of two user IDs
}

export type MoodType = 
  | "happy" 
  | "sad" 
  | "energetic" 
  | "romantic" 
  | "relaxed" 
  | "party"
  | "focus";
