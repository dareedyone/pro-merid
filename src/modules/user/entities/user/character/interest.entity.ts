import { Entity, Index, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';
import { InterestCategory } from './interest-category.entity';

@Entity()
export class Interest extends BaseSingleEntity {
  @Property()
  @Index()
  @Unique()
  declare name: string;

  @Property()
  emoji!: string;

  @ManyToOne(() => InterestCategory)
  category!: InterestCategory;
}
