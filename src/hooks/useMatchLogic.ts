import { useState, useEffect } from 'react';
import { User, Song } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type MatchLogicProps = {
  currentUser: User | null;
  setCurrentMatch: (user: User | null) => void;
  setCurrentChat: (chat: any) => void;
  setChatOpen: (isOpen: boolean) => void;
};

export const useMatchLogic = ({
  currentUser,
  setCurrentMatch,
  setCurrentChat,
  setChatOpen
}: MatchLogicProps) => {
  const findMatch = async (song: Song) => {
    if (!currentUser) {
      console.log("Cannot find match: User not logged in.");
      return;
    }
    
    console.log(`Attempting to find a match for user ${currentUser.id} and song ${song.id}`);
    
    try {
      // Find users currently listening to the same song
      const { data: activeListeners, error } = await supabase
        .from('active_listeners')
        .select('user_id')
        .eq('song_id', song.id)
        .eq('is_active', true)
        .neq('user_id', currentUser.id); // Exclude current user
      
      if (error) {
        console.error("Error fetching active listeners:", error);
        return;
      }
      
      if (activeListeners && activeListeners.length > 0) {
        console.log(`Found ${activeListeners.length} potential matches for song ${song.id}`);
        
        // Select a random user from the active listeners
        const randomIndex = Math.floor(Math.random() * activeListeners.length);
        const matchedUserId = activeListeners[randomIndex].user_id;
        
        console.log(`Attempting to match with user ID: ${matchedUserId}`);
        
        // Fetch the matched user's details
        const { data: matchedUser, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', matchedUserId)
          .single();
        
        if (userError) {
          console.error("Error fetching matched user details:", userError);
          return;
        }
        
        if (matchedUser) {
          console.log(`Successfully matched with user: ${matchedUser.name}`);
          
          // Check if a match already exists between the current user and the matched user for this song
          const { data: existingMatches, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${matchedUserId}),and(user1_id.eq.${matchedUserId},user2_id.eq.${currentUser.id})`)
            .eq('song_id', song.id);
          
          if (matchError) {
            console.error("Error checking for existing matches:", matchError);
            return;
          }
          
          if (existingMatches && existingMatches.length > 0) {
            console.log("Match already exists for these users and song.");
            
            // Fetch the existing match details
            const existingMatch = existingMatches[0];
            
            // Open the chat with the existing match details
            fetchMatchUserDetails(matchedUserId, existingMatch.id, song.id);
            
            // Set the current match
            setCurrentMatch(matchedUser as User);
            
            // Show a toast notification
            toast({
              title: "Match Found!",
              description: `You've already matched with ${matchedUser.name} for this song.`,
              variant: "default",
            });
            
            // Explicitly force the chat to open
            setChatOpen(true);
          } else {
            console.log("No existing match found, creating new match");
            
            // Create a new match
            const { data: newMatch, error: insertError } = await supabase
              .from('matches')
              .insert({
                user1_id: currentUser.id,
                user2_id: matchedUserId,
                song_id: song.id
              })
              .select()
              .single();
            
            if (insertError) {
              console.error("Error creating new match:", insertError);
              return;
            }
            
            if (newMatch) {
              console.log("Successfully created new match:", newMatch);
              
              // Fetch the match details
              fetchMatchUserDetails(matchedUserId, newMatch.id, song.id);
              
              // Set the current match
              setCurrentMatch(matchedUser as User);
              
              // Show a toast notification
              toast({
                title: "New Music Match!",
                description: `You've matched with ${matchedUser.name}!`,
                variant: "default",
              });
              
              // Explicitly force the chat to open
              setChatOpen(true);
            }
          }
        }
      } else {
        console.log("No active listeners found for this song.");
        toast({
          title: "No Match Found",
          description: "No one is listening to this song right now. Try again later!",
          duration: 5000,
        });
      }
    } catch (err) {
      console.error("Error in findMatch:", err);
    }
  };

  const fetchMatchUserDetails = async (userId: string, matchId: string, songId: string) => {
    if (!currentUser) {
      console.log("Cannot fetch match user details: User not logged in.");
      return;
    }
    
    console.log(`Fetching match user details for user ID: ${userId}, match ID: ${matchId}, song ID: ${songId}`);
    
    try {
      // Fetch the matched user's details
      const { data: matchedUser, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error("Error fetching matched user details:", userError);
        return;
      }
      
      // Fetch the chat messages for this match
      const { data: chatMessages, error: chatError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
      
      if (chatError) {
        console.error("Error fetching chat messages:", chatError);
        return;
      }
      
      // Structure the chat data
      const chatData = {
        id: matchId,
        matchId: matchId,
        messages: chatMessages || [],
        users: [currentUser.id, userId],
      };
      
      console.log("Match user details fetched successfully:", matchedUser);
      console.log("Chat data:", chatData);
      
      // Set the current match
      setCurrentMatch(matchedUser as User);
      
      // Set the current chat
      setCurrentChat(chatData);
      
      // Open the chat
      setChatOpen(true);
    } catch (error) {
      console.error("Error in fetchMatchUserDetails:", error);
    }
  };

  const checkForRealTimeMatch = async (songId: string, otherUserId: string) => {
    if (!currentUser || !songId || !otherUserId || otherUserId === currentUser.id) {
      return;
    }
    
    try {
      console.log(`Checking for real-time match for song ${songId} with user ${otherUserId}`);
      
      // Check if current user is actively listening to this song
      const { data: activeListenerData } = await supabase
        .from('active_listeners')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('song_id', songId)
        .eq('is_active', true)
        .single();
      
      if (activeListenerData) {
        console.log('Current user is actively listening to this song');
        
        // Check if match already exists between these users for this song
        const { data: existingMatches } = await supabase
          .from('matches')
          .select('*')
          .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUser.id})`)
          .eq('song_id', songId);
        
        const existingMatch = existingMatches && existingMatches.length > 0 ? existingMatches[0] : null;
        
        if (!existingMatch) {
          console.log('No existing match found, creating new match');
          
          // Create a new match
          const { data: newMatch, error: matchError } = await supabase
            .from('matches')
            .insert({
              user1_id: currentUser.id,
              user2_id: otherUserId,
              song_id: songId
            })
            .select()
            .single();
          
          if (matchError) {
            console.error('Error creating match:', matchError);
            return;
          }
          
          if (newMatch) {
            console.log('New match created:', newMatch);
            await fetchMatchUserDetails(otherUserId, newMatch.id, songId);
            
            // Show a toast notification
            toast({
              title: "New Music Match!",
              description: "Someone is listening to the same song as you!",
              variant: "default",
            });
            
            // Explicitly force the chat to open
            setChatOpen(true);
          } else {
            console.error('Failed to create match');
          }
        } else {
          console.log('Match already exists between these users for this song');
          // Even if match exists, we should still open the chat
          await fetchMatchUserDetails(otherUserId, existingMatch.id, songId);
          
          // Force chat to open
          setChatOpen(true);
        }
      } else {
        console.log('Current user is not actively listening to this song');
      }
    } catch (error) {
      console.error('Error checking for real-time match:', error);
    }
  };

  return {
    findMatch,
    fetchMatchUserDetails,
    checkForRealTimeMatch
  };
};
