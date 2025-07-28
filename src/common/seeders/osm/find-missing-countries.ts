import { writeFile } from 'fs/promises';
import type { FeatureCollection, Feature } from 'geojson';
import { countriesMeta } from './country-meta';
import { MISSING_COUNTRY_PATH } from './helpers/paths';

async function fetchGeofabrikIndex(): Promise<FeatureCollection> {
  const res = await fetch('https://download.geofabrik.de/index-v1.json');
  if (!res.ok) throw new Error(`Failed to fetch index.json: ${res.statusText}`);
  return res.json();
}

function extractCountryFeatures(fc: FeatureCollection): Feature[] {
  const features: Feature[] = [];
  const stack: Feature[] = [...fc.features];

  while (stack.length) {
    const feature = stack.pop();
    if (!feature) continue;

    features.push(feature);

    const children = feature.properties?.['children'] as Feature[] | undefined;
    if (Array.isArray(children)) {
      stack.push(...children);
    }
  }

  return features;
}

async function main() {
  const geojson = await fetchGeofabrikIndex();
  const features = extractCountryFeatures(geojson);

  const existingCodes = new Set(countriesMeta.map((c) => c.code.toUpperCase()));
  const seenKeys = new Set<string>();

  const missingFeatures = features.filter((feature) => {
    const raw = feature.properties?.['iso3166-1:alpha2'];
    const codes: string[] = Array.isArray(raw)
      ? raw.map((c) => c.toUpperCase())
      : typeof raw === 'string'
        ? [raw.toUpperCase()]
        : [];

    if (codes.length === 0) return false;

    const allPresent = codes.every((code) => existingCodes.has(code));
    const key = codes.sort().join(',');

    if (!allPresent && !seenKeys.has(key)) {
      seenKeys.add(key);
      return true;
    }

    return false;
  });

  const simplifiedOutput = missingFeatures.map((f) => ({
    name: f.properties?.name,
    code: f.properties?.['iso3166-1:alpha2'],
  }));

  await writeFile(
    MISSING_COUNTRY_PATH,
    JSON.stringify(simplifiedOutput, null, 2),
    'utf-8',
  );

  console.log(
    `✅ Wrote ${simplifiedOutput.length} missing countries to missing_countries_from_meta.json`,
  );
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
