// src/support-chat/dto/create-support-message.dto.ts

import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateSupportMessageDto {
  @IsEnum(['user', 'agent', 'system'])
  senderType: 'user' | 'agent' | 'system';

  @IsUUID()
  senderId: string;

  @IsOptional()
  @IsString()
  text?: string;
}
