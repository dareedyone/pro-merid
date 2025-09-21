import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Chat } from './chat.entity';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  LOCATION = 'location',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Schema({ _id: false })
export class Reaction {
  @Prop({ required: true })
  emoji: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userProfileId: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ _id: false })
export class MessageRead {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userProfileId: string;

  @Prop({ default: Date.now })
  readAt: Date;
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chat', required: true })
  chat: Chat;

  @Prop({ type: String, required: true })
  senderId: string;

  @Prop({ type: String, required: true })
  senderProfileId: string;

  @Prop({ type: String, default: '' })
  text: string;

  @Prop({ enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Message', default: null })
  replyTo?: Message;

  @Prop({ type: [Reaction], default: [] })
  reactions: Reaction[];

  @Prop({ type: [MessageRead], default: [] })
  readBy: MessageRead[];

  @Prop({ enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Prop({ type: String, default: null })
  mediaUrl?: string;

  @Prop({ type: String, default: null })
  mediaType?: string;

  @Prop({ type: Number, default: null })
  mediaSize?: number;

  @Prop({ type: String, default: null })
  thumbnailUrl?: string;

  @Prop({ type: Object, default: null })
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: String, default: null })
  deletedBy?: string;

  @Prop({ type: String, default: null })
  editHistory?: string; // Previous text content

  @Prop({ type: Date, default: null })
  editedAt?: Date;

  @Prop({ type: Boolean, default: false })
  isEdited: boolean;

  @Prop({ type: String, default: null })
  systemMessage?: string; // For system messages like "User joined", "User left", etc.
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for performance
MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ status: 1, createdAt: -1 });
MessageSchema.index({ type: 1, createdAt: -1 });
MessageSchema.index({ isDeleted: 1, createdAt: -1 });
