import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseTimeEntity } from 'src/common/entities/base.entity';

import {
  ProfileInteractionType,
  ProfileType,
} from 'src/common/types/enums/other.enum';
import { User } from '../user/user.entity';

@Entity()
export class ProfileMatch extends BaseTimeEntity {
  @Property(() => ProfileInteractionType)
  profileType!: ProfileType;

  @ManyToOne(() => User)
  user1!: User;

  @Property()
  profile1: string;

  @ManyToOne(() => User)
  user2!: User;

  @Property()
  profile2: string;
}
