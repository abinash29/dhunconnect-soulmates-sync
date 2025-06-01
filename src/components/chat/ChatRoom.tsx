
import React, { useState, useRef, useEffect } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User, X, Smile, PaperclipIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ChatRoom: React.FC = () => {
  const { currentChat, currentMatch, chatOpen, sendMessage, toggleChat } = useMusic();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Force chat to open if we have a match and current chat - CRITICAL FIX
  useEffect(() => {
    if (currentMatch && currentChat && !chatOpen) {
      console.log("Auto-opening chat due to new match");
      toggleChat(); // Open the chat
    }
  }, [currentMatch, currentChat, chatOpen, toggleChat]);

  // Fetch messages for the current chat
  useEffect(() => {
    if (currentChat && currentChat.matchId) {
      fetchMessages(currentChat.matchId);
      
      // Subscribe to real-time updates for this chat
      const channel = supabase
        .channel(`chat:${currentChat.matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `match_id=eq.${currentChat.matchId}`
          },
          (payload) => {
            console.log('New chat message received:', payload);
            if (payload.new && currentUser && payload.new.sender_id !== currentUser.id) {
              // Add the new message
              const newMessage = {
                id: payload.new.id,
                senderId: payload.new.sender_id,
                receiverId: payload.new.receiver_id,
                content: payload.new.content,
                timestamp: new Date(payload.new.created_at || new Date()),
                isBot: payload.new.sender_id === 'bot'
              };
              
              setChatMessages(prev => [...prev, newMessage]);
              
              // If we receive a message and the chat isn't open, open it
              if (!chatOpen) {
                console.log("Opening chat due to new message");
                toggleChat();
              }
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentChat, currentUser, chatOpen, toggleChat]);

  // Fetch initial messages for the chat
  const fetchMessages = async (matchId: string) => {
    if (!matchId) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      // Convert to the format expected by the UI
      const messages = data.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        timestamp: new Date(msg.created_at || new Date()),
        isBot: msg.sender_id === 'bot'
      }));
      
      // If no messages, add a welcome message
      if (messages.length === 0 && currentMatch) {
        const welcomeMessage = {
          id: `msg-${Date.now()}`,
          senderId: 'bot',
          receiverId: null,
          content: `You've matched with ${currentMatch.name} while listening to the same song! Start a conversation about your shared music taste.`,
          timestamp: new Date(),
          isBot: true
        };
        
        messages.push(welcomeMessage);
        
        // Save this welcome message
        await supabase
          .from('chat_messages')
          .insert({
            match_id: matchId,
            sender_id: 'bot',
            receiver_id: null,
            content: welcomeMessage.content
          });
      }
      
      setChatMessages(messages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Simulate typing indicator
  useEffect(() => {
    if (currentChat && currentMatch) {
      const typingInterval = setInterval(() => {
        setIsTyping(Math.random() > 0.7);
      }, 3000);
      
      return () => clearInterval(typingInterval);
    }
  }, [currentChat, currentMatch]);

  const handleSend = async () => {
    if (!message.trim() || !currentUser || !currentChat) return;
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: currentMatch?.id || null,
      content: message,
      timestamp: new Date(),
      isBot: false,
    };
    
    // Add message to local state immediately for better UX
    setChatMessages(prev => [...prev, newMessage]);
    
    try {
      // Save message to database
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          match_id: currentChat.matchId,
          sender_id: currentUser.id,
          receiver_id: currentMatch?.id || null,
          content: message
        });
        
      if (error) throw error;
      
      // Clear the input
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleAttachFile = () => {
    toast({
      title: "Feature Coming Soon",
      description: "File attachment will be available soon!",
    });
  };

  if (!currentMatch || !currentUser) return null;

  // Get messages to display - either from our local state (which gets real-time updates)
  // or fall back to the currentChat.messages if needed
  const messagesToDisplay = chatMessages.length > 0 ? 
    chatMessages : 
    (currentChat?.messages || []);

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
              <div>
                <SheetTitle className="mb-0">{currentMatch.name}</SheetTitle>
                <p className="text-xs text-gray-500">Matched via music</p>
                {isTyping && (
                  <span className="text-xs text-dhun-purple animate-pulse">typing...</span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleChat}>
              <X size={18} />
            </Button>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messagesToDisplay.map((msg) => {
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
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm'
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
          {isTyping && messagesToDisplay.length > 0 && messagesToDisplay[messagesToDisplay.length - 1]?.senderId !== currentMatch.id && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-[80%] shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleAttachFile}>
              <PaperclipIcon size={18} />
            </Button>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button variant="ghost" size="icon">
              <Smile size={18} />
            </Button>
            <Button onClick={handleSend} className="bg-dhun-purple hover:bg-dhun-purple/90">
              <Send size={18} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatRoom;
