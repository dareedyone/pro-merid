import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Continent } from 'src/feature/location/entities/continent.entity';
import { getUniqueRegionsAndContinents } from './utils/index.util';
import { countriesMeta } from '../osm/country-meta';

export class ContinentSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // const continents = [
    //   { id: 1, name: 'Africa' },
    //   { id: 2, name: 'Europe' },
    //   { id: 3, name: 'Asia' },
    //   { id: 4, name: 'North America' },
    //   { id: 5, name: 'South America' },
    //   { id: 6, name: 'Australia' },
    //   { id: 7, name: 'Antarctica' },
    // ];

    const continents = getUniqueRegionsAndContinents(
      countriesMeta,
      'continent',
    );

    await em.persistAndFlush(
      continents.map((data) =>
        em.create(Continent, { name: data.continent.toLowerCase() }),
      ),
    );
  }
}
