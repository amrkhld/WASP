import { NextResponse } from 'next/server';
import { socketLogger } from '@/app/utils/socketLogger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const socketId = searchParams.get('socketId') || undefined;
    const event = searchParams.get('event') || undefined;

    const logs = socketLogger.getLogs(limit, { socketId, event });

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      logs
    });
  } catch (error) {
    console.error('Error fetching socket logs:', error);
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