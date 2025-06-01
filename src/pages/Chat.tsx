
import React, { useState, useEffect } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { MessageSquare, Search, User as UserIcon, Users } from 'lucide-react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

const Chat: React.FC = () => {
  const { toggleChat, songs, loadSong, currentSong, testMatchmaking, connectedUsers } = useMusic();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Filter connected users and log for debugging
  useEffect(() => {
    console.log('Chat component - Current connected users:', connectedUsers);
    console.log('Chat component - Current user ID:', currentUser?.id);
    
    // Filter out current user from connected users
    const filtered = connectedUsers.filter(user => 
      currentUser && user.id !== currentUser.id
    );
    
    console.log('Chat component - Filtered connected users:', filtered);
    setFilteredUsers(filtered);
  }, [connectedUsers, currentUser]);
  
  useEffect(() => {
    if (searchQuery) {
      const searchFiltered = connectedUsers.filter(user => 
        user.id !== currentUser?.id && (
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredUsers(searchFiltered);
    } else {
      const filtered = connectedUsers.filter(user => 
        currentUser && user.id !== currentUser.id
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, connectedUsers, currentUser]);
  
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
    console.log('Clicked on user:', user.name);
    // Open chat with this specific user
    toggleChat();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dhun-dark">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Your Messages</h1>
            <div className="flex gap-2">
              <Button onClick={() => toggleChat()} className="bg-dhun-purple hover:bg-dhun-purple/90">
                <MessageSquare className="w-4 h-4 mr-2" />
                New Chat
              </Button>
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

          {/* Connected Users (Real Matched Users Only) */}
          {filteredUsers.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-3">Connected Users ({filteredUsers.length})</h2>
              <div className="space-y-3">
                {filteredUsers.map(user => (
                  <div key={user.id} className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                       onClick={() => handleUserClick(user)}>
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Matched via music</p>
                    </div>
                    <span className="text-xs text-green-500 font-medium">Connected</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-yellow-100 rounded-lg">
              <p className="text-sm">Debug - Total connected users: {connectedUsers.length}</p>
              <p className="text-sm">Debug - Filtered users: {filteredUsers.length}</p>
              <p className="text-sm">Debug - Current user: {currentUser?.name}</p>
            </div>
          )}
          
          {/* No matches state */}
          {filteredUsers.length === 0 && (
            <Card className="text-center">
              <CardContent className="py-8">
                <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium mb-2">No matches yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Start listening to music and connect with others who share your taste! When someone listens to the same song, you'll be matched automatically.
                </p>
                <div className="space-y-3">
                  <Button onClick={handlePlaySong} className="w-full bg-dhun-blue hover:bg-dhun-blue/90">
                    Listen to a Random Song
                  </Button>
                  <Button onClick={() => toggleChat()} className="w-full bg-dhun-purple hover:bg-dhun-purple/90">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open Chat
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
