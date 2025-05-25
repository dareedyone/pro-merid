import { model, Schema } from 'mongoose';

export interface Reaction {
  emoji: string;
  userId: string; // User UUID from Postgres
}

// export interface Message {
//   _id?: Types.ObjectId;
//   senderId: string;
//   text: string;
//   sentAt: Date;
//   editedAt?: Date;
//   isDeleted: boolean;
//   replyTo?: Types.ObjectId;
//   reactions: Reaction[];
// }

const ReactionSchema = new Schema({
  emoji: { type: String, required: true },
  userId: { type: String, required: true },
  userProfileId: { type: String, required: true },
});

export const MessageSchema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: String, required: true },
    senderProfileId: { type: String, required: true },
    text: { type: String, default: '' },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    reactions: { type: [ReactionSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

MessageSchema.index({ chatId: 1, sentAt: 1 });

export const Message = model('Message', MessageSchema);
