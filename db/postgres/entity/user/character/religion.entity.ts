import {
  Entity,
  Property,
  OneToMany,
  Collection,
  Index,
  Unique,
} from '@mikro-orm/core';
import { BaseSingleEntity } from '../../generic/base.single.entity';
import { ReligionSect } from './religion-sect.entity';

@Entity()
export class Religion extends BaseSingleEntity {
  @Property()
  @Index()
  @Unique()
  declare name: string;

  @Property({ nullable: true })
  description?: string;

  @OneToMany(() => ReligionSect, (sect) => sect.religion)
  sects = new Collection<ReligionSect>(this);
}
