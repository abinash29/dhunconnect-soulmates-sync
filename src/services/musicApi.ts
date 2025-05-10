import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/types';
import { toast } from '@/hooks/use-toast';

// Fallback tracks for reliability in case of connection issues
const fallbackTracks: Song[] = [
  {
    id: "fallback-1",
    title: "Summer Vibes",
    artist: "DJ Sunshine",
    albumArt: "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 180,
    genre: "Pop",
    language: "english" as const
  },
  {
    id: "fallback-2",
    title: "Midnight Dreams",
    artist: "Luna Echo",
    albumArt: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 210,
    genre: "Ambient",
    language: "english" as const
  },
  {
    id: "fallback-3",
    title: "Urban Groove",
    artist: "Beat Master",
    albumArt: "https://images.unsplash.com/photo-1509781827353-fb95c262f5a0?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 195,
    genre: "Hip Hop",
    language: "english" as const
  },
  {
    id: "fallback-4",
    title: "Dil Ka Safar",
    artist: "Raj Kumar",
    albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: 225,
    genre: "Bollywood",
    language: "hindi" as const
  },
  {
    id: "fallback-5",
    title: "Pyaar Ka Izhaar",
    artist: "Meera Sharma",
    albumArt: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    duration: 240,
    genre: "Bollywood",
    language: "hindi" as const
  },
  {
    id: "fallback-6",
    title: "Chill Afternoon",
    artist: "Relaxation Masters",
    albumArt: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    duration: 230,
    genre: "Lofi",
    language: "english" as const
  },
  {
    id: "fallback-7",
    title: "Dance Tonight",
    artist: "Party People",
    albumArt: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    duration: 185,
    genre: "Dance",
    language: "english" as const
  },
  {
    id: "fallback-8",
    title: "Tumse Milke",
    artist: "Neha Kapoor",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    duration: 255,
    genre: "Bollywood",
    language: "hindi" as const
  }
];

// Convert Supabase song format to our app's Song format
const convertSupabaseSongToSong = (track: any): Song => {
  return {
    id: track.id || `song-${Math.random().toString(36).substring(7)}`,
    title: track.title || 'Unknown Title',
    artist: track.artist || 'Unknown Artist',
    albumArt: track.album_art || 'https://via.placeholder.com/150',
    audioUrl: track.audio_url || '',
    duration: track.duration || 0,
    genre: track.genre || 'Unknown',
    language: track.language?.toLowerCase() === 'hindi' ? 'hindi' : 'english' as const
  };
};

export const fetchTracks = async (limit = 20): Promise<Song[]> => {
  try {
    console.log("Fetching tracks from Supabase...");
    
    // Fetch songs from Supabase
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    if (songs && songs.length > 0) {
      // Map Supabase response to our Song format
      const tracks = songs.map(convertSupabaseSongToSong);
      console.log(`Fetched ${tracks.length} tracks from Supabase`);
      return tracks;
    } else {
      console.log('No songs found in Supabase, using fallback tracks');
      return fallbackTracks;
    }
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
    console.log('Falling back to reliable tracks');
    return fallbackTracks;
  }
};

