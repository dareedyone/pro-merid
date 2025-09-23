import { IsEnum, IsString, IsOptional } from 'class-validator';
import {
  InteractionType,
  ProfileType,
  UnmatchReason,
  InteractionEventType,
} from '../types/enums/other.enum';

export class CreateInteractionDto {
  @IsEnum(InteractionType)
  type!: InteractionType;

  @IsEnum(ProfileType)
  profileType!: ProfileType;

  @IsString()
  targetUserId!: string;

  @IsString()
  targetProfileId: string;

  @IsOptional()
  @IsString()
  targetLocationProfileId?: string;

  @IsString()
  sourceProfileId: string;

  @IsOptional()
  @IsString()
  sourceLocationProfileId?: string;
}

export class UnmatchDto {
  @IsString()
  targetUserId!: string;

  @IsEnum(ProfileType)
  profileType!: ProfileType;

  @IsOptional()
  @IsString()
  targetLocationProfileId?: string;

  @IsEnum(UnmatchReason)
  reason!: UnmatchReason;

  @IsString()
  @IsOptional()
  customMessage?: string; // Required if reason is 'other'
}

export class InteractionResponseDto {
  id: string;
  type: InteractionType;
  profileType: ProfileType;
  targetUserId: string;
  targetUser: {
    id: string;
    firstName: string;
    lastName: string;
    photos?: any[];
  };
  isMatch: boolean;
  matchedAt?: Date;
  createdAt: Date;

  // Enhanced analytics data
  isUnmatched?: boolean;
  unmatchedAt?: Date;
  unmatchReason?: string;
  unmatchMessage?: string;

  // Rematch context for chat display
  rematchContext?: {
    message: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    requestedAt: Date;
    requestedBy: string;
    respondedAt?: Date;
    respondedBy?: string;
  };

  // Historical data for analytics (from Match table)
  matchEvents?: Array<{
    event: InteractionEventType;
    timestamp: Date;
    initiatedBy: string;
    metadata?: Record<string, any>;
  }>;
}

export class MatchResponseDto {
  isMatch: boolean;
  targetUser: {
    id: string;
    firstName: string;
    lastName: string;
    photos?: any[];
  };
  matchedAt?: Date;
  expiresAt?: Date; // For client-side countdown timer
}

export class RematchRequestDto {
  @IsString()
  targetUserId!: string;

  @IsEnum(ProfileType)
  profileType!: ProfileType;

  @IsString()
  message!: string; // Explanation for re-match request
}

export class RematchResponseDto {
  @IsString()
  matchId!: string;

  @IsString()
  @IsEnum(['accept', 'reject'])
  action!: 'accept' | 'reject';
}

export class RematchRequestResponseDto {
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  matchId?: string;
  message?: string;
  chatId?: string; // If accepted
}
