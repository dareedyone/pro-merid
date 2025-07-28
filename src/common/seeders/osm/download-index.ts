// import axios from 'axios';
// import fs from 'fs/promises';
// import path from 'path';

// const INDEX_URL = 'https://download.geofabrik.de/index-v1.json';
// const OUTPUT_PATH = path.join(__dirname, 'geofabrik-index.json');

// async function run() {
//   console.log('⬇️ Downloading Geofabrik index...');
//   const { data } = await axios.get(INDEX_URL);
//   await fs.writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2));
//   console.log(`✅ Index saved to ${OUTPUT_PATH}`);
// }

// run().catch((err) => {
//   console.error('❌ Failed to download index:', err.message);
//   process.exit(1);
// });

import axios from 'axios';
import fsP from 'fs/promises';
// import fs from 'fs';
import { ensureFileNotExist, INDEX_PATH, isFileExist } from './helpers/paths';
import type { Feature, FeatureCollection } from 'geojson';

const INDEX_URL = 'https://download.geofabrik.de/index-v1.json';

async function downloadGeofabrikIndex() {
  // if (isFileExist(INDEX_PATH)) {
  //   console.log(`✅ ${INDEX_PATH} — already exists`);
  //   return;
  // }
  ensureFileNotExist(INDEX_PATH);
  // ensureDirExists(OSM_DATA_DIR);
  const { data } = await axios.get<FeatureCollection>(INDEX_URL);
  // const formattedData: Record<string, Feature> = (data.features || []).reduce<
  //   Record<string, (typeof data.features)[0]>
  // >((prev, curr) => {
  //   const slug = curr.properties?.id as string;
  //   prev[slug] = curr;
  //   return prev;
  // }, {});
  await fsP.writeFile(INDEX_PATH, JSON.stringify(data, null, 2));
  console.log(`✔ Index saved to ${INDEX_PATH}`);
}

downloadGeofabrikIndex().catch(console.error);
