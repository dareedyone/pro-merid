import { IsString, IsArray, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ProfileType } from 'src/common/types/enums/other.enum';

export class CreateChatDto {
  @IsString()
  @IsUUID()
  matchId: string; // Reference to ProfileInteraction match

  @IsEnum(ProfileType)
  profileType: ProfileType;

  @IsArray()
  @IsString({ each: true })
  @IsUUID(4, { each: true })
  participantIds: string[];

  @IsArray()
  @IsString({ each: true })
  @IsUUID(4, { each: true })
  profileIds: string[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  createdBy?: string; // Will be set by the service
}