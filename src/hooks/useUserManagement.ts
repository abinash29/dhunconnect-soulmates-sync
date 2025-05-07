
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
      console.log('Registering connected user:', user.name);
      return [...prev, user];
    });
  };
  
  // Remove user when they disconnect
  const unregisterConnectedUser = (userId: string) => {
    console.log('Unregistering user:', userId);
    setConnectedUsers(prev => prev.filter(user => user.id !== userId));
  };
  
  // Completely disabled mock users function
  const addMockConnectedUsers = () => {
    // This function is completely disabled
    console.log("Mock users are completely disabled - only real matching is available");
    toast({
      title: "Real Matches Only",
      description: "The app is using only real user matching for a better experience.",
    });
  };

  return {
    connectedUsers,
    registerConnectedUser,
    unregisterConnectedUser,
    addMockConnectedUsers
  };
};
