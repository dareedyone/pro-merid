import { Entity, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { Continent } from './continent.entity';
import { Country } from './country.entity';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';

@Entity()
export class Region extends BaseSingleEntity {
  @ManyToOne(() => Continent)
  continent?: Continent;

  @OneToMany(() => Country, (country) => country.region)
  countries = new Collection<Country>(this);
}
