import { NextRequest, NextResponse } from "next/server";
import dbConnect from "dbConnect";
import { Message } from "@/app/models/Message";

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    await dbConnect();
    
    const { roomId } = await params;
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required and must be a valid string' },
        { status: 400 }
      );
    }

    const messages = await Message.find({ roomId })
      .sort({ timestamp: 1 })
      .exec();
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
