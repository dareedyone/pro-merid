import {
  Entity,
  Property,
  ManyToMany,
  Collection,
  OneToMany,
} from '@mikro-orm/core';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { User } from 'src/feature/user/entities/user/user.entity';
import { TicketType } from './ticket-type.entity';

@Entity()
export class Event extends BaseTimeEntity {
  @Property()
  title!: string;

  @Property()
  description!: string;

  @Property()
  location!: string;

  @Property({ type: 'datetime' })
  startTime!: Date;

  @Property({ type: 'datetime' })
  endTime!: Date;

  @Property({ default: false })
  isUserCreated: boolean = false;

  @Property({ default: 'public' })
  visibility: 'public' | 'private' | 'invite';

  @ManyToMany(() => User)
  organizers = new Collection<User>(this);

  @OneToMany(() => TicketType, (t) => t.event)
  ticketTypes = new Collection<TicketType>(this);
}
