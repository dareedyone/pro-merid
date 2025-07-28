import { Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseTimeEntity } from './base.entity';
import { LocationType } from 'src/common/types/enums/user.enum';
// import { User } from 'src/feature/user/entities/user/user.entity';
import { Country } from 'src/feature/location/entities/country.entity';
// import { AdministrativeDivision } from 'src/feature/location/entities/admin-division.entity';

export abstract class BaseLocationProfileEntity extends BaseTimeEntity {
  @Enum({ items: () => LocationType }) // todo: review current due to flight mode
  type: LocationType;

  // @ManyToOne(() => User)
  // user!: User;

  @Property({ default: false })
  usePinLocation?: boolean;

  @Property({ columnType: 'geometry(Point, 4326)' })
  point: object;

  @Property({ columnType: 'geometry(Point, 4326)', nullable: true })
  pinnedPoint: object;

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
