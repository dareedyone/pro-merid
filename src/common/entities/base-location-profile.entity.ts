import { Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseTimeEntity } from './base.entity';
import { LocationType } from 'src/common/types/enums/user.enum';
import { User } from 'src/feature/user/entities/user/user.entity';
import { AdministrativeDivision } from 'src/feature/location/entities/admin-division.entity';

export abstract class BaseLocationProfileEntity extends BaseTimeEntity {
  @Enum({ items: () => LocationType, default: LocationType.CURRENT }) // todo: review current due to flight mode
  type?: LocationType;

  @ManyToOne(() => User)
  user!: User;

  @Property({ columnType: 'geometry(Point, 4326)' })
  coordinates: object;

  @ManyToOne(() => AdministrativeDivision)
  location: AdministrativeDivision;

  @Property({ default: false })
  idVerified: boolean = false;

  @Property({ default: false })
  hidePictures: boolean = false;
}
