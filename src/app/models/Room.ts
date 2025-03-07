import mongoose from 'mongoose';

export interface IRoom {
  name: string;
  password?: string;
  createdAt: Date;
  isProtected: boolean;
}

const roomSchema = new mongoose.Schema<IRoom>({
  name: { type: String, required: true },
  password: { type: String },
  isProtected: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Room = mongoose.models.Room || mongoose.model<IRoom>('Room', roomSchema);