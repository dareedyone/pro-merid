import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import axios from 'axios';
import type { IncomingMessage } from 'http';
import {
  ensureDirExists,
  INDEX_PATH,
  isFileExist,
  OSM_DATA_DIR,
} from './helpers/paths';
import type { Feature, FeatureCollection } from 'geojson';
// import type { FeatureCollection } from 'geojson';

// type GeofabrikFeature = {
//   type: string;
//   properties: {
//     id: string;
//     name: string;
//     urls: { pbf: string };
//   };
//   features?: GeofabrikFeature[];
// };

// type GeofabrikIndex = {
//   features: GeofabrikFeature[];
// };

// type GeofabrikIndex = FeatureCollection;

const slugArg = process.argv[2]?.toLowerCase();
if (!slugArg) {
  console.error(
    '❌ Usage: ts-node download-country-data.ts <country-slug|all>',
  );
  process.exit(1);
}

// const INDEX_PATH = path.join(__dirname, 'geofabrik-index.json');
// const OSM_DATA_DIR = path.join(__dirname, 'data');

async function downloadCountryPbf(slug: string, feature: Feature) {
  const url = feature.properties?.urls?.pbf as string;
  const filename = path.basename(url);
  const dest = path.join(OSM_DATA_DIR, filename);

  if (isFileExist(dest)) {
    console.log(`✅ ${slug} — already exists`);
    return;
  }

  console.log(`⬇️ Downloading ${slug}...`);

  const response = await axios.get(url, { responseType: 'stream' });
  const stream = response.data as IncomingMessage;
  // ensureDirExists(OSM_DATA_DIR);
  // await fsPromises.mkdir(OSM_DATA_DIR, { recursive: true });
  const writer = fs.createWriteStream(dest);

  await new Promise<void>((resolve, reject) => {
    stream.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log(`✅ Finished: ${filename}`);
}

// function flattenCountries(features: GeofabrikFeature[]): GeofabrikFeature[] {
//   return features.flatMap((f) =>
//     f.features ? flattenCountries(f.features) : [f],
//   );
// }

async function run() {
  const raw = await fsPromises.readFile(INDEX_PATH, 'utf-8');
  const index: FeatureCollection = JSON.parse(raw);

  const countries = index.features.filter(
    (feature) => feature.properties?.['iso3166-1:alpha2'],
  );

  ensureDirExists(OSM_DATA_DIR);

  // const countries = flattenCountries(index.features);

  if (slugArg === 'all') {
    for (const country of countries) {
      const slug = country.properties?.id as string;
      await downloadCountryPbf(slug, country);
    }
  } else {
    const match = countries.find((c) => {
      const slug = c.properties?.id as string;
      const name = c.properties?.name as string;
      return slug === slugArg || name.toLowerCase() === slugArg;
    });

    if (!match) {
      console.error(`❌ Country not found: ${slugArg}`);
      process.exit(1);
    }

    await downloadCountryPbf(slugArg, match);
  }
}

run().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});

// import fs from 'fs';
// import axios from 'axios';
// import { createWriteStream } from 'fs';
// import { INDEX_PATH, getOsmPbfPath, ensureDirExists } from './helpers/paths';
// import type { IncomingMessage } from 'http';

// async function downloadFile(url: string, outputPath: string) {
//   const writer = createWriteStream(outputPath);
//   const response = await axios.get<unknown>(url, { responseType: 'stream' });
//   const stream = response.data as IncomingMessage;

//   return new Promise<void>((resolve, reject) => {
//     stream.pipe(writer);
//     writer.on('finish', resolve);
//     writer.on('error', reject);
//   });
// }

// async function run() {
//   const countrySlug = process.argv[2];
//   if (!countrySlug) throw new Error('❌ Pass a country slug or "all"');

//   ensureDirExists('data');

//   const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
//   const countries = index.features.filter(
//     (f: any) => f.properties.urls && f.properties.urls.pbf,
//   );

//   const targets =
//     countrySlug === 'all'
//       ? countries
//       : countries.filter((f: any) => f.properties.id === countrySlug);

//   for (const f of targets) {
//     const slug = f.properties.id;
//     const outPath = getOsmPbfPath(slug);
//     if (fs.existsSync(outPath)) {
//       console.log(`⚠ Skipping ${slug}, file exists`);
//       continue;
//     }

//     const url = `https://download.geofabrik.de/${f.properties.urls.pbf}`;
//     console.log(`⬇ Downloading ${slug}...`);
//     await downloadFile(url, outPath);
//     console.log(`✔ Saved ${outPath}`);
//   }
// }

// run().catch(console.error);
