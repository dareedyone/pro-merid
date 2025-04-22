import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Continent } from 'src/db/postgres/entities/location/continent.entity';

export class ContinentSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const continents = [
      { id: 1, name: 'Africa' },
      { id: 2, name: 'Europe' },
      { id: 3, name: 'Asia' },
      { id: 4, name: 'North America' },
      { id: 5, name: 'South America' },
      { id: 6, name: 'Australia' },
      { id: 7, name: 'Antarctica' },
    ];

    await em.persistAndFlush(
      continents.map((data) => em.create(Continent, data)),
    );
  }
}
