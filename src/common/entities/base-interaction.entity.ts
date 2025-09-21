import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTimeEntity } from './base.entity';
import { InteractionType, ProfileType } from '../types/enums/other.enum';
import { User } from '../../feature/user/entities/user/user.entity';
import { Match } from './match.entity';

@Entity({ abstract: true })
@Index({ properties: ['sourceUser', 'targetUser', 'type', 'profileType'] })
@Index({ properties: ['sourceUser', 'profileType', 'createdAt'] })
@Index({ properties: ['targetUser', 'type', 'profileType', 'createdAt'] })
export abstract class BaseInteraction extends BaseTimeEntity {
  @Property({ type: 'string' })
  type!: InteractionType;

  @Property({ type: 'string' })
  profileType!: ProfileType;

  @ManyToOne(() => User)
  sourceUser!: User;

  @Property()
  sourceProfileId: string;

  @ManyToOne(() => User)
  targetUser!: User;

  @Property()
  targetProfileId: string;

  // Match tracking
  @Property({ default: false })
  isMatch: boolean = false;

  @Property({ nullable: true })
  matchedAt?: Date;

  @ManyToOne(() => Match, { nullable: true })
  match?: Match;

  @Property()
  createdAt!: Date;

  @Property()
  updatedAt!: Date;

  // Abstract methods for feature-specific logic
  abstract isLike(): boolean;
  abstract isMatchable(): boolean;
  abstract getInteractionData(): any;
}
