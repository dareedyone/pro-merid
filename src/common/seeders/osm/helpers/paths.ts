import path from 'path';
import fs from 'fs';

export const OSM_DATA_DIR = path.resolve(__dirname, '../.data');
export const OSM_PBF_DIR = path.join(OSM_DATA_DIR, '/pbfs');
export const OSM_GEOJSON_DIR = path.join(OSM_DATA_DIR, '/geojsons');
export const META_PATH = path.resolve(__dirname, '../country-meta.json');
export const INDEX_PATH = path.resolve(__dirname, '../geofabrik-index.json');
export const MISSING_COUNTRY_PATH = path.resolve(
  __dirname,
  '../missing_countries_from_meta.json',
);

export const ensureDirExists = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
export function isFileExist(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function ensureFileNotExist(filePath: string): void {
  if (isFileExist(filePath)) {
    // console.log(`✅ ${filePath} — already exists`);
    throw new Error(`✅ ${filePath} — already exists`);
  }
}

export const getGeoJsonPath = (countrySlug: string) =>
  path.join(OSM_GEOJSON_DIR, `${countrySlug}.geojson`);

export const getOsmPbfPath = (countrySlug: string) =>
  path.join(OSM_PBF_DIR, `${countrySlug}.osm.pbf`);
