import { Entity, Property, ManyToOne, Unique } from '@mikro-orm/core';
import { Religion } from './religion.entity';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';

@Entity()
export class ReligionSect extends BaseSingleEntity {
  @Property()
  @Unique()
  declare name: string;

  @Property({ nullable: true })
  description?: string;

  @ManyToOne(() => Religion)
  religion!: Religion;
}
// todo: review index on base.single.entity.ts since it is like that only id would be used for searching
