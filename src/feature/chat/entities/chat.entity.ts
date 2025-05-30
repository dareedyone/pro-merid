import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;

@Schema({ timestamps: true })
export class Chat {
  @Prop()
  name: string;

  @Prop()
  avatar: string;

  @Prop({ unique: true })
  matchId: number;

  @Prop({ type: [String], default: [] })
  participantIds: string[];

  @Prop({ type: [String], default: [] })
  profileIds: string[];

  @Prop()
  createdBy: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
ChatSchema.index({ matchId: 1 }, { unique: true });
