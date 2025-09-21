import { Entity, Property, Index, ManyToOne } from '@mikro-orm/core';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { User } from 'src/feature/user/entities/user/user.entity';
import {
  ProfileType,
  UnmatchReason,
  InteractionEventType,
} from 'src/common/types/enums/other.enum';

@Entity()
@Index({ properties: ['profileType', 'createdAt'] })
@Index({ properties: ['isUnmatched', 'matchedAt'] })
export class Match extends BaseTimeEntity {
  @Property({ type: 'string' })
  profileType!: ProfileType;

  @Property({ type: 'date' })
  matchedAt!: Date;

  // User references for efficient querying
  @Property()
  sourceUserId!: string;

  @Property()
  targetUserId!: string;

  @ManyToOne(() => User, { nullable: true })
  sourceUser?: User;

  @ManyToOne(() => User, { nullable: true })
  targetUser?: User;

  // Unmatch tracking
  @Property({ default: false })
  isUnmatched: boolean = false;

  @Property({ nullable: true })
  unmatchedAt?: Date;

  @Property({ nullable: true })
  unmatchedBy?: string; // User ID who initiated the unmatch

  @Property({ nullable: true })
  unmatchReason?: UnmatchReason;

  @Property({ nullable: true })
  unmatchMessage?: string; // Optional custom message

  // Re-match tracking
  @Property({ type: 'json', nullable: true })
  rematchContext?: {
    message: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    requestedAt: Date;
    requestedBy: string;
    respondedAt?: Date;
    respondedBy?: string;
  };

  // Historical tracking for analytics and audit trail
  // Note: Match records are never deleted to preserve valuable historical data
  @Property({ type: 'json', nullable: true })
  matchEvents?: Array<{
    event: InteractionEventType;
    timestamp: Date;
    initiatedBy: string;
    metadata?: Record<string, any>; // Additional context
  }>;

  // Rematch safety and limits
  // @Property({ type: 'json', nullable: true })
  // rematchLimits?: {
  //   maxRematches: number; // Default: 3
  //   cooldownPeriodHours: number; // Default: 168 (7 days)
  //   lastRematchAt?: Date;
  //   rematchCount: number;
  //   isPermanentlyBlocked: boolean;
  //   blockedBy?: string; // User ID who blocked rematches
  //   blockedAt?: Date;
  // };
}
