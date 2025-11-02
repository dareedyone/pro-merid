import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  MaxLength,
} from 'class-validator';
import { SuccessStoryStatus } from '../entities/success-story.entity';

export class CreateSuccessStoryDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(200)
  slug: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsString()
  partner1Name: string;

  @IsString()
  partner2Name: string;

  @IsOptional()
  @IsString()
  partner1Avatar?: string;

  @IsOptional()
  @IsString()
  partner2Avatar?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  matchDate?: string;

  @IsOptional()
  @IsDateString()
  relationshipDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(SuccessStoryStatus)
  status?: SuccessStoryStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;
}

export class UpdateSuccessStoryDto {
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
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  partner1Name?: string;

  @IsOptional()
  @IsString()
  partner2Name?: string;

  @IsOptional()
  @IsString()
  partner1Avatar?: string;

  @IsOptional()
  @IsString()
  partner2Avatar?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  matchDate?: string;

  @IsOptional()
  @IsDateString()
  relationshipDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(SuccessStoryStatus)
  status?: SuccessStoryStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;
}

export class SuccessStoryResponseDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  images?: string[];
  partner1Name: string;
  partner2Name: string;
  partner1Avatar?: string;
  partner2Avatar?: string;
  location?: string;
  matchDate?: Date;
  relationshipDate?: Date;
  tags?: string[];
  status: SuccessStoryStatus;
  publishedAt?: Date;
  authorId: string;
  viewCount: number;
  likeCount: number;
  featured: boolean;
  anonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SuccessStoryListResponseDto {
  stories: SuccessStoryResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
