import { Entity, ManyToOne } from '@mikro-orm/core';
import { Country } from './country.entity';
import { BaseLocationEntity } from 'src/common/entities/base-location.entity';

@Entity()
export class City extends BaseLocationEntity {
  @ManyToOne(() => Country)
  country: Country;
}
