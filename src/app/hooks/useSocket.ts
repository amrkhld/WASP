import { useEffect, useRef, useCallback, useState } from 'react';
import io, { Socket as ClientSocket } from 'socket.io-client';
import { Message, OutgoingMessage, MessageStatus } from '../types/message';
import { useSession } from 'next-auth/react';

let globalSocket: ClientSocket | null = null;
const MESSAGE_HISTORY_LIMIT = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_INTERVAL = 3000;
const ACK_TIMEOUT = 5000;

interface QueuedMessage extends OutgoingMessage {
  attempts: number;
  lastAttempt: number;
  status: MessageStatus;
  localId: string;
}

export const useSocket = (
  roomId: string, 
  onMessageReceived: (message: Message) => void
) => {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const currentRoomRef = useRef(roomId);
  const processedMessages = useRef<Set<string>>(new Set());
  const messageQueue = useRef<QueuedMessage[]>([]);
  const failedMessages = useRef<QueuedMessage[]>([]);
  const processingQueue = useRef(false);
  const reconnectionTimer = useRef<NodeJS.Timeout | null>(null);

  const initSocket = useCallback(() => {
    if (!globalSocket) {
      globalSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        path: '/socket.io',
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket'],
      });
    }
    return globalSocket;
  }, []);

  const logMessageStatus = useCallback((messageId: string, status: MessageStatus, error?: string) => {
    const timestamp = new Date().toISOString();
    switch (status) {
      case 'pending':
        console.log(`[${timestamp}] Message ${messageId}: Attempting to send...`);
        break;
      case 'sent':
        console.log(`[${timestamp}] Message ${messageId}: Successfully delivered ✓`);
        break;
      case 'failed':
        console.error(`[${timestamp}] Message ${messageId}: Failed to send - ${error || 'Unknown error'}`);
        break;
    }
  }, []);

  const handleReconnection = useCallback(() => {
    if (reconnectionAttempts >= RECONNECTION_ATTEMPTS) {
      console.error('[Socket] Max reconnection attempts reached');
      setIsReconnecting(false);
      return;
    }

    console.log(`[Socket] Attempting to reconnect (${reconnectionAttempts + 1}/${RECONNECTION_ATTEMPTS})`);
    globalSocket?.connect();
    setReconnectionAttempts(prev => prev + 1);
  }, [reconnectionAttempts]);

  const validateRoom = useCallback(async () => {
    if (!roomId || !globalSocket) return false;
    
    return new Promise<boolean>((resolve) => {
      globalSocket!.emit('join', roomId, (response: { success: boolean }) => {
        resolve(response.success);
      });
    });
  }, [roomId]);

  const processMessageQueue = useCallback(() => {
    if (processingQueue.current || !isConnected) return;
    processingQueue.current = true;

    const processNextMessage = async () => {
      if (!isConnected || messageQueue.current.length === 0) {
        processingQueue.current = false;
        return;
      }

      const msg = messageQueue.current[0];
      
      const handleResponse = (response: { success: boolean, error?: string, messageData?: any }) => {
        if (response.success) {
        
          messageQueue.current.shift();
          const messageToProcess = response.messageData || {
            ...msg,
            timestamp: new Date().toISOString()
          };
          onMessageReceived(messageToProcess);
        } else {
          console.error(`[Socket] Message failed:`, response.error);
          if (msg.attempts >= MAX_RETRIES) {
            messageQueue.current.shift();
            failedMessages.current.push(msg);
          }
        }
        
       
        processNextMessage();
      };

      try {
        msg.attempts += 1;
        globalSocket?.emit('message', msg, handleResponse);
      } catch (error) {
        console.error('[Socket] Error sending message:', error);
        processNextMessage();
      }
    };

    processNextMessage();
  }, [isConnected, onMessageReceived]);

  const retryFailedMessages = useCallback(() => {
    console.log(`[Socket] Retrying ${failedMessages.current.length} failed messages`);
    
  
    messageQueue.current = [
      ...failedMessages.current,
      ...messageQueue.current
    ];
    failedMessages.current = [];
    
    if (isConnected) {
      processMessageQueue();
    }
  }, [isConnected]);

  useEffect(() => {
    const socket = initSocket();
    currentRoomRef.current = roomId;

    const handleConnect = async () => {
      console.log('[Socket] Connected successfully');
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectionAttempts(0);
      
      if (reconnectionTimer.current) {
        clearTimeout(reconnectionTimer.current);
        reconnectionTimer.current = null;
      }
      
      if (roomId) {
        await validateRoom();
      }
      
      if (failedMessages.current.length > 0) {
        retryFailedMessages();
      }
      
      processMessageQueue();
    };

    const handleDisconnect = (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      
      
      if (reason === 'io client disconnect') {
        return;
      }
      
      setIsReconnecting(true);
      reconnectionTimer.current = setTimeout(handleReconnection, RECONNECTION_INTERVAL);
    };

    const handleConnectError = (error: Error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsReconnecting(true);
      
      if (!reconnectionTimer.current) {
        reconnectionTimer.current = setTimeout(handleReconnection, RECONNECTION_INTERVAL);
      }
    };

    const handleMessage = (message: Message) => {
      if (message.roomId === currentRoomRef.current) {
        if (!processedMessages.current.has(message.messageId)) {
          processedMessages.current.add(message.messageId);
          onMessageReceived(message);

     
          if (processedMessages.current.size > MESSAGE_HISTORY_LIMIT) {
            const [firstMessage] = processedMessages.current;
            processedMessages.current.delete(firstMessage);
          }
        }
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('message', handleMessage);

    if (roomId) socket.emit('join', roomId);

    return () => {
      if (reconnectionTimer.current) {
        clearTimeout(reconnectionTimer.current);
        reconnectionTimer.current = null;
      }
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('message', handleMessage);
    };
  }, [roomId, onMessageReceived, initSocket, processMessageQueue, handleReconnection, retryFailedMessages, validateRoom]);

  const sendMessage = useCallback((content: string) => {
    if (!session?.user) return;

    const messageData: QueuedMessage = {
      roomId,
      content,
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
      timestamp: new Date().toISOString(),
      messageId: crypto.randomUUID(),
      attempts: 0,
      lastAttempt: 0,
      status: 'pending',
      localId: crypto.randomUUID(),
    };

    messageQueue.current.push(messageData);
    processMessageQueue();
    
    return messageData.messageId;
  }, [roomId, session, processMessageQueue]);

  return { 
    sendMessage, 
    isConnected,
    isReconnecting
  };
};
