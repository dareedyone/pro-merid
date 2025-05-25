import { Schema, model } from 'mongoose';

// export interface Chat extends Document {
//   matchId: string; // UUID from Postgres
//   participants: string[]; // User UUIDs
//   messages: Message[];
//   createdAt: Date;
//   updatedAt: Date;
// }

export const ChatSchema = new Schema(
  {
    name: { type: String },
    avatar: { type: String },
    matchId: { type: String, unique: true },
    participantIds: [{ type: String }],
    profileIds: [{ type: String }],
    createdBy: { type: String },
  },
  { timestamps: true },
);

ChatSchema.index({ matchId: 1 });
// ChatSchema.index({ 'messages._id': 1 });

export const Chat = model('Chat', ChatSchema);
