import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { EventStatus } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(200)
  slug: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsBoolean()
  requiresRSVP?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttendees?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsBoolean()
  requiresRSVP?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttendees?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class EventResponseDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  coverImage?: string;
  images?: string[];
  startDate: Date;
  endDate: Date;
  location: string;
  locationLat?: number;
  locationLng?: number;
  tags?: string[];
  status: EventStatus;
  publishedAt?: Date;
  organizerId: string;
  organizerName?: string;
  requiresRSVP: boolean;
  maxAttendees?: number;
  rsvpCount: number;
  viewCount: number;
  featured: boolean;
  externalUrl?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EventListResponseDto {
  events: EventResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
