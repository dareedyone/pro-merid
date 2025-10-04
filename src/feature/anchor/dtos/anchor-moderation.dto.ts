import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { ModerationLevel, AnchorRole } from '../types/anchor.enum';

export class FacilitateMatchDto {
  @IsUUID()
  sourceUserId: string;

  @IsUUID()
  targetUserId: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean = false;
}

export class ModerateChatDto {
  @IsUUID()
  chatId: string;

  @IsEnum(ModerationLevel)
  action: ModerationLevel;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AssignCounselorDto {
  @IsUUID()
  chatId: string;

  @IsUUID()
  counselorId: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CounselorAccessDto {
  @IsUUID()
  userId: string;

  @IsEnum(AnchorRole)
  role: AnchorRole;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class ModerationReportDto {
  @IsUUID()
  reportedUserId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence?: string[];
}

export class ModerationActionDto {
  @IsUUID()
  targetUserId: string;

  @IsEnum(ModerationLevel)
  action: ModerationLevel;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  duration?: number; // in hours, for temporary actions
}

export class ModerationResponseDto {
  id: string;
  action: ModerationLevel;
  targetUserId: string;
  reason: string;
  note?: string;
  counselorId: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export class ModerationListResponseDto {
  actions: ModerationResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class ChatModerationContextDto {
  chatId: string;
  isMonitored: boolean;
  counselorId?: string;
  canModerate: boolean;
  moderationLevel: ModerationLevel;
  lastModeratedAt?: Date;
  moderationCount: number;
}

export class MatchModerationContextDto {
  matchId: string;
  isFacilitated: boolean;
  counselorId?: string;
  requiresApproval: boolean;
  moderationLevel: ModerationLevel;
  facilitatedAt?: Date;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
}
