import {
  Collection,
  Entity,
  OneToMany,
  Property,
  Unique,
} from '@mikro-orm/core';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';
import { Interest } from './interest.entity';

@Entity()
export class InterestCategory extends BaseSingleEntity {
  @Property()
  @Unique()
  declare name: string;

  @OneToMany(() => Interest, (interest) => interest.category)
  interests = new Collection<Interest>(this);
}
