
import { useState } from 'react';
import { User, Chat, Message } from '@/types';
import { sendChatMessage } from '@/services/musicApi';

type UseMessageHandlingProps = {
  currentUser: User | null;
};

export const useMessageHandling = ({ currentUser }: UseMessageHandlingProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  
  // Send a chat message
  const sendMessage = async (content: string) => {
    if (!currentChat || !currentUser) return;
    
    console.log("Sending message:", content);
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: currentChat.users.find(id => id !== currentUser.id) || null,
      content,
      timestamp: new Date(),
    };
    
    const updatedChat: Chat = {
      ...currentChat,
      messages: [...currentChat.messages, newMessage]
    };
    
    setCurrentChat(updatedChat);
    
    // If this is a real match (has a UUID match ID), save the message to the database
    if (currentChat.matchId.length > 20) { // Simple check for UUID format
      await sendChatMessage(
        currentChat.matchId, 
        currentUser.id, 
        content
        // Removed the fourth parameter (receiver_id) as it's now handled in the musicApi service
      );
    }
  };
  
  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  return {
    chatOpen,
    currentChat,
    setChatOpen,
    setCurrentChat,
    sendMessage,
    toggleChat
  };
};
