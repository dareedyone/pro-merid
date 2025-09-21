import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';

@Entity()
export class FocusedIntentionCategory extends BaseSingleEntity {
  @Property()
  @Index()
  @Unique()
  declare name: string;

  @Property()
  emoji!: string;
}
