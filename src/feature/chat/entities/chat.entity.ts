import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ProfileType } from 'src/common/types/enums/other.enum';

export type ChatDocument = HydratedDocument<Chat>;

export enum ChatStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
  DELETED = 'deleted',
}

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true })
  matchId: string; // Reference to ProfileInteraction match

  @Prop({ required: true, enum: ProfileType })
  profileType: ProfileType;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar?: string;

  @Prop({ type: [String], required: true })
  participantIds: string[]; // User IDs

  @Prop({ type: [String], required: true })
  profileIds: string[]; // Profile IDs (DatingProfile, FriendProfile, etc.)

  @Prop({ required: true })
  createdBy: string; // User ID who created the chat

  @Prop({ enum: ChatStatus, default: ChatStatus.ACTIVE })
  status: ChatStatus;

  @Prop({ type: Date, default: null })
  lastMessageAt?: Date;

  @Prop({ type: String, default: null })
  lastMessageId?: string;

  @Prop({ type: Map, of: Date, default: {} })
  lastSeen: Map<string, Date>; // userId -> lastSeen timestamp

  @Prop({ type: Map, of: Number, default: {} })
  unreadCount: Map<string, number>; // userId -> unread count

  @Prop({ type: Date, default: null })
  archivedAt?: Date;

  @Prop({ type: String, default: null })
  archivedBy?: string;

  @Prop({ type: Date, default: null })
  blockedAt?: Date;

  @Prop({ type: String, default: null })
  blockedBy?: string;

  @Prop({ type: String, default: null })
  blockReason?: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// Indexes for performance
ChatSchema.index({ matchId: 1, profileType: 1 }, { unique: true });
ChatSchema.index({ participantIds: 1, status: 1 });
ChatSchema.index({ createdBy: 1, status: 1 });
ChatSchema.index({ lastMessageAt: -1 });
ChatSchema.index({ createdAt: -1 });
