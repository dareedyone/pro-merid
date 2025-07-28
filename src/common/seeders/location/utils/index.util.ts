import { UnknownCR, type CountryType } from '../../osm/country-meta';

export const getUniqueRegionsAndContinents = (
  countries: CountryType[],
  filter: 'region' | 'continent',
): { region: string; continent: string }[] => {
  const map = new Map<string, { region: string; continent: string }>();

  for (const { region, continent } of countries) {
    if (!region || !continent) continue;

    const key = filter === 'region' ? region : continent;

    if (!map.has(key)) {
      map.set(key, { region, continent });
    }
  }

  const result = Array.from(map.values()).sort((a, b) => {
    const aKey = filter === 'region' ? a.region : a.continent;
    const bKey = filter === 'region' ? b.region : b.continent;
    return aKey.localeCompare(bKey);
  });
  return [...result, ...UnknownCR];
};
