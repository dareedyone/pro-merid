import { Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseTimeEntity } from './base.entity';
import { LocationType } from 'src/common/types/enums/user.enum';
import { User } from 'src/modules/user/entities/user/user.entity';
import { AdministrativeDivision } from 'src/modules/location/entities/admin-division.entity';

export abstract class BaseLocationProfileEntity extends BaseTimeEntity {
  @Enum({ items: () => LocationType, default: LocationType.CURRENT })
  type: LocationType;

  @ManyToOne(() => User)
  user!: User;

  @Property({ columnType: 'geometry(Point, 4326)', nullable: true })
  coordinates?: object;

  @ManyToOne(() => AdministrativeDivision, { nullable: true })
  location?: AdministrativeDivision;

  @Property({ default: false })
  idVerified: boolean = false;

  @Property({ default: false })
  hidePictures: boolean = false;
}
