import { Entity, Property, ManyToOne } from '@mikro-orm/core';

import { BaseTimeEntity } from 'src/common/entities/base.entity';

@Entity()
export class TicketType extends BaseTimeEntity {
  @ManyToOne(() => Event)
  event!: Event;

  @Property()
  name: string;

  @Property()
  description?: string;

  @Property({ type: 'float' })
  price: number;

  @Property()
  maxAvailable: number;

  @Property({ default: 0 })
  soldCount: number;

  @Property({ default: true })
  isActive: boolean;
}
