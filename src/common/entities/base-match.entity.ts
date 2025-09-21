import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTimeEntity } from './base.entity';
import { ProfileType } from '../types/enums/other.enum';
import { User } from '../../feature/user/entities/user/user.entity';

export interface MatchEvent {
  event: string;
  timestamp: Date;
  initiatedBy: string;
  metadata?: Record<string, any>;
}

@Entity({ abstract: true })
export abstract class BaseMatch extends BaseTimeEntity {
  @Property({ type: 'string' })
  profileType!: ProfileType;

  @Property()
  sourceUserId!: string;

  @Property()
  targetUserId!: string;

  @ManyToOne(() => User, { nullable: true })
  sourceUser?: User;

  @ManyToOne(() => User, { nullable: true })
  targetUser?: User;

  @Property({ default: false })
  isUnmatched: boolean = false;

  @Property({ nullable: true })
  unmatchedAt?: Date;

  @Property({ nullable: true })
  unmatchedBy?: string;

  @Property({ nullable: true })
  unmatchReason?: string;

  @Property({ nullable: true })
  unmatchMessage?: string;

  @Property({ type: 'json', nullable: true })
  matchEvents?: MatchEvent[];

  @Property()
  matchedAt!: Date;

  @Property()
  createdAt!: Date;

  @Property()
  updatedAt!: Date;

  // Abstract methods for feature-specific logic
  abstract getMatchData(): any;
  abstract isExpired(): boolean;
  abstract getExpiryTime(): Date | null;
}
