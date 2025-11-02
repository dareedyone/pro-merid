import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SuccessStoryDocument = HydratedDocument<SuccessStory>;

export enum SuccessStoryStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class SuccessStory {
  @Prop({ required: true })
  title: string; // Story headline

  @Prop({ required: true })
  slug: string; // URL-friendly identifier

  @Prop({ required: true, type: String })
  content: string; // Story content (HTML or markdown)

  @Prop()
  excerpt?: string; // Short summary for preview

  @Prop()
  coverImage?: string; // URL to cover image (couple photo, etc.)

  @Prop({ type: [String], default: [] })
  images?: string[]; // Additional images

  @Prop({ type: String, required: true })
  partner1Name: string; // First partner's name (anonymized or with permission)

  @Prop({ type: String, required: true })
  partner2Name: string; // Second partner's name (anonymized or with permission)

  @Prop()
  partner1Avatar?: string; // First partner's avatar

  @Prop()
  partner2Avatar?: string; // Second partner's avatar

  @Prop()
  location?: string; // Where they met/are located

  @Prop({ type: Date, default: null })
  matchDate?: Date; // When they matched

  @Prop({ type: Date, default: null })
  relationshipDate?: Date; // When they became a couple

  @Prop({ type: [String], default: [] })
  tags?: string[]; // Tags (e.g., "long-distance", "married", etc.)

  @Prop({ enum: SuccessStoryStatus, default: SuccessStoryStatus.DRAFT })
  status: SuccessStoryStatus;

  @Prop({ type: Date, default: null })
  publishedAt?: Date; // When story was published

  @Prop({ type: String, required: true })
  authorId: string; // Admin/User ID who created this

  @Prop({ type: Number, default: 0 })
  viewCount: number; // Number of times viewed

  @Prop({ type: Number, default: 0 })
  likeCount: number; // Number of likes

  @Prop({ type: Boolean, default: false })
  featured: boolean; // Whether to feature on homepage

  @Prop({ type: Boolean, default: true })
  anonymous: boolean; // Whether to show names or keep anonymous

  @Prop({ type: Map, of: String, default: {} })
  metadata?: Map<string, string>; // Additional metadata
}

export const SuccessStorySchema = SchemaFactory.createForClass(SuccessStory);

// Indexes for performance
SuccessStorySchema.index({ slug: 1 }, { unique: true });
SuccessStorySchema.index({ status: 1, publishedAt: -1 });
SuccessStorySchema.index({ status: 1, featured: 1, publishedAt: -1 });
SuccessStorySchema.index({ tags: 1 });
SuccessStorySchema.index({ authorId: 1 });
