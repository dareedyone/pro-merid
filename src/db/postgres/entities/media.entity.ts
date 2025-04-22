import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { User } from './user/user.entity';
import { FileType } from 'src/types/enums/other.enum';
import { SearchProfile } from './profile/location.profile';

@Entity()
export class Media {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => SearchProfile)
  searchProfile!: SearchProfile;

  @Property()
  filename!: string;

  @Property()
  url!: string;

  @Enum(() => FileType)
  fileType: FileType;

  @Property()
  order: number;
}
