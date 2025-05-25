import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseSingleEntity } from '../generic/base.single.entity';
import { Country } from './country.entity';

@Entity()
export class Ethnic extends BaseSingleEntity {
  @ManyToOne({ entity: () => Country })
  country: Country;
}
