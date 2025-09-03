import { Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseTimeEntity } from './base.entity';
import { LocationType } from 'src/common/types/enums/user.enum';
// import { User } from 'src/feature/user/entities/user/user.entity';
import { Country } from 'src/feature/location/entities/country.entity';
// import { AdministrativeDivision } from 'src/feature/location/entities/admin-division.entity';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export abstract class BaseLocationProfileEntity extends BaseTimeEntity {
  @Property({ type: 'text' }) // todo: review current due to flight mode
  type: LocationType;

  // @ManyToOne(() => User)
  // user!: User;

  @Property({ default: false })
  usePinLocation?: boolean;

  @Property({ columnType: 'geometry(Point, 4326)' })
  point: GeoPoint;

  @Property({ columnType: 'geometry(Point, 4326)', nullable: true })
  pinnedPoint?: GeoPoint;

  // @ManyToOne(() => AdministrativeDivision)
  // location: AdministrativeDivision;

  @Property({ nullable: true })
  location?: string;

  @Property({ nullable: true })
  pinnedLocation?: string;

  @ManyToOne(() => Country)
  country?: Country;

  @ManyToOne(() => Country)
  pinnedCountry?: Country;

  @Property({ default: false })
  idVerified?: boolean;

  @Property({ default: false })
  hidePictures?: boolean;
}
