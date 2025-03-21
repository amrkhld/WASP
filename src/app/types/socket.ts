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

export interface NextApiResponseWithSocket extends NextApiResponse {
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
