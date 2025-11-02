import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CallDocument = HydratedDocument<Call>;

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum CallStatus {
  INITIATING = 'initiating',
  RINGING = 'ringing',
  CONNECTED = 'connected',
  ENDED = 'ended',
  MISSED = 'missed',
  DECLINED = 'declined',
  BUSY = 'busy',
}

@Schema({ timestamps: true })
export class Call {
  @Prop({ type: String, ref: 'Chat', required: true })
  chatId: string; // Reference to existing Chat

  @Prop({ required: true })
  callerId: string; // User ID who initiated the call

  @Prop({ required: true })
  callerProfileId: string;

  @Prop({ required: true, type: [String] })
  participantIds: string[]; // All participant user IDs

  @Prop({ required: true, type: [String] })
  participantProfileIds: string[]; // All participant profile IDs

  @Prop({ enum: CallType, required: true })
  type: CallType;

  @Prop({ enum: CallStatus, default: CallStatus.INITIATING })
  status: CallStatus;

  @Prop({ type: Date, default: null })
  startedAt?: Date;

  @Prop({ type: Date, default: null })
  endedAt?: Date;

  @Prop({ type: Number, default: 0 })
  duration: number; // in seconds

  @Prop({ type: String, default: null })
  endReason?: string; // 'hung_up', 'declined', 'missed', 'busy', etc.

  @Prop({ type: String, required: true })
  provider: string; // Call provider name: 'agora', 'webrtc', 'twilio', 'daily', etc.

  @Prop({ type: String, required: true })
  channelName: string; // Provider channel/room name for the call

  @Prop({ type: String, required: true })
  token: string; // Provider authentication token

  @Prop({ type: Number, default: null })
  callerUid?: number; // Provider UID for the caller

  @Prop({ type: Map, of: Number, default: {} })
  participantUids: Map<string, number>; // userId -> provider UID mapping

  @Prop({ type: Boolean, default: false })
  isRecording: boolean; // Whether the call is being recorded

  @Prop({ type: String, default: null })
  recordingUrl?: string; // URL to the call recording (if any)
}

export const CallSchema = SchemaFactory.createForClass(Call);

// Indexes for performance
CallSchema.index({ chatId: 1, createdAt: -1 });
CallSchema.index({ callerId: 1, createdAt: -1 });
CallSchema.index({ participantIds: 1, status: 1 });
CallSchema.index({ status: 1, createdAt: -1 });
CallSchema.index({ channelName: 1 }, { unique: true });
