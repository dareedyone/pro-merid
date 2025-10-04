import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { User } from 'src/feature/user/entities/user/user.entity';

import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { TicketType } from './ticket-type.entity';

@Entity()
export class TicketPurchase extends BaseTimeEntity {
  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => TicketType)
  ticketType!: TicketType;

  @Property({ nullable: true })
  purchasedFor?: string;

  @Property({ nullable: true })
  pfEmail?: string;

  @Property({ type: 'datetime' })
  purchasedAt: Date = new Date();

  @Property({ type: 'datetime' })
  checkedIn?: Date;
}
