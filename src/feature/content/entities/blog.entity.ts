import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BlogDocument = HydratedDocument<Blog>;

export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  slug: string; // URL-friendly identifier

  @Prop({ required: true, type: String })
  content: string; // HTML or markdown content

  @Prop()
  excerpt?: string; // Short summary for preview

  @Prop()
  coverImage?: string; // URL to cover image

  @Prop({ type: [String], default: [] })
  images?: string[]; // Additional images

  @Prop({ type: [String], default: [] })
  tags?: string[]; // Tags for categorization

  @Prop({ type: [String], default: [] })
  categories?: string[]; // Categories

  @Prop({ enum: BlogStatus, default: BlogStatus.DRAFT })
  status: BlogStatus;

  @Prop({ type: Date, default: null })
  publishedAt?: Date; // When content was published

  @Prop({ type: String, required: true })
  authorId: string; // Admin/User ID who created this

  @Prop()
  authorName?: string; // Author name for display

  @Prop({ type: Number, default: 0 })
  viewCount: number; // Number of times viewed

  @Prop({ type: Number, default: 0 })
  likeCount: number; // Number of likes (if implemented)

  @Prop({ type: Boolean, default: false })
  featured: boolean; // Whether to feature on homepage

  @Prop({ type: Boolean, default: true })
  allowComments: boolean; // Whether to allow comments

  @Prop({ type: Date, default: null })
  scheduledPublishAt?: Date; // For scheduling posts

  @Prop({ type: Map, of: String, default: {} })
  metadata?: Map<string, string>; // Additional metadata
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

// Indexes for performance
BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ status: 1, featured: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ categories: 1 });
BlogSchema.index({ authorId: 1 });
