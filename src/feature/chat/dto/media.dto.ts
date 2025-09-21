import { IsString, IsOptional, IsEnum, IsNumber, MaxLength, IsUUID } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class UploadMediaDto {
  @IsString()
  @IsUUID()
  chatId: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsString()
  @MaxLength(2000, { message: 'Caption cannot exceed 2000 characters' })
  caption?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  replyTo?: string;
}

export class MediaUploadResponseDto {
  messageId: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: string;
  mediaSize: number;
  caption?: string;
  uploadedAt: Date;
}

export class MediaMessageDto {
  id: string;
  senderId: string;
  senderProfileId: string;
  text: string;
  type: MessageType;
  mediaUrl: string;
  mediaType: string;
  mediaSize: number;
  thumbnailUrl?: string;
  replyTo?: string;
  reactions: Array<{
    emoji: string;
    userId: string;
    userProfileId: string;
  }>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class MediaUploadProgressDto {
  uploadId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  message?: string;
}
