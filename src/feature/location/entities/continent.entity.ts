import { Entity, Collection, OneToMany } from '@mikro-orm/core';
import { BaseSingleEntity } from 'src/common/entities/base.single.entity';
import { Region } from './region.entity';

@Entity()
export class Continent extends BaseSingleEntity {
  // TODO: Re-enable when Country entity has continent relationship
  // @OneToMany({ entity: () => Country, mappedBy: 'continent' })
  // countries = new Collection<Country>(this);
  @OneToMany(() => Region, (region) => region.continent)
  regions = new Collection<Region>(this);
}