export const searchTracks = async (query: string, limit = 10): Promise<Song[]> => {
  if (!query.trim()) return [];
  
  try {
    console.log(`Searching Supabase for: "${query}"`);
    
    // Search songs in Supabase
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%,genre.ilike.%${query}%`)
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    if (songs && songs.length > 0) {
      // Map Supabase response to our Song format
      const tracks = songs.map(convertSupabaseSongToSong);
      console.log(`Found ${tracks.length} tracks for query "${query}" from Supabase`);
      return tracks;
    } else {
      console.log(`No results found for "${query}", filtering fallback tracks`);
      // Fallback to filtering local tracks if no results
      const filteredFallbacks = fallbackTracks.filter(track => 
        track.title.toLowerCase().includes(query.toLowerCase()) || 
        track.artist.toLowerCase().includes(query.toLowerCase()) ||
        track.genre.toLowerCase().includes(query.toLowerCase())
      );
      return filteredFallbacks;
    }
  } catch (error) {
    console.error('Error searching in Supabase:', error);
    // Filter fallback tracks based on the query
    const filteredFallbacks = fallbackTracks.filter(track => 
      track.title.toLowerCase().includes(query.toLowerCase()) || 
      track.artist.toLowerCase().includes(query.toLowerCase())
    );
    return filteredFallbacks;
  }
};

// Functions for active listener management and matchmaking
export const registerActiveListener = async (userId: string, songId: string): Promise<void> => {
  if (!userId || !songId) return;
  
  try {
    console.log(`Registering user ${userId} as active listener for song ${songId}`);
    
    // First, update any existing active listener records for this user to inactive
    await supabase
      .from('active_listeners')
      .update({ is_active: false })
      .eq('user_id', userId);
    
    console.log('Marked previous active listeners as inactive');
    
    // Now create a new active listener record
    const { data, error } = await supabase
      .from('active_listeners')
      .upsert({ 
        user_id: userId, 
        song_id: songId, 
        started_at: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'user_id,song_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Error registering active listener:', error);
    } else {
      console.log(`Successfully registered user ${userId} as active listener for song ${songId}`, data);
      
      // Verify the insertion worked by checking the database
      const { data: verification, error: verificationError } = await supabase
        .from('active_listeners')
        .select('*')
        .eq('user_id', userId)
        .eq('song_id', songId)
        .eq('is_active', true)
        .single();
        
      if (verificationError) {
        console.error('Error verifying active listener registration:', verificationError);
      } else {
        console.log('Verified active listener registration:', verification);
      }
    }
  } catch (error) {
    console.error('Error in registerActiveListener:', error);
  }
};

export const unregisterActiveListener = async (userId: string): Promise<void> => {
  if (!userId) return;
  
  try {
    console.log(`Marking user ${userId} as inactive listener`);
    
    // Mark all active listener records for this user as inactive
    const { error } = await supabase
      .from('active_listeners')
      .update({ is_active: false })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error unregistering active listener:', error);
    } else {
      console.log(`Successfully marked user ${userId} as inactive listener`);
    }
  } catch (error) {
    console.error('Error in unregisterActiveListener:', error);
  }
};

export const findPotentialMatches = async (userId: string, songId: string): Promise<any[]> => {
  if (!userId || !songId) return [];
  
  try {
    console.log(`Finding potential matches for user ${userId} on song ${songId}`);
    
    // Find other active listeners for the same song
    const { data, error } = await supabase
      .from('active_listeners')
      .select(`
        id,
        user_id,
        profiles:user_id (id, name, avatar, email)
      `)
      .eq('song_id', songId)
      .eq('is_active', true)
      .neq('user_id', userId)
      .limit(5);
    
    if (error) {
      console.error('Error finding potential matches:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} potential matches`);
    return data || [];
  } catch (error) {
    console.error('Error in findPotentialMatches:', error);
    return [];
  }
};

export const createMatch = async (user1Id: string, user2Id: string, songId: string): Promise<string | null> => {
  if (!user1Id || !user2Id || !songId) return null;
  
  try {
    console.log(`Creating match between users ${user1Id} and ${user2Id} for song ${songId}`);
    
    // Check for existing match first
    const { data: existingMatch, error: checkError } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .eq('song_id', songId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for existing match:', checkError);
    }
    
    // If match already exists, return its ID
    if (existingMatch) {
      console.log(`Match already exists with ID: ${existingMatch.id}`);
      return existingMatch.id;
    }
    
    // Create a new match
    const { data, error } = await supabase
      .from('matches')
      .insert({ 
        user1_id: user1Id, 
        user2_id: user2Id, 
        song_id: songId
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating match:', error);
      return null;
    }
    
    console.log(`Successfully created match with ID: ${data?.id}`);
    return data?.id || null;
  } catch (error) {
    console.error('Error in createMatch:', error);
    return null;
  }
};

export const sendChatMessage = async (
  matchId: string,
  senderId: string,
  content: string
) => {
  if (!matchId || !senderId || !content.trim()) {
    console.error('Missing required parameters for sending chat message');
    return null;
  }

  try {
    // First get the match to determine the receiver
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
    
    if (matchError) {
      console.error('Error fetching match data:', matchError);
      return null;
    }
    
    // Determine the receiver based on the sender and match data
    const receiverId = matchData.user1_id === senderId 
      ? matchData.user2_id 
      : matchData.user1_id;
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        receiver_id: receiverId,
        content
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error sending chat message:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    return null;
  }
};

export const getChatMessages = async (matchId: string): Promise<any[]> => {
  if (!matchId) return [];
  
  try {
    console.log(`Fetching chat messages for match ${matchId}`);
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        content,
        created_at,
        sender:sender_id (id, name, avatar)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} messages for match ${matchId}`);
    return data || [];
  } catch (error) {
    console.error('Error in getChatMessages:', error);
    return [];
  }
};

export const getActiveListenerCount = async (songId: string): Promise<number> => {
  if (!songId) return 0;
  
  try {
    const { count, error } = await supabase
      .from('active_listeners')
      .select('id', { count: 'exact', head: true })
      .eq('song_id', songId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error getting active listener count:', error);
      return 0;
    }
    
    console.log(`Song ${songId} has ${count || 0} active listeners`);
    return count || 0;
  } catch (error) {
    console.error('Error in getActiveListenerCount:', error);
    return 0;
  }
};
