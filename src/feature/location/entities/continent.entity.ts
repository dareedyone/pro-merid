import { Entity, Collection, OneToMany } from '@mikro-orm/core';
import { Country } from './country.entity';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';

@Entity()
export class Continent extends BaseSingleEntity {
  @OneToMany({ entity: () => Country, mappedBy: 'continent' })
  countries = new Collection<Country>(this);
}
