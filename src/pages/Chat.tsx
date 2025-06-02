
import React, { useState, useEffect } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { MessageSquare, Search, User as UserIcon, Users, ArrowLeft } from 'lucide-react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import ChatRoom from '@/components/chat/ChatRoom';
import { supabase } from '@/integrations/supabase/client';

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
    setChatOpen
  } = useMusic();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showChatList, setShowChatList] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  
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
            // Update connected users with matched profiles
            profiles.forEach(profile => {
              const userObj: User = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar
              };
              // Add to connected users if not already present
              console.log('Adding matched user to connected users:', userObj.name);
            });
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
  
  // Filter connected users and log for debugging
  useEffect(() => {
    console.log('Chat component - Current connected users:', connectedUsers);
    console.log('Chat component - Current user ID:', currentUser?.id);
    
    // Filter out current user from connected users and apply search
    let filtered = connectedUsers.filter(user => 
      currentUser && user.id !== currentUser.id
    );
    
    // Apply search filter if there's a query
    if (searchQuery.trim()) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    console.log('Chat component - Filtered connected users:', filtered);
    setFilteredUsers(filtered);
  }, [connectedUsers, currentUser, searchQuery]);

  // Show chat list when chat is closed
  useEffect(() => {
    if (!chatOpen) {
      setShowChatList(true);
    }
  }, [chatOpen]);
  
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

  const handleUserClick = (user: User) => {
    console.log('Opening chat with user:', user.name);
    
    // Create a chat session for this user
    const newChat = {
      id: `chat-${user.id}`,
      matchId: `match-${currentUser?.id}-${user.id}`,
      users: [currentUser?.id || '', user.id],
      messages: [],
      createdAt: new Date(),
    };
    
    setCurrentChat(newChat);
    setChatOpen(true);
    setShowChatList(false);
  };

  const handleBackToList = () => {
    setShowChatList(true);
    setChatOpen(false);
    setCurrentChat(null);
  };

  // If chat is open and we're not showing the list, show the chat room
  if (chatOpen && !showChatList && currentChat) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dhun-dark">
        <Header />
        <div className="container py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              onClick={handleBackToList}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Messages
            </Button>
          </div>
        </div>
        <ChatRoom />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dhun-dark">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Your Messages</h1>
            <div className="flex gap-2">
              <Button onClick={handleTestMatch} className="bg-dhun-orange hover:bg-dhun-orange/90">
                Test Match
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search matched users..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Loading state */}
          {loadingMatches && (
            <div className="text-center py-8">
              <p>Loading your matches...</p>
            </div>
          )}

          {/* Connected Users (Real Matched Users Only) */}
          {!loadingMatches && filteredUsers.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Connected Users ({filteredUsers.length})
              </h2>
              <div className="space-y-3">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-dhun-orange text-white">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-lg">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        Matched via music • Click to chat
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-green-500 font-medium mr-2">Connected</span>
                      <MessageSquare className="w-5 h-5 text-dhun-purple" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Debug info - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-yellow-100 rounded-lg">
              <p className="text-sm">Debug - Total connected users: {connectedUsers.length}</p>
              <p className="text-sm">Debug - Filtered users: {filteredUsers.length}</p>
              <p className="text-sm">Debug - Current user: {currentUser?.name}</p>
              <p className="text-sm">Debug - Search query: "{searchQuery}"</p>
              <p className="text-sm">Debug - Loading matches: {loadingMatches}</p>
            </div>
          )}
          
          {/* No matches state */}
          {!loadingMatches && filteredUsers.length === 0 && (
            <Card className="text-center">
              <CardContent className="py-8">
                <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No users found' : 'No matches yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {searchQuery 
                    ? `No connected users match "${searchQuery}". Try a different search term.`
                    : 'Start listening to music and connect with others who share your taste! When someone listens to the same song, you\'ll be matched automatically.'
                  }
                </p>
                <div className="space-y-3">
                  <Button onClick={handlePlaySong} className="w-full bg-dhun-blue hover:bg-dhun-blue/90">
                    Listen to a Random Song
                  </Button>
                  <Button onClick={handleTestMatch} className="w-full bg-dhun-orange hover:bg-dhun-orange/90">
                    Test Matchmaking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
