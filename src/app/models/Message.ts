import mongoose, { Schema } from 'mongoose';

export interface IMessage {
  content: string;
  roomId: string;
  userId: string;
  userName?: string;
  timestamp: Date;
  messageId: string; 
}

const messageSchema = new Schema<IMessage>({
  content: { type: String, required: true },
  roomId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String },
  messageId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);