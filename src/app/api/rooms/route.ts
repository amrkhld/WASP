import { NextResponse } from "next/server";
import dbConnect from "dbConnect";
import { Room } from "@/app/models/Room";
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();
    const rooms = await Room.find().select('name isProtected createdAt').sort({ createdAt: -1 });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, password, isProtected } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    const roomData: any = { name, isProtected };
    
    if (isProtected && password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      roomData.password = hashedPassword;
    }

    const newRoom = await Room.create(roomData);
    
    const { password: _, ...roomResponse } = newRoom.toObject();
    return NextResponse.json(roomResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
