
import { useState } from 'react';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useUserManagement = () => {
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);

  // Register a new connected user
  const registerConnectedUser = (user: User) => {
    setConnectedUsers(prev => {
      // Check if user is already registered
      if (prev.some(existingUser => existingUser.id === user.id)) {
        return prev;
      }
      return [...prev, user];
    });
  };
  
  // Remove user when they disconnect
  const unregisterConnectedUser = (userId: string) => {
    setConnectedUsers(prev => prev.filter(user => user.id !== userId));
  };
  
  // Mock function to simulate multiple connected users for testing
  const addMockConnectedUsers = () => {
    console.log("Mock users disabled - using only real users");
    toast({
      title: "Mock Users Disabled",
      description: "The app is now using only real user matching.",
    });
  };

  return {
    connectedUsers,
    registerConnectedUser,
    unregisterConnectedUser,
    addMockConnectedUsers
  };
};
