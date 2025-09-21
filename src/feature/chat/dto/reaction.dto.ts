import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';

export class AddReactionDto {
  @IsString()
  @IsUUID()
  chatId: string;

  @IsString()
  @IsUUID()
  messageId: string;

  @IsString()
  emoji: string;
}

export class RemoveReactionDto {
  @IsString()
  @IsUUID()
  chatId: string;

  @IsString()
  @IsUUID()
  messageId: string;

  @IsString()
  emoji: string;
}

export class ReplyToMessageDto {
  @IsString()
  @IsUUID()
  chatId: string;

  @IsString()
  @IsUUID()
  messageId: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  mediaType?: string;
}

export class ReactionResponseDto {
  emoji: string;
  userId: string;
  userProfileId: string;
  createdAt: Date;
}

export class MessageWithRepliesDto {
  id: string;
  senderId: string;
  senderProfileId: string;
  text: string;
  type: string;
  replyTo?: string;
  mediaUrl?: string;
  mediaType?: string;
  reactions: ReactionResponseDto[];
  replies: MessageWithRepliesDto[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
