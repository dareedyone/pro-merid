import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  slug: string; // URL-friendly identifier

  @Prop({ required: true, type: String })
  description: string; // Event description

  @Prop()
  shortDescription?: string; // Short summary for preview

  @Prop()
  coverImage?: string; // URL to cover image

  @Prop({ type: [String], default: [] })
  images?: string[]; // Additional images

  @Prop({ type: Date, required: true })
  startDate: Date; // Event start date/time

  @Prop({ type: Date, required: true })
  endDate: Date; // Event end date/time

  @Prop({ type: String, required: true })
  location: string; // Event location (address or venue name)

  @Prop()
  locationLat?: number; // Latitude for mapping

  @Prop()
  locationLng?: number; // Longitude for mapping

  @Prop({ type: [String], default: [] })
  tags?: string[]; // Tags for categorization

  @Prop({ enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;

  @Prop({ type: Date, default: null })
  publishedAt?: Date; // When event was published

  @Prop({ type: String, required: true })
  organizerId: string; // Admin/User ID who created this

  @Prop()
  organizerName?: string; // Organizer name for display

  @Prop({ type: Boolean, default: false })
  requiresRSVP: boolean; // Whether RSVP is required

  @Prop({ type: Number, default: null })
  maxAttendees?: number; // Maximum number of attendees

  @Prop({ type: Number, default: 0 })
  rsvpCount: number; // Current number of RSVPs

  @Prop({ type: Number, default: 0 })
  viewCount: number; // Number of times viewed

  @Prop({ type: Boolean, default: false })
  featured: boolean; // Whether to feature on homepage

  @Prop()
  externalUrl?: string; // Link to external event page

  @Prop({ type: String, default: null })
  timezone?: string; // Event timezone

  @Prop({ type: Map, of: String, default: {} })
  metadata?: Map<string, string>; // Additional metadata
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Indexes for performance
EventSchema.index({ slug: 1 }, { unique: true });
EventSchema.index({ status: 1, startDate: 1 });
EventSchema.index({ status: 1, featured: 1, startDate: 1 });
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ organizerId: 1 });
EventSchema.index({ locationLat: 1, locationLng: 1 }); // For location-based queries
