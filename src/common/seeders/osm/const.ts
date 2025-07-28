import path from 'path';

export const ROOT_DIR = __dirname;
export const DATA_DIR = path.join(ROOT_DIR, '.data');
export const GEOFABRIK_INDEX_FILE = path.join(ROOT_DIR, 'geofabrik-index.json');

export const getGeoJsonPath = (slug: string) =>
  path.join(DATA_DIR, `${slug}.geojson`);

export const getOsmPbfPath = (slug: string) =>
  path.join(DATA_DIR, `${slug}.osm.pbf`);
