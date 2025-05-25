import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseSingleEntity } from '../../generic/base.single.entity';

@Entity()
export class Language extends BaseSingleEntity {
  @Property()
  @Unique()
  declare name: string;

  @Property({ unique: true })
  @Unique()
  @Index()
  code!: string;

  @Property({ nullable: true })
  nativeName?: string;
}
