
import { User, Song, Chat, Message } from '@/types';
import { toast } from '@/hooks/use-toast';
import { 
  findPotentialMatches, 
  createMatch, 
  sendChatMessage, 
  registerActiveListener
} from '@/services/musicApi';
import { supabase } from '@/integrations/supabase/client';

type UseMatchLogicProps = {
  currentUser: User | null;
  setCurrentMatch: (match: User | null) => void;
  setCurrentChat: (chat: Chat | null) => void;
  setChatOpen: (isOpen: boolean) => void;
};

export const useMatchLogic = ({
  currentUser,
  setCurrentMatch,
  setCurrentChat,
  setChatOpen
}: UseMatchLogicProps) => {
  // Function to fetch user details for a match
  const fetchMatchUserDetails = async (userId: string, matchId: string, songId: string) => {
    try {
      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      // Get song details
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single();
        
      if (songError) throw songError;
      
      const matchUser: User = {
        id: userData.id,
        name: userData.name || 'Unknown User',
        email: userData.email || '',
        avatar: userData.avatar
      };
      
      createRealMatch(
        {
          id: songData.id,
          title: songData.title,
          artist: songData.artist,
          albumArt: songData.album_art,
          audioUrl: songData.audio_url,
          duration: songData.duration,
          genre: songData.genre || '',
          language: songData.language as 'hindi' | 'english'
        }, 
        matchUser, 
        matchId
      );
      
    } catch (error) {
      console.error('Error fetching match details:', error);
    }
  };
  
  // Check for real-time match when another user starts listening to the same song
  const checkForRealTimeMatch = async (songId: string, otherUserId: string) => {
    if (!currentUser || !songId) return;
    
    try {
      // Check if current user is listening to this song
      const { data: currentUserListening, error: listeningError } = await supabase
        .from('active_listeners')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('song_id', songId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (listeningError) throw listeningError;
      
      // If current user is listening to the same song as the other user
      if (currentUserListening) {
        console.log('Match confirmed! Both users listening to the same song');
        
        // Check if these users are already matched
        const { data: existingMatch, error: matchError } = await supabase
          .from('matches')
          .select('id')
          .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUser.id})`)
          .eq('song_id', songId)
          .maybeSingle();
        
        if (matchError) throw matchError;
        
        if (!existingMatch) {
          console.log('Creating new match between users');
          // Create a new match since one doesn't exist
          await createMatch(currentUser.id, otherUserId, songId);
          // Note: The match creation will trigger the realtime subscription
        } else {
          console.log('Match already exists between these users for this song');
        }
      }
    } catch (error) {
      console.error('Error checking for real-time match:', error);
    }
  };
  
  // Find a match for the current song - this runs when the current user starts playing
  const findMatch = async (song: Song) => {
    console.log("Finding match for song:", song.title);
    
    if (!currentUser) return;
    
    // Register as active listener for this song
    await registerActiveListener(currentUser.id, song.id);
    console.log(`Registered user ${currentUser.id} as active listener for song ${song.id}`);
    
    // Look for real matches - other users currently listening to the same song
    const potentialMatches = await findPotentialMatches(currentUser.id, song.id);
    console.log('Potential matches found:', potentialMatches);
    
    if (potentialMatches && potentialMatches.length > 0) {
      // Get the first match
      const match = potentialMatches[0];
      
      // Create a user object from the match
      const matchUser: User = {
        id: match.user_id,
        name: match.profiles?.name || 'Unknown User',
        email: match.profiles?.email || '',
        avatar: match.profiles?.avatar
      };
      
      console.log('Creating match with user:', matchUser.name);
      
      // Create the match in the database
      const matchId = await createMatch(currentUser.id, matchUser.id, song.id);
      
      if (matchId) {
        createRealMatch(song, matchUser, matchId);
      } else {
        console.log("Failed to create match");
        toast({
          title: "Looking for matches",
          description: "We'll notify you when someone else starts listening to this song",
        });
      }
    } else {
      console.log("No match found at this time");
      toast({
        title: "Looking for matches",
        description: "We'll notify you when someone else starts listening to this song",
        variant: "default",
      });
    }
  };
  
  // Create a match with a real user
  const createRealMatch = (song: Song, matchUser: User, matchId?: string) => {
    setCurrentMatch(matchUser);
    
    // Create a more personalized opening message with the real user
    const openingMessages = [
      `You and ${matchUser.name} are both enjoying "${song.title}"! Why not say hello?`,
      `${matchUser.name} loves "${song.title}" too! Start a conversation about your shared taste.`,
      `Musical match found! ${matchUser.name} is also listening to "${song.title}" right now.`,
      `Great minds think alike! ${matchUser.name} is also enjoying "${song.title}". Say hi!`
    ];
    
    const randomOpening = openingMessages[Math.floor(Math.random() * openingMessages.length)];
    
    const chatId = matchId || `chat-${Date.now()}`;
    
    const newChat: Chat = {
      id: chatId,
      matchId: chatId,
      users: [currentUser?.id || 'current-user', matchUser.id],
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'bot',
          content: randomOpening,
          timestamp: new Date(),
          isBot: true,
        }
      ]
    };
    
    setCurrentChat(newChat);
    setChatOpen(true);
    
    toast({
      title: "You found a music soulmate!",
      description: `${matchUser.name} is also listening to ${song.title}`,
    });
    
    // If we have a real match ID, save the first message
    if (matchId && currentUser) {
      // We'll send the bot message to the database
      sendChatMessage(matchId, 'bot', randomOpening);
    }
  };
  
  return {
    findMatch,
    fetchMatchUserDetails,
    checkForRealTimeMatch
  };
};
