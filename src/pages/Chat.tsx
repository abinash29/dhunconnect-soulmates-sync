import React, { useState, useEffect } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { MessageSquare, Search, User as UserIcon, Users, ArrowLeft, Trash2 } from 'lucide-react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import ChatRoom from '@/components/chat/ChatRoom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Chat: React.FC = () => {
  const { 
    toggleChat, 
    songs, 
    loadSong, 
    currentSong, 
    testMatchmaking, 
    connectedUsers,
    chatOpen,
    currentChat,
    setCurrentChat,
    setChatOpen,
    currentMatch,
    fetchMatchUserDetails
  } = useMusic();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [matchedUsers, setMatchedUsers] = useState<User[]>([]);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Load matched users when component mounts
  useEffect(() => {
    const loadMatchedUsers = async () => {
      if (!currentUser) return;
      
      setLoadingMatches(true);
      console.log('Loading matched users for current user:', currentUser.id);
      
      try {
        // Fetch all matches where the current user is involved
        const { data: matches, error: matchError } = await supabase
          .from('matches')
          .select(`
            id,
            user1_id,
            user2_id,
            song_id,
            created_at
          `)
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);
        
        if (matchError) {
          console.error('Error fetching matches:', matchError);
          return;
        }
        
        console.log('Found matches:', matches);
        
        if (matches && matches.length > 0) {
          // Get the other user IDs from matches
          const otherUserIds = matches.map(match => 
            match.user1_id === currentUser.id ? match.user2_id : match.user1_id
          );
          
          console.log('Other user IDs:', otherUserIds);
          
          // Fetch profiles for these users
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', otherUserIds);
          
          if (profileError) {
            console.error('Error fetching profiles:', profileError);
            return;
          }
          
          console.log('Found matched user profiles:', profiles);
          
          if (profiles) {
            // Transform profiles to User objects
            const users: User[] = profiles.map(profile => ({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              avatar: profile.avatar
            }));
            
            setMatchedUsers(users);
            console.log('Set matched users:', users);
          }
        }
      } catch (error) {
        console.error('Error loading matched users:', error);
      } finally {
        setLoadingMatches(false);
      }
    };
    
    loadMatchedUsers();
  }, [currentUser]);

  // Real-time subscription for new matches
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('new_matches_subscription')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${currentUser.id}`
        },
        async (payload) => {
          console.log('New match detected for user1:', payload);
          if (payload.new) {
            const matchData = payload.new as any;
            // Fetch the other user's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', matchData.user2_id)
              .single();
            
            if (profile) {
              const newUser: User = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar
              };
              
              setMatchedUsers(prev => {
                const exists = prev.find(u => u.id === newUser.id);
                if (!exists) {
                  return [...prev, newUser];
                }
                return prev;
              });
              
              // Automatically open chat with the new match
              handleUserClick(newUser);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${currentUser.id}`
        },
        async (payload) => {
          console.log('New match detected for user2:', payload);
          if (payload.new) {
            const matchData = payload.new as any;
            // Fetch the other user's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', matchData.user1_id)
              .single();
            
            if (profile) {
              const newUser: User = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar
              };
              
              setMatchedUsers(prev => {
                const exists = prev.find(u => u.id === newUser.id);
                if (!exists) {
                  return [...prev, newUser];
                }
                return prev;
              });
              
              // Automatically open chat with the new match
              handleUserClick(newUser);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);
  
  // Filter matched users based on search query
  useEffect(() => {
    console.log('Chat component - Current matched users:', matchedUsers);
    console.log('Chat component - Current user ID:', currentUser?.id);
    
    let filtered = matchedUsers;
    
    // Apply search filter if there's a query
    if (searchQuery.trim()) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    console.log('Chat component - Filtered matched users:', filtered);
    setFilteredUsers(filtered);
  }, [matchedUsers, searchQuery]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handlePlaySong = () => {
    if (songs.length > 0) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      const randomSong = songs[randomIndex];
      loadSong(randomSong);
    }
  };

  const handleTestMatch = () => {
    if (!currentUser) {
      return;
    }
    
    if (currentSong) {
      testMatchmaking(currentSong);
    } else if (songs.length > 0) {
      // If no current song, use the first song in the list
      testMatchmaking(songs[0]);
    }
  };

  const handleUserClick = async (user: User) => {
    console.log('Opening chat with user:', user.name);
    
    if (!currentUser) {
      console.error('No current user available');
      return;
    }
    
    try {
      // Find the match between current user and selected user
      const { data: match, error } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${currentUser.id})`)
        .single();
      
      if (error) {
        console.error('Error finding match:', error);
        return;
      }
      
      console.log('Found match:', match);
      
      // Use the fetchMatchUserDetails function to properly set up the chat
      await fetchMatchUserDetails(user.id, match.id, match.song_id);
      
      console.log('Chat should now be open via fetchMatchUserDetails');
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!currentUser) return;
    
    try {
      // Use the database function to delete the match and associated messages
      const { error } = await supabase.rpc('delete_user_match', {
        current_user_id: currentUser.id,
        other_user_id: user.id
      });
      
      if (error) {
        console.error('Error deleting match:', error);
        toast({
          title: "Error",
          description: "Failed to remove user from your matches.",
          variant: "destructive",
        });
        return;
      }
      
      // Remove user from local state
      setMatchedUsers(prev => prev.filter(u => u.id !== user.id));
      
      // Close chat if it's open with this user
      if (currentMatch && currentMatch.id === user.id) {
        setChatOpen(false);
        setCurrentChat(null);
        // Clear saved chat state
        sessionStorage.removeItem('dhun_chat_state');
      }
      
      toast({
        title: "User Removed",
        description: `${user.name} has been removed from your matches.`,
      });
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user from your matches.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      handleDeleteUser(userToDelete);
    }
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  // Show chat room overlay if chat is open
  if (chatOpen && currentChat) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dhun-dark">
        <Header />
        <ChatRoom />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dhun-dark">
      <Header />
      
      <div className="container py-4 sm:py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">Your Messages</h1>
            <div className="flex gap-2">
              <Button 
                onClick={handleTestMatch} 
                className="bg-dhun-orange hover:bg-dhun-orange/90 text-sm sm:text-base px-3 sm:px-4"
                size="sm"
              >
                Test Match
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search matched users..."
              className="pl-10 text-sm sm:text-base"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Loading state */}
          {loadingMatches && (
            <div className="text-center py-8">
              <p className="text-sm sm:text-base">Loading your matches...</p>
            </div>
          )}

          {/* Matched Users */}
          {!loadingMatches && filteredUsers.length > 0 && (
            <div className="mb-6">
              <h2 className="text-base sm:text-lg font-medium mb-3 flex items-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Matched Users ({filteredUsers.length})
              </h2>
              <div className="space-y-3">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div 
                      className="flex items-center flex-1 cursor-pointer"
                      onClick={() => handleUserClick(user)}
                    >
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-3">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-dhun-orange text-white">
                          {user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm sm:text-lg">{user.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                          Matched via music • Click to chat
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-green-500 font-medium mr-2 hidden sm:block">Connected</span>
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-dhun-purple" />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(user);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 sm:p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Debug info - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 sm:p-4 bg-yellow-100 rounded-lg">
              <p className="text-xs sm:text-sm">Debug - Total matched users: {matchedUsers.length}</p>
              <p className="text-xs sm:text-sm">Debug - Filtered users: {filteredUsers.length}</p>
              <p className="text-xs sm:text-sm">Debug - Current user: {currentUser?.name}</p>
              <p className="text-xs sm:text-sm">Debug - Search query: "{searchQuery}"</p>
              <p className="text-xs sm:text-sm">Debug - Loading matches: {loadingMatches}</p>
              <p className="text-xs sm:text-sm">Debug - Chat open: {chatOpen}</p>
              <p className="text-xs sm:text-sm">Debug - Current chat: {currentChat ? 'Yes' : 'No'}</p>
            </div>
          )}
          
          {/* No matches state */}
          {!loadingMatches && filteredUsers.length === 0 && (
            <Card className="text-center">
              <CardContent className="py-6 sm:py-8 px-4">
                <UserIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-base sm:text-lg font-medium mb-2">
                  {searchQuery ? 'No users found' : 'No matches yet'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
                  {searchQuery 
                    ? `No matched users match "${searchQuery}". Try a different search term.`
                    : 'Start listening to music and connect with others who share your taste! When someone listens to the same song, you\'ll be matched automatically.'
                  }
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={handlePlaySong} 
                    className="w-full bg-dhun-blue hover:bg-dhun-blue/90 text-sm sm:text-base"
                    size="sm"
                  >
                    Listen to a Random Song
                  </Button>
                  <Button 
                    onClick={handleTestMatch} 
                    className="w-full bg-dhun-orange hover:bg-dhun-orange/90 text-sm sm:text-base"
                    size="sm"
                  >
                    Test Matchmaking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Remove User</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to remove {userToDelete?.name} from your matches? This will delete all chat messages and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="text-sm sm:text-base">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-sm sm:text-base"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Chat;
