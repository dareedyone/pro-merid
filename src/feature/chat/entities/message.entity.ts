import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Chat } from './chat.entity';
import { Reaction, ReactionSchema } from './reaction.entity';

export type MessageDocument = HydratedDocument<Message>;

// const ReactionSchema = new MongooseSchema(
//   {
//     emoji: { type: String, required: true },
//     userId: { type: String, required: true },
//     userProfileId: { type: String, required: true },
//   },
//   { _id: false },
// );

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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Message', default: null })
  replyTo: Message;

  @Prop({ type: [ReactionSchema], default: [] })
  reactions: Reaction[];

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ chat: 1, createdAt: 1 });
