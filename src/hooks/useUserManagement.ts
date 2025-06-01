
import { useState } from 'react';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useUserManagement = () => {
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);

  // Register a new connected user (only real matched users, excluding current user)
  const registerConnectedUser = (user: User, currentUserId?: string) => {
    console.log('Attempting to register connected user:', user.name, 'Current user ID:', currentUserId);
    
    // Don't add the current user to their own connected users list
    if (currentUserId && user.id === currentUserId) {
      console.log('Skipping registration - user is current user');
      return;
    }
    
    setConnectedUsers(prev => {
      // Check if user is already registered
      const existingUser = prev.find(existingUser => existingUser.id === user.id);
      if (existingUser) {
        console.log('User already registered:', user.name);
        return prev;
      }
      
      console.log('Successfully registering matched user:', user.name);
      const updatedUsers = [...prev, user];
      console.log('Updated connected users list:', updatedUsers.map(u => u.name));
      return updatedUsers;
    });
  };
  
  // Remove user when they disconnect
  const unregisterConnectedUser = (userId: string) => {
    console.log('Unregistering user:', userId);
    setConnectedUsers(prev => {
      const updatedUsers = prev.filter(user => user.id !== userId);
      console.log('Updated connected users after removal:', updatedUsers.map(u => u.name));
      return updatedUsers;
    });
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
