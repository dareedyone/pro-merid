// src/support-chat/schemas/support-chat.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SupportChatDocument = HydratedDocument<SupportChat>;

@Schema({ _id: false })
export class Attachment {
  @Prop({ required: true })
  url: string;

  @Prop()
  filename?: string;

  @Prop()
  mimetype?: string;

  @Prop()
  size?: number;
}

@Schema({ _id: false })
export class Message {
  //   @Prop({ required: true, enum: ['user', 'agent', 'system'] })
  //   senderType: 'user' | 'agent' | 'system';

  @Prop({ required: true })
  senderId: string; // UUID from Postgres

  @Prop({ type: String })
  text?: string;

  @Prop({ type: [Attachment], default: [] })
  attachments: Attachment[];

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class SupportChat {
  @Prop({ required: true })
  userId: string; // UUID from Postgres

  @Prop()
  anchorId?: string; // optional: UUID

  @Prop()
  agentId?: string; // support agent UUID

  @Prop({ enum: ['open', 'resolved', 'closed', 'escalated'], default: 'open' })
  status: 'open' | 'resolved' | 'closed' | 'escalated';

  @Prop({ type: [Message], default: [] })
  messages: Message[];
}

export const SupportChatSchema = SchemaFactory.createForClass(SupportChat);
