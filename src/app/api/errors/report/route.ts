import { NextResponse } from 'next/server';
import { logger } from '../../../utils/logger';

export async function POST(request: Request) {
  try {
    const errorReport = await request.json();
    
    // Log error details
    logger.error('Client error reported', {
      ...errorReport,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      source: 'client'
    });

    if (process.env.NODE_ENV === 'production') {
      // In production, you could forward these errors to your error tracking service
      // await sendToErrorTrackingService(errorReport);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error('Failed to process error report', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}