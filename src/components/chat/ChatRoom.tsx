
import React, { useState, useRef, useEffect } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User, X } from 'lucide-react';

const ChatRoom: React.FC = () => {
  const { currentChat, currentMatch, chatOpen, sendMessage, toggleChat } = useMusic();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChat?.messages]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentChat || !currentMatch || !currentUser) return null;

  return (
    <Sheet open={chatOpen} onOpenChange={toggleChat}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={currentMatch.avatar} />
                <AvatarFallback className="bg-dhun-orange text-white">
                  {currentMatch.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <SheetTitle>{currentMatch.name}</SheetTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleChat}>
              <X size={18} />
            </Button>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentChat.messages.map((msg) => {
            const isCurrentUser = msg.senderId === currentUser.id;
            const isBot = msg.isBot;
            
            return (
              <div 
                key={msg.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isBot 
                      ? 'bg-dhun-light-blue text-gray-800' 
                      : isCurrentUser 
                        ? 'bg-dhun-purple text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {isBot && (
                    <div className="flex items-center mb-1">
                      <div className="h-5 w-5 rounded-full bg-dhun-blue flex items-center justify-center mr-1">
                        <User size={12} className="text-white" />
                      </div>
                      <span className="text-xs font-semibold">DhunBot</span>
                    </div>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-[10px] opacity-70 text-right mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSend}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatRoom;
