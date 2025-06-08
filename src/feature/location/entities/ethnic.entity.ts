import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';
import { Country } from './country.entity';

@Entity()
export class Ethnic extends BaseSingleEntity {
  @ManyToOne({ entity: () => Country })
  country: Country;
}
