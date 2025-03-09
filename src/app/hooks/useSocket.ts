'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import socketio from 'socket.io-client';
import type { Message } from '../types/message';

interface UseSocketProps {
  roomId: string;
  userId: string;
}

interface MessageQueue {
  [key: string]: {
    message: Message;
    status: 'pending' | 'delivered' | 'failed';
    timestamp: number;
  };
}

export const useSocket = ({ roomId, userId }: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageQueue, setMessageQueue] = useState<MessageQueue>({});
  const socketRef = useRef<ReturnType<typeof socketio> | null>(null);
  const messageCountRef = useRef(0);

  const processMessageQueue = useCallback((currentTime: number) => {
    setMessageQueue(prevQueue => {
      const newQueue = { ...prevQueue };
      let hasChanges = false;

      Object.entries(newQueue).forEach(([, entry]) => {
        if (entry.status === 'pending' && currentTime - entry.timestamp > 5000) {
          entry.status = 'failed';
          hasChanges = true;
        }
      });

      return hasChanges ? newQueue : prevQueue;
    });
  }, []);

  const connect = useCallback(() => {
    if (!socketRef.current) {
      const socket = socketio(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        query: { roomId, userId }
      });

      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('messages', (messages: Message[]) => {
        setMessages(messages);
      });

      socket.on('message', (message: Message) => {
        setMessages(prev => [...prev, message]);
        messageCountRef.current += 1;
      });

      socket.on('messageAck', (messageId: string) => {
        setMessageQueue(prev => {
          const newQueue = { ...prev };
          if (newQueue[messageId]) {
            newQueue[messageId].status = 'delivered';
          }
          return newQueue;
        });
      });

      socketRef.current = socket;
    }
  }, [roomId, userId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((content: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message: Message = {
        id: messageId,
        content,
        userId,
        userName: 'User', // This should be set by the server
        roomId,
        timestamp: new Date().toISOString(),
        messageId
      };

      setMessageQueue(prev => ({
        ...prev,
        [messageId]: {
          message,
          status: 'pending',
          timestamp: Date.now()
        }
      }));

      socketRef.current.emit('message', message, (response: { success: boolean }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error('Failed to send message'));
        }
      });
    });
  }, [roomId, userId]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    const interval = setInterval(() => {
      processMessageQueue(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [processMessageQueue]);

  return {
    isConnected,
    messages,
    sendMessage,
    messageQueue,
    messageCount: messageCountRef.current
  };
};
