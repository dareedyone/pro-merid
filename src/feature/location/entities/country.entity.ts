import {
  Entity,
  Collection,
  OneToMany,
  ManyToOne,
  Property,
  Index,
  Unique,
} from '@mikro-orm/core';
import { Continent } from './continent.entity';
import { Ethnic } from './ethnic.entity';
import { AdministrativeDivision } from './admin-division.entity';
import { Region } from './region.entity';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';

@Entity()
export class Country extends BaseSingleEntity {
  @Property()
  @Index()
  @Unique()
  isoCode!: string;

  @Property()
  phoneCode!: string;

  @Property()
  flag!: string;

  @Property()
  emoji!: string;

  // @ManyToOne({ entity: () => Continent })
  // continent: Continent;

  @ManyToOne()
  continent!: Continent;

  @ManyToOne(() => Region, { nullable: true })
  region: Region;

  @OneToMany({
    entity: () => AdministrativeDivision,
    mappedBy: (division) => division.country,
  })
  divisions = new Collection<AdministrativeDivision>(this);

  @OneToMany({ entity: () => Ethnic, mappedBy: (city) => city.country })
  ethnics = new Collection<Ethnic>(this);
}
