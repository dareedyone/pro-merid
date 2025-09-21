import { IsString, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';
import { MessageType } from '../entities/message.entity';
import { ProfileType } from 'src/common/types/enums/other.enum';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  chatId?: string; // Optional - will create new chat if not provided

  @IsString()
  @MaxLength(2000, { message: 'Message text cannot exceed 2000 characters' })
  text: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsString()
  @IsUUID()
  replyTo?: string; // Message ID to reply to

  @IsOptional()
  @IsString()
  mediaUrl?: string; // For media messages

  @IsOptional()
  @IsString()
  mediaType?: string; // image, video, audio, etc.

  // New fields for creating new conversations
  @IsOptional()
  @IsString()
  @IsUUID()
  targetUserId?: string; // User ID to start conversation with

  @IsOptional()
  @IsEnum(ProfileType)
  profileType?: ProfileType; // Profile type for the conversation
}
