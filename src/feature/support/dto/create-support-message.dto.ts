import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSupportMessageDto {
  @IsEnum(['user', 'agent', 'system'])
  senderType: 'user' | 'agent' | 'system';

  @IsUUID()
  senderId: string;

  @IsOptional()
  @IsString()
  text?: string;
}
