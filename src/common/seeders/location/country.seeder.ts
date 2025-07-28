import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Continent } from 'src/feature/location/entities/continent.entity';
import { Region } from 'src/feature/location/entities/region.entity';
import { countriesMeta } from '../osm/country-meta';
import { Country } from 'src/feature/location/entities/country.entity';

export class CountrySeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const continents = await em.find(Continent, {});

    if (continents.length === 0) {
      throw new Error(
        'No continents found! Make sure the ContinentSeeder runs first.',
      );
    }

    const regions = await em.find(Region, {});
    if (regions.length === 0) {
      throw new Error(
        'No regions found! Make sure the RegionSeeder runs first.',
      );
    }

    const countryData = countriesMeta;

    // const continentCountries = continents.map((continent) => {
    //   const countries = countryData.filter(
    //     (contry) => contry.continent === continent.name,
    //   );
    //   return em.upsertMany(
    //     Country,
    //     countries.map((country) => ({
    //       ...country,
    //       continent,
    //     })),
    //   );
    // });

    const countries = countryData.map((data) => {
      // const continent = continents.find((c) => c.name === data.continent);
      // if (!continent) throw new Error(`Continent ${data.continent} not found!`);

      const region = regions.find((r) => r.name === data.region); // Assuming you have a regions array
      if (!region) throw new Error(`Region ${data.region} not found!`);

      return em.create(Country, {
        name: data.name.toLowerCase(),
        isoCode: data.code.toUpperCase(),
        phoneCode: data.phoneCode,
        flag: data.flag,
        emoji: data.emoji,
        // continent,
        region,
      });
    });

    await em.persistAndFlush(countries);
  }
}
// todo: ask chatgpt to compare index.json with country alpha code filter with available meta, then provide diff, work on this diff.
