import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseSingleEntity } from '../../generic/base.single.entity';

@Entity()
export class FocusedIntention extends BaseSingleEntity {
  @Property()
  @Index()
  @Unique()
  declare name: string;

  @Property()
  emoji!: string;
}
