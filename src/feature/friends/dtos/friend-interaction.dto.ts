import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';
import {
  InteractionType,
  ProfileType,
} from '../../../common/types/enums/other.enum';

export class CreateFriendRequestDto {
  @IsString()
  targetUserId!: string;

  @IsOptional()
  @IsString()
  friendRequestMessage?: string;

  @IsOptional()
  @IsString()
  sourceProfileId?: string;

  @IsOptional()
  @IsString()
  targetProfileId?: string;
}

export class AcceptFriendRequestDto {
  @IsString()
  interactionId!: string;

  @IsOptional()
  @IsString()
  acceptanceMessage?: string;
}

export class RejectFriendRequestDto {
  @IsString()
  interactionId!: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  rejectionMessage?: string;
}

export class FriendRequestResponseDto {
  isMatch!: boolean;
  targetUser!: {
    id: string;
    firstName: string;
    lastName: string;
    photos: any[];
  };
  matchedAt?: Date;
  expiresAt?: Date;
  friendRequestMessage?: string;
  isAccepted?: boolean;
  acceptedAt?: Date;
}

export class FriendInteractionDto {
  id!: string;
  type!: InteractionType;
  profileType!: ProfileType;
  sourceUser!: {
    id: string;
    firstName: string;
    lastName: string;
  };
  targetUser!: {
    id: string;
    firstName: string;
    lastName: string;
  };
  friendRequestMessage?: string;
  isAccepted!: boolean;
  acceptedAt?: Date;
  acceptedBy?: string;
  rejectionReason?: string;
  rejectionMessage?: string;
  isMatch!: boolean;
  matchedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export class FriendMatchDto {
  id!: string;
  profileType!: ProfileType;
  sourceUser!: {
    id: string;
    firstName: string;
    lastName: string;
  };
  targetUser!: {
    id: string;
    firstName: string;
    lastName: string;
  };
  friendshipLevel?: string;
  mutualInterests?: string[];
  friendshipNotes?: string;
  isBlocked!: boolean;
  blockedAt?: Date;
  blockedBy?: string;
  blockReason?: string;
  isUnmatched!: boolean;
  unmatchedAt?: Date;
  matchedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
