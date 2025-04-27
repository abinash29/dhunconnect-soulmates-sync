
import React from 'react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';

const Chat: React.FC = () => {
  const { toggleChat } = useMusic();

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Your Messages</h1>
          
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
              <Button onClick={() => toggleChat()} className="w-full bg-dhun-purple hover:bg-dhun-purple/90">
                <MessageSquare className="w-4 h-4 mr-2" />
                Open Chat
              </Button>
            </CardContent>
          </Card>

          {/* Demo messages */}
          <div className="space-y-4">
            <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">Alex</h3>
                    <p className="text-sm text-gray-500 truncate">
                      This song is amazing! What other artists do you listen to?
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">2m ago</span>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">Sarah</h3>
                    <p className="text-sm text-gray-500 truncate">
                      I love this artist too! Have you heard their latest album?
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">5m ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
