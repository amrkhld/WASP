import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/auth";
import dbConnect from "dbConnect";
import { Message } from "@/app/models/Message";
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { content, roomId } = await request.json();
    
    const timestamp = new Date().toISOString();
    const messageId = crypto.randomUUID();  
    
    const newMessage = new Message({
      content,
      roomId,
      userId: session.user.id,
      userName: session.user.name,
      timestamp,
      messageId
    });
    
    await newMessage.save();
    return NextResponse.json({
      ...newMessage.toObject(),
      timestamp,
      id: newMessage._id.toString(),
      messageId  
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error sending message" },
      { status: 500 }
    );
  }
}
