
import React, { useState, useEffect } from 'react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Search, Music, User } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { Input } from '@/components/ui/input';

const Chat: React.FC = () => {
  const { toggleChat, songs, loadSong, currentSong, testMatchmaking } = useMusic();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<{name: string, message: string, time: string, avatar?: string}[]>([]);
  
  // Simulated chat partners
  const mockUsers = [
    { name: "Alex", message: "This song is amazing! What other artists do you listen to?", time: "2m ago", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Alex" },
    { name: "Sarah", message: "I love this artist too! Have you heard their latest album?", time: "5m ago", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Sarah" },
    { name: "Jordan", message: "What's your favorite genre?", time: "10m ago", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Jordan" },
    { name: "Taylor", message: "Do you play any instruments?", time: "1h ago", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Taylor" },
    { name: "Morgan", message: "Music really connects people, doesn't it?", time: "3h ago", avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Morgan" },
  ];
  
  useEffect(() => {
    setFilteredUsers(mockUsers);
  }, []);
  
  useEffect(() => {
    if (searchQuery) {
      setFilteredUsers(mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.message.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredUsers(mockUsers);
    }
  }, [searchQuery]);
  
  const handleOpenChat = (userName: string) => {
    // Find a random song to simulate matching on
    if (songs.length > 0) {
      const randomSong = songs[Math.floor(Math.random() * songs.length)];
      loadSong(randomSong);
      
      // After loading the song, the match will happen automatically through the existing matchmaking mechanism
      // No need to call findMatch directly, as it's handled by the loadSong function
      setTimeout(() => {
        toggleChat();
      }, 1000);
    } else {
      // If no songs available, just open the chat
      toggleChat();
    }
  };

  const handleTestMatch = () => {
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
      
      <main className="container mx-auto px-4 py-8">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>DJ</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">DhunConnect Bot</h2>
                  <p className="text-sm text-gray-500">Welcome to DhunConnect Chat!</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Start listening to music and connect with others who share your taste! When someone listens to the same song, you'll be matched automatically.
              </p>
              <div className="space-y-3">
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

          {/* User messages */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold mb-3">Recent Conversations</h2>
            
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleOpenChat(user.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{user.name}</h3>
                          <span className="text-xs text-gray-400">{user.time}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {user.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <User className="text-gray-400" size={24} />
                </div>
                <h3 className="font-medium mb-1">No matches found</h3>
                <p className="text-sm text-gray-500">
                  Try a different search or listen to music to connect with others
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
