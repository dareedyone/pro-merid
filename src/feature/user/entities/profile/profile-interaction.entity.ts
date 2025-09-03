import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import {
  ProfileInteractionType,
  ProfileType,
} from 'src/common/types/enums/other.enum';
import { User } from '../user/user.entity';

@Entity()
export class ProfileInteraction extends BaseTimeEntity {
  @Property(() => ProfileInteractionType)
  type!: ProfileInteractionType;

  @Property(() => ProfileInteractionType)
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
