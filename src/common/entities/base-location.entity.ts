import { Property } from '@mikro-orm/core';
import type { Geometry, Position } from 'geojson';
import { BaseSingleEntity } from './base.single.entity';

export abstract class BaseLocationEntity extends BaseSingleEntity {
  @Property({ type: 'json', nullable: true })
  centroid?: {
    type: 'Point';
    coordinates: Position;
  };

  @Property({ type: 'json', nullable: true })
  boundary?: Geometry; // Can be Polygon or MultiPolygon
}
