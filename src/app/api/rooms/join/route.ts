import { NextResponse } from "next/server";
import dbConnect from "dbConnect";
import { Room } from "@/app/models/Room";
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { roomId, password } = await request.json();

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    const room = await Room.findById(roomId);
    
    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    if (room.isProtected) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required" },
          { status: 401 }
        );
      }

      const passwordMatch = await bcrypt.compare(password, room.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      room: {
        _id: room._id,
        name: room.name,
        isProtected: room.isProtected
      }
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}
