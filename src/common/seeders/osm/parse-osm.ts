import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  ensureFileNotExist,
  getGeoJsonPath,
  getOsmPbfPath,
  //   isFileExist,
  OSM_PBF_DIR,
} from './helpers/paths';

export function parseGeoJson(countrySlug: string): void {
  const inputPath = getOsmPbfPath(countrySlug);
  const outputPath = getGeoJsonPath(countrySlug);

  //   if (isFileExist(outputPath)) {
  //     console.log(`⚠️ GeoJSON exists for ${countrySlug}, skipping`);
  //     return;
  //   }

  ensureFileNotExist(outputPath);

  const command = `osmium tags-filter -o - ${inputPath} n/place=city,town,village | \
osmium export -f geojson -o ${outputPath}`;

  execSync(command, { stdio: 'inherit' });
}

const slug = process.argv[2];
if (!slug) throw new Error('❌ Usage: ts-node parse-osm.ts <slug | all>');

(() => {
  if (slug === 'all') {
    const files = fs.readdirSync(OSM_PBF_DIR);
    const slugs = files
      .filter((f) => f.endsWith('.osm.pbf'))
      .map((f) => path.basename(f, '.osm.pbf'));

    for (const s of slugs) {
      parseGeoJson(s);
    }
  } else {
    parseGeoJson(slug);
  }
})();
