import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../dbConnect';
import { logger } from '../../utils/logger';

interface Metrics {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  dbConnections: number;
  activeUsers: number;
  messageRate: number;
  errorRate: number;
  timestamp: string;
}

let lastMessageCount = 0;
let lastErrorCount = 0;
let lastCheckTime = Date.now();

export async function GET() {
  try {
    const client = await connectToDatabase();
    const db = client.db();

    // Calculate message rate
    const now = Date.now();
    const timeDiff = (now - lastCheckTime) / 1000; // Convert to seconds
    const currentMessageCount = await db.collection('messages').countDocuments();
    const messageRate = (currentMessageCount - lastMessageCount) / timeDiff;
    lastMessageCount = currentMessageCount;

    // Calculate error rate
    const errorLogs = await logger.getRecentErrors();
    const currentErrorCount = errorLogs.length;
    const errorRate = (currentErrorCount - lastErrorCount) / timeDiff;
    lastErrorCount = currentErrorCount;
    lastCheckTime = now;

    // Get active users (connected in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await db.collection('users')
      .countDocuments({
        lastSeen: { $gte: fiveMinutesAgo }
      });

    const metrics: Metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      dbConnections: client.topology?.connections?.length || 0,
      activeUsers,
      messageRate,
      errorRate,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(metrics, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    logger.error('Failed to collect metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}