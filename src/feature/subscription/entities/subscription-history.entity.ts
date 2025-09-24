import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from '@mikro-orm/core';
import { User } from 'src/feature/user/entities/user/user.entity';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { SubscriptionStatus } from '../dtos/subscription.dto';

export enum SubscriptionAction {
  PURCHASED = 'purchased',
  RENEWED = 'renewed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

@Entity()
@Index({ properties: ['user', 'profileType', 'createdAt'] })
@Index({ properties: ['transactionId'] })
export class SubscriptionHistory {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => User)
  user!: User;

  @Property({ type: 'string' })
  profileType!: ProfileType;

  @Property({ type: 'string' })
  subscriptionType!: string; // 'control' or 'truefynd'

  @Property({ type: 'string' })
  action!: SubscriptionAction;

  @Property({ type: 'string' })
  status!: SubscriptionStatus;

  @Property({ type: 'timestamptz' })
  purchasedAt!: Date;

  @Property({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Property({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Property({ nullable: true })
  transactionId?: string;

  @Property({ nullable: true })
  productId?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount?: number;

  @Property({ nullable: true })
  currency?: string;

  @Property({ type: 'text', nullable: true })
  receiptData?: string;

  @Property({ type: 'text', nullable: true })
  reason?: string;

  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Property({ type: 'timestamptz' })
  createdAt = new Date();

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt = new Date();
}
