
import { useState } from 'react';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useUserManagement = () => {
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);

  // Register a new connected user (only real matched users, excluding current user)
  const registerConnectedUser = (user: User, currentUserId?: string) => {
    // Don't add the current user to their own connected users list
    if (currentUserId && user.id === currentUserId) {
      return;
    }
    
    setConnectedUsers(prev => {
      // Check if user is already registered
      if (prev.some(existingUser => existingUser.id === user.id)) {
        return prev;
      }
      console.log('Registering matched user:', user.name);
      return [...prev, user];
    });
  };
  
  // Remove user when they disconnect
  const unregisterConnectedUser = (userId: string) => {
    console.log('Unregistering user:', userId);
    setConnectedUsers(prev => prev.filter(user => user.id !== userId));
  };
  
  // Mock users function disabled - only real matches allowed
  const addMockConnectedUsers = () => {
    console.log("Mock users are disabled - only real matched users are shown");
    toast({
      title: "Real Matches Only",
      description: "Connected Users shows only people you've actually matched with.",
    });
  };

  return {
    connectedUsers,
    registerConnectedUser,
    unregisterConnectedUser,
    addMockConnectedUsers
  };
};
