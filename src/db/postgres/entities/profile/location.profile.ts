import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Enum,
  OneToOne,
} from '@mikro-orm/core';
import { User } from '../user/user.entity';
import { AdministrativeDivision } from '../location/admin-division.entity';
import { Media } from '../media.entity';
import { LocationType } from 'src/types/enums/user.enum';
import { BaseTimeEntity } from '../generic/base.entity';
import { FilterProfile } from '../user/filter/relationship.filter';
import { DateProfile } from './date.profile';

@Entity()
export class LocationProfile extends BaseTimeEntity {
  @Enum({ items: () => LocationType, default: LocationType.CURRENT })
  type: LocationType;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => DateProfile)
  datingProfile!: DateProfile;

  @Property({ columnType: 'geometry(Point, 4326)', nullable: true })
  coordinates?: object;

  @ManyToOne(() => AdministrativeDivision, { nullable: true })
  location?: AdministrativeDivision;

  @OneToMany(() => Media, (media) => media.user)
  media = new Collection<Media>(this);

  @Property({ default: false })
  idVerified: boolean = false;

  @OneToOne(
    () => FilterProfile,
    (filterProfile) => filterProfile.locationProfile,
  )
  relationshipFilter?: FilterProfile;
}
