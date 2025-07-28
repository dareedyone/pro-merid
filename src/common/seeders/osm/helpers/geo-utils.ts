import type { Geometry, Position } from 'geojson';

export function getCentroid(geometry: Geometry): {
  type: 'Point';
  coordinates: Position;
} {
  if (geometry.type === 'Point') {
    return { type: 'Point', coordinates: geometry.coordinates };
  }

  let coords: Position[];

  switch (geometry.type) {
    case 'Polygon':
      coords = geometry.coordinates[0]; // First ring
      break;
    case 'MultiPolygon':
      coords = geometry.coordinates[0][0]; // First ring of first polygon
      break;
    case 'LineString':
      coords = geometry.coordinates;
      break;
    case 'MultiLineString':
      coords = geometry.coordinates[0]; // First line
      break;
    default:
      throw new Error(`Unsupported geometry type: ${geometry.type}`);
  }

  const [lngSum, latSum] = coords.reduce(
    ([lngTotal, latTotal], [lng, lat]) => [lngTotal + lng, latTotal + lat],
    [0, 0],
  );

  const len = coords.length;

  return {
    type: 'Point',
    coordinates: [lngSum / len, latSum / len],
  };
}
