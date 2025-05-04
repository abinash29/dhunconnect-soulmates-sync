
import React, { useState, useEffect } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Search, User, Users } from 'lucide-react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

const Chat: React.FC = () => {
  const { toggleChat, songs, loadSong, currentSong, testMatchmaking, addMockConnectedUsers, connectedUsers } = useMusic();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<{name: string, message: string, time: string, avatar?: string}[]>([]);
  
  const mockChatHistory = [
    { name: "Alex", message: "That song was amazing!", time: "3m ago", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Alex" },
    { name: "Taylor", message: "Have you heard their new album?", time: "2h ago", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Taylor" },
    { name: "Jordan", message: "Thanks for the recommendation", time: "1d ago", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Jordan" },
    { name: "Morgan", message: "What genre do you usually listen to?", time: "2d ago", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Morgan" },
  ];
  
  useEffect(() => {
    setFilteredUsers(mockChatHistory);
  }, []);
  
  useEffect(() => {
    if (searchQuery) {
      const filtered = mockChatHistory.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(mockChatHistory);
    }
  }, [searchQuery]);
  
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
              <Button onClick={addMockConnectedUsers} className="bg-blue-500 hover:bg-blue-600">
                <Users className="w-4 h-4 mr-2" />
                Add Test Users
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search chats..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Connected Users */}
          {connectedUsers.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-3">Connected Users</h2>
              <div className="flex flex-wrap gap-2">
                {connectedUsers.map(user => (
                  <div key={user.id} className="flex items-center p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Chat list */}
          {filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {filteredUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => toggleChat()}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{user.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <Card className="text-center">
              <CardContent className="py-8">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium mb-2">No chats yet</h3>
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
                  {!connectedUsers.length && (
                    <Button onClick={addMockConnectedUsers} className="w-full bg-blue-500 hover:bg-blue-600">
                      <Users className="w-4 h-4 mr-2" />
                      Add Test Users
                    </Button>
                  )}
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
