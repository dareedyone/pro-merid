import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Continent } from 'src/db/postgres/entities/location/continent.entity';
import { Region } from 'src/db/postgres/entities/location/region.entity';

export class RegionSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const continents = await em.find(Continent, {});

    if (continents.length === 0) {
      throw new Error(
        'No continents found! Make sure the ContinentSeeder runs first.',
      );
    }

    const AfricanRegions = [
      { name: 'Northern Africa', continent: 'Africa' },
      { name: 'Western Africa', continent: 'Africa' },
      { name: 'Central Africa', continent: 'Africa' },
      { name: 'Eastern Africa', continent: 'Africa' },
      { name: 'Southern Africa', continent: 'Africa' },
    ];
    const AsianRegions = [
      { name: 'Central Asia', continent: 'Asia' },
      { name: 'Eastern Asia', continent: 'Asia' },
      { name: 'Southeastern Asia', continent: 'Asia' },
      { name: 'Southern Asia', continent: 'Asia' },
      { name: 'Western Asia (Middle East)', continent: 'Asia' },
    ];

    const NorthAmericanRegions = [
      { name: 'Northern America', continent: 'North America' },
      { name: 'Caribbean', continent: 'North America' },
      { name: 'Central America', continent: 'North America' },
    ];
    const SouthAmericanRegions = [
      { name: 'Andean States', continent: 'South America' },
      { name: 'Southern Cone', continent: 'South America' },
      { name: 'Guianas', continent: 'South America' },
      { name: 'Brazil', continent: 'South America' },
    ];
    const EuropeanRegions = [
      { name: 'Northern Europe', continent: 'Europe' },
      { name: 'Western Europe', continent: 'Europe' },
      { name: 'Central Europe', continent: 'Europe' },
      { name: 'Eastern Europe', continent: 'Europe' },
      { name: 'Southern Europe', continent: 'Europe' },
    ];

    const AustralianRegions = [
      { name: 'Australia and New Zealand', continent: 'Australia' },
      { name: 'Melanesia', continent: 'Australia' },
      { name: 'Micronesia', continent: 'Australia' },
      { name: 'Polynesia', continent: 'Australia' },
    ];

    // const AntarcticRegions = [
    //   { name: 'East Antarctica', continent: 'Antarctica' },
    //   { name: 'West Antarctica', continent: 'Antarctica' },
    //   { name: 'Antarctic Peninsula', continent: 'Antarctica' },
    // ];

    const regionData = [
      ...AfricanRegions,
      ...AsianRegions,
      ...AustralianRegions,
      ...EuropeanRegions,
      ...NorthAmericanRegions,
      ...SouthAmericanRegions,
    ];

    const regions = regionData.map((data) => {
      const continent = continents.find((c) => c.name === data.continent);
      if (!continent) throw new Error(`Continent ${data.continent} not found!`);

      return em.create(Region, {
        name: data.name,
        continent,
      });
    });

    await em.persistAndFlush(regions);
  }
}
