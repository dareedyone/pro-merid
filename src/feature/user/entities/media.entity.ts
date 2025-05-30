import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { User } from './user/user.entity';
import { FileType } from 'src/common/types/enums/other.enum';
import { DateLocationProfile } from './profile/date-location.profile';
import { FriendLocationProfile } from './profile/friend-location.profile';

@Entity()
export class Media {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => DateLocationProfile, {
    nullable: true,
  })
  dateLocationProfile?: DateLocationProfile;

  @ManyToOne(() => FriendLocationProfile, {
    nullable: true,
  })
  friendLocationProfile?: FriendLocationProfile;

  @Property()
  filename!: string;

  @Property()
  url!: string;

  @Enum(() => FileType)
  fileType: FileType;

  @Property()
  order: number;
}
