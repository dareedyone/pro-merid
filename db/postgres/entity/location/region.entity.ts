import { Entity, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { BaseSingleEntity } from '../generic/base.single.entity';
import { Continent } from './continent.entity';
import { Country } from './country.entity';

@Entity()
export class Region extends BaseSingleEntity {
  @ManyToOne(() => Continent)
  continent!: Continent;

  @OneToMany(() => Country, (country) => country.region)
  countries = new Collection<Country>(this);
}
