import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { User } from '../user/user.entity';
import { BaseTimeEntity } from '../generic/base.entity';
import {
  ProfileInteractionType,
  ProfileType,
} from 'src/common/types/enums/other.enum';

@Entity()
export class ProfileInteraction extends BaseTimeEntity {
  @Enum(() => ProfileInteractionType)
  type!: ProfileInteractionType;

  @Enum(() => ProfileInteractionType)
  profileType!: ProfileType;

  @ManyToOne(() => User)
  sourceUser!: User;

  @Property()
  sourceProfileId: string;

  @ManyToOne(() => User)
  targetUser!: User;

  @Property()
  targetProfileId: string;

  @Property({ default: false })
  matched: boolean = false;
}
