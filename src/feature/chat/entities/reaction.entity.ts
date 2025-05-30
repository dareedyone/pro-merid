import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReactionDocument = HydratedDocument<Reaction>;

@Schema()
export class Reaction {
  @Prop({ type: String, required: true })
  emoji: string;

  @Prop({ type: String, required: true })
  senderId: string;

  @Prop({ type: String, required: true })
  senderProfileId: string;
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
