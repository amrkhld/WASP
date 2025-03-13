'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { retryOperation } from '../utils/retryOperation';
import { logger } from '../utils/logger';

interface UseSocketProps {
  roomId: string;
  userId: string;
}

interface MessageQueue {
  [key: string]: {
    content: string;
    timestamp: string;
    status: 'pending' | 'delivered' | 'failed';
    retryCount: number;
  };
}

const MAX_OFFLINE_MESSAGES = 100;
const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;

export const useSocket = ({ roomId, userId }: UseSocketProps) => {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageQueue, setMessageQueue] = useState<MessageQueue>({});
  const socketRef = useRef<Socket | null>(null);
  const offlineMessagesRef = useRef<any[]>([]);

  const connect = useCallback(async () => {
    if (!session) return;

    try {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        reconnection: true,
        reconnectionAttempts: RECONNECTION_ATTEMPTS,
        reconnectionDelay: RECONNECTION_DELAY,
        reconnectionDelayMax: RECONNECTION_DELAY * 2,
        timeout: 10000,
        query: { roomId, userId }
      });

      socket.on('connect', () => {
        setIsConnected(true);
        setIsReconnecting(false);
        processOfflineMessages();
      });

      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        logger.warn('Socket disconnected', { reason });
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        setIsReconnecting(true);
        logger.info('Attempting to reconnect', { attemptNumber });
      });

      socket.on('reconnect_failed', () => {
        setIsReconnecting(false);
        logger.error('Failed to reconnect after maximum attempts');
      });

      socket.on('message', (message) => {
        setMessages((prev) => [...prev, message]);
        saveMessageToLocalStorage(message);
      });

      socketRef.current = socket;

      // Load cached messages from localStorage
      loadCachedMessages();
    } catch (error) {
      logger.error('Socket connection error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setIsConnected(false);
    }
  }, [roomId, userId, session]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const saveMessageToLocalStorage = (message: any) => {
    try {
      const cachedMessages = JSON.parse(localStorage.getItem(`room_${roomId}`) || '[]');
      cachedMessages.push(message);
      
      // Limit cached messages
      if (cachedMessages.length > MAX_OFFLINE_MESSAGES) {
        cachedMessages.shift();
      }
      
      localStorage.setItem(`room_${roomId}`, JSON.stringify(cachedMessages));
    } catch (error) {
      logger.error('Failed to cache message', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const loadCachedMessages = () => {
    try {
      const cachedMessages = JSON.parse(localStorage.getItem(`room_${roomId}`) || '[]');
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }
    } catch (error) {
      logger.error('Failed to load cached messages', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const processOfflineMessages = async () => {
    if (offlineMessagesRef.current.length === 0) return;

    for (const message of offlineMessagesRef.current) {
      try {
        await sendMessage(message.content);
        const index = offlineMessagesRef.current.indexOf(message);
        offlineMessagesRef.current.splice(index, 1);
      } catch (error) {
        logger.error('Failed to send offline message', {
          error: error instanceof Error ? error.message : 'Unknown error',
          message
        });
      }
    }
  };

  const sendMessage = async (content: string) => {
    const messageId = Date.now().toString();
    const messageData = {
      id: messageId,
      content,
      userId,
      roomId,
      timestamp: new Date().toISOString()
    };

    setMessageQueue(prev => ({
      ...prev,
      [messageId]: {
        content,
        timestamp: messageData.timestamp,
        status: 'pending',
        retryCount: 0
      }
    }));

    if (!isConnected) {
      offlineMessagesRef.current.push(messageData);
      saveMessageToLocalStorage({
        ...messageData,
        offline: true
      });
      return;
    }

    try {
      await retryOperation(async () => {
        return new Promise((resolve, reject) => {
          if (!socketRef.current?.connected) {
            reject(new Error('Socket not connected'));
            return;
          }

          socketRef.current.emit('message', messageData, (response: any) => {
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error || 'Failed to send message'));
            }
          });
        });
      }, {
        maxAttempts: 3,
        shouldRetry: (error) => {
          return error.message === 'Socket not connected' || error.message.includes('timeout');
        }
      });

      setMessageQueue(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          status: 'delivered'
        }
      }));
    } catch (error) {
      logger.error('Failed to send message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      });

      setMessageQueue(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          status: 'failed'
        }
      }));

      if (!isConnected) {
        offlineMessagesRef.current.push(messageData);
      }
    }
  };

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isReconnecting,
    messages,
    sendMessage,
    messageQueue
  };
};
