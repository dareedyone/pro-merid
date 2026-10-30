import { Seeder } from '@mikro-orm/seeder';
import type { EntityManager } from '@mikro-orm/core';
import fs from 'fs';
import path from 'path';
import type { FeatureCollection, Feature } from 'geojson';
import { Country } from 'src/feature/location/entities/country.entity';
import { City } from 'src/feature/location/entities/city.entity';
import { Region } from 'src/feature/location/entities/region.entity';
import { Continent } from 'src/feature/location/entities/continent.entity';
import { INDEX_PATH, OSM_GEOJSON_DIR } from './helpers/paths';
import { countriesMeta } from './country-meta';
import { getCentroid } from './helpers/geo-utils';

export class OsmLocationSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // const geojsonFiles = globSync(path.join(GEOJSON_DIR, '*.geojson'));
    const createdContinents: Record<string, Continent> = {};
    const createdRegions: Record<string, Region> = {};

    const geojsonFiles = fs
      .readdirSync(OSM_GEOJSON_DIR)
      .filter((f) => f.endsWith('.geojson'));

    const indexData: FeatureCollection = JSON.parse(
      fs.readFileSync(INDEX_PATH, 'utf-8'),
    );

    const mappedCountryIndex: Record<string, Feature> = (
      indexData.features || []
    ).reduce<Record<string, Feature>>((prev, curr) => {
      const slug = curr.properties?.id as string;
      const isCountry = !!curr.properties?.['iso3166-1:alpha2'];
      if (isCountry) {
        prev[slug] = curr;
      }
      return prev;
    }, {});

    const mappedMeta: Record<string, (typeof countriesMeta)[0]> =
      countriesMeta.reduce<Record<string, (typeof countriesMeta)[0]>>(
        (prev, curr) => {
          const name = curr.name.toLowerCase();
          prev[name] = curr;
          return prev;
        },
        {},
      );

    if (!geojsonFiles.length) {
      console.warn('⚠️ No GeoJSON files found. Aborting.');
      return;
    }

    for (const fileName of geojsonFiles) {
      const slug = path.basename(fileName, '.geojson').toLowerCase();
      const filePath = path.join(OSM_GEOJSON_DIR, fileName);

      // todo: check city geo format
      const geo = JSON.parse(
        fs.readFileSync(filePath, 'utf-8'),
      ) as FeatureCollection;

      const indexCountry = mappedCountryIndex[slug];

      const metaCountry = mappedMeta[slug];

      const countryName =
        indexCountry?.properties?.name ?? metaCountry?.name ?? slug;

      const isoCode =
        indexCountry?.properties?.['iso3166-1:alpha2']?.[0] ??
        metaCountry?.code ??
        slug.toUpperCase();

      const phoneCode = metaCountry?.phoneCode ?? '';
      const flag = metaCountry?.flag ?? '';
      const emoji = metaCountry?.emoji ?? '';

      const continentName: string =
        indexCountry.properties?.parent ?? metaCountry?.continent;

      const regionName = metaCountry?.region;

      if (continentName && !createdContinents[continentName]) {
        createdContinents[continentName] = await em.upsert(Continent, {
          name: continentName,
        });
      }

      const continent = createdContinents[continentName] ?? null;

      if (regionName && !createdRegions[regionName]) {
        createdRegions[regionName] = await em.upsert(Region, {
          name: regionName,
          continent,
        });
      }

      const region = createdRegions[regionName] ?? null;

      const country = await em.upsert(Country, {
        name: countryName,
        isoCode,
        phoneCode,
        flag,
        emoji,
        region,
      });

      let created = 0;

      for (const feature of geo.features) {
        const name = feature.properties?.name;
        const geometry = feature.geometry;

        if (!name || !geometry) continue;

        const centroid = getCentroid(geometry);
        const boundary =
          geometry.type === 'Polygon' || geometry.type === 'MultiPolygon'
            ? geometry
            : null;

        await em.upsert(City, {
          name,
          country,
          centroid,
          boundary,
        });

        created++;
      }

      console.log(`✅ Seeded ${created} cities for ${countryName}`);
    }
  }
}
