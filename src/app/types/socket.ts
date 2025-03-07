import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';
import { Socket } from 'net';

export interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

export interface SocketWithIO extends Socket {
  server: SocketServer;
}

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: SocketWithIO;
}

export interface SocketMessage {
  id: string;
  content: string;
  roomId: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface ServerToClientEvents {
  'message': (message: SocketMessage) => void;
  'userJoined': (data: { socketId: string; timestamp: string }) => void;
  'connection:degraded': () => void;
  'pong': () => void;
}

export interface ClientToServerEvents {
  'join': (roomId: string, callback: (response: { success: boolean; error?: string }) => void) => void;
  'message': (message: Omit<SocketMessage, 'timestamp'>, callback: (response: {
    success: boolean;
    messageData?: SocketMessage;
    timestamp?: string;
    error?: string;
  }) => void) => void;
  'ping': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  token: string;
}
