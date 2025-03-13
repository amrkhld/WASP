import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../dbConnect';
import { logger } from '../../utils/logger';

export async function GET() {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'unknown'
  };

  try {
    // Check database connection
    const client = await connectToDatabase();
    await client.db().command({ ping: 1 });

    // Check Socket.IO server
    const socketResponse = await fetch('http://localhost:3001/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!socketResponse.ok) {
      throw new Error('Socket server health check failed');
    }

    const socketHealth = await socketResponse.json();

    healthCheck.status = 'healthy';
    healthCheck.services = {
      database: 'connected',
      socket: socketHealth
    };

    return NextResponse.json(healthCheck, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    healthCheck.status = 'unhealthy';
    healthCheck.error = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(healthCheck, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}