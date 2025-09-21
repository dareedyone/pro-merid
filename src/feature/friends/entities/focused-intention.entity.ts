import { Entity, Index, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';
import { FocusedIntentionCategory } from './focused-intention-category';

@Entity()
export class FocusedIntention extends BaseSingleEntity {
  @Property()
  @Index()
  @Unique()
  declare name: string;

  @Property()
  emoji!: string;

  @ManyToOne(() => FocusedIntentionCategory)
  category!: FocusedIntentionCategory;
}
