import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

const SocketContext = createContext(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('authToken'),
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('notification', (data) => {
      toast({
        title: data.title || 'New Notification',
        description: data.message,
        variant: data.type === 'alert' ? 'destructive' : 'default',
      });
    });

    newSocket.on('kit_issued', (data) => {
      toast({
        title: 'Kit Issued',
        description: `${data.kitName} has been issued to ${data.userName}`,
        variant: 'success',
      });
    });

    newSocket.on('kit_returned', (data) => {
      toast({
        title: 'Kit Returned',
        description: `${data.kitName} has been returned`,
        variant: 'success',
      });
    });

    newSocket.on('low_stock_alert', (data) => {
      toast({
        title: 'Low Stock Alert',
        description: `${data.kitName} is running low (${data.quantity} remaining)`,
        variant: 'warning',
      });
    });

    newSocket.on('due_reminder', (data) => {
      toast({
        title: 'Return Reminder',
        description: `Your ${data.kitName} is due on ${new Date(data.dueDate).toLocaleDateString()}`,
        variant: 'warning',
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, toast]);

  const joinRoom = useCallback((room) => {
    if (socket) {
      socket.emit('join_room', room);
    }
  }, [socket]);

  const leaveRoom = useCallback((room) => {
    if (socket) {
      socket.emit('leave_room', room);
    }
  }, [socket]);

  const emitEvent = useCallback((event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  }, [socket]);

  const value = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    emitEvent,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
