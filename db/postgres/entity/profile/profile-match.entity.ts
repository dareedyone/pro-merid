import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { User } from '../user/user.entity';
import { BaseTimeEntity } from '../generic/base.entity';
import {
  ProfileInteractionType,
  ProfileType,
} from 'src/common/types/enums/other.enum';

@Entity()
export class ProfileMatch extends BaseTimeEntity {
  @Enum(() => ProfileInteractionType)
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
