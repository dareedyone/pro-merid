export function getCityName(tags: Record<string, string>): string | null {
  return tags.name ?? tags['name:en'] ?? null;
}

export function isCity(tags: Record<string, string>): boolean {
  return ['city', 'town', 'village'].includes(tags.place);
}
