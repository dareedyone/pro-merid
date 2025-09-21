import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import {
  InteractionType,
  ProfileType,
} from 'src/common/types/enums/other.enum';
import { User } from '../user/user.entity';
import { Match } from '../../../../common/entities/match.entity';

@Entity()
@Index({ properties: ['sourceUser', 'targetUser', 'type', 'profileType'] })
@Index({ properties: ['sourceUser', 'profileType', 'createdAt'] })
@Index({ properties: ['targetUser', 'type', 'profileType', 'createdAt'] })
export class ProfileInteraction extends BaseTimeEntity {
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

  // Location profiles for context (optional)
  @Property({ nullable: true })
  sourceLocationProfileId?: string;

  @Property({ nullable: true })
  targetLocationProfileId?: string;

  // Match tracking
  @Property({ default: false })
  isMatch: boolean = false;

  @Property({ nullable: true })
  matchedAt?: Date;

  @ManyToOne(() => Match, { nullable: true })
  match?: Match; // Relationship to Match table

  // For daily limits tracking
  @Property({ type: 'date' })
  interactionDate: Date = new Date();
}
