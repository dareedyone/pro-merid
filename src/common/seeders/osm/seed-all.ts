// // import { MikroORM } from '@mikro-orm/core';
// // import mikroConfig from 'src/mikro-orm.config';
// // import { seedCities } from './seed-cities';
// // import { extractCities } from './parse-osm';

// // async function main() {
// //   const countrySlug = process.argv[2];
// //   if (!countrySlug) throw new Error('Pass a country slug');

// //   const orm = await MikroORM.init(mikroConfig);

// //   extractCities(countrySlug);
// //   await seedCities(orm, countrySlug);

// //   await orm.close(true);
// // }

// // main().catch(console.error);
// // -------------

// // # 1. Download Geofabrik index
// // npx ts-node seeders/osm/download-index.ts

// // # 2. Download OSM data for country/all (only if missing)
// // npx ts-node seeders/osm/download-country-data.ts all

// // # 3. Convert to GeoJSON (only if missing)
// // npx ts-node seeders/osm/parse-osm.ts all

// // # 4. Seed cities (and optionally, update country, region, continent)
// // npx mikro-orm seeder:run --class CitySeeder all
// import { execSync } from 'child_process';

// const run = (cmd: string) => {
//   console.log(`\n🛠 Running: ${cmd}`);
//   execSync(cmd, { stdio: 'inherit' });
// };

// (async () => {
//   run('ts-node seeders/osm/download-index.ts');
//   run('ts-node seeders/osm/download-country-data.ts all');
//   run('ts-node seeders/osm/parse-osm.ts all');
//   run('npx mikro-orm seeder:run --class CitySeeder all');
// })();

// // npx ts-node seeders/osm/seed-all.ts

import { execSync } from 'child_process';

const slug = process.argv[2];
if (!slug) throw new Error('Usage: ts-node run.ts <country-slug | all>');

const scripts = [
  'download-index.ts',
  'download-country-data.ts',
  'parse-osm.ts',
  'seed-location.ts',
];

(() => {
  for (const script of scripts) {
    execSync(`ts-node src/common/seeders/osm/${script} ${slug}`, {
      stdio: 'inherit',
    });
  }
})();
//  npx ts-node src/common/seeders/osm/seed-all.ts nigeria
