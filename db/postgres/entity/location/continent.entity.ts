import { Entity, Collection, OneToMany } from '@mikro-orm/core';
import { BaseSingleEntity } from '../generic/base.single.entity';
import { Country } from './country.entity';

@Entity()
export class Continent extends BaseSingleEntity {
  @OneToMany({ entity: () => Country, mappedBy: 'continent' })
  countries = new Collection<Country>(this);
}
