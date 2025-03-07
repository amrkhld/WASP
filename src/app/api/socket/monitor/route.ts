import { NextResponse } from 'next/server';
import { socketMonitor } from '@/app/utils/socketMonitor';
import { Server as SocketIOServer } from 'socket.io';

// Extend the global namespace
declare global {
  // eslint-disable-next-line no-var
  var socketIOServer: SocketIOServer | undefined;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const sockets = Array.from(global.socketIOServer?.sockets?.sockets || new Map()).map(([id]) => id);
    const metrics = sockets.map(socketId => ({
      socketId,
      metrics: socketMonitor.getMetrics(socketId),
      averageLatency: socketMonitor.getAverageLatency(socketId)
    }));

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      activeConnections: sockets.length,
      metrics
    });
  } catch (error) {
    console.error('Error fetching socket metrics:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}