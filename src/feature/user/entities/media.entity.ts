import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { User } from './user/user.entity';
import { DatingLocationProfile } from '../../dating/entities/dating-location.profile';
import { FriendProfile } from '../../friends/entities/friend.profile';

@Entity()
export class Media {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => DatingLocationProfile, {
    nullable: true,
  })
  datingLocationProfile?: DatingLocationProfile;

  @ManyToOne(() => FriendProfile, {
    nullable: true,
  })
  friendProfile?: FriendProfile;

  // @Property()
  // filename!: string;

  @Property()
  url!: string;

  // @Property(() => FileType)
  // fileType: FileType;

  @Property()
  fileType: string;

  @Property({ type: 'number' })
  order?: number;
  // 0 selfie, 1 main, from 2 - others

  @Property({ default: true })
  isUser?: boolean;
}
