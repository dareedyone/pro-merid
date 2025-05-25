import { Entity, Property, ManyToOne, Index, Unique } from '@mikro-orm/core';
import { Religion } from './religion.entity';

@Entity()
export class ReligionSect {
  @Property()
  @Index()
  @Unique()
  declare name: string;

  @Property({ nullable: true })
  description?: string;

  @ManyToOne(() => Religion)
  religion!: Religion;
}
