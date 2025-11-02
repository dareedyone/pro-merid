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
import { BlogStatus } from '../entities/blog.entity';

export class CreateBlogDto {
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string;
}

export class UpdateBlogDto {
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
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string;
}

export class BlogResponseDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  categories?: string[];
  status: BlogStatus;
  publishedAt?: Date;
  authorId: string;
  authorName?: string;
  viewCount: number;
  likeCount: number;
  featured: boolean;
  allowComments: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class BlogListResponseDto {
  blogs: BlogResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
