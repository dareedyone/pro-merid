import { Entity, Property, Unique, OneToOne, Enum } from '@mikro-orm/core';
import { User } from '../../user/entities/user/user.entity';
import { UserType } from 'src/common/types/enums/user.enum';
import { Anchor } from 'src/feature/user/entities/user/anchor.entity';
import { BaseTimeEntity } from 'src/common/entities/base.entity';

@Entity()
export class Auth extends BaseTimeEntity {
  @OneToOne(() => User, (user) => user.auth, { nullable: true })
  user?: User;

  @OneToOne(() => Anchor, (anchor) => anchor.auth, { nullable: true })
  anchor?: Anchor;

  @Property()
  @Unique()
  email!: string;

  @Property({ nullable: true })
  googleId?: string;

  @Property({ nullable: true })
  appleId?: string;

  @Property({ default: false })
  isEmailVerified?: boolean;

  @Property({ nullable: true })
  emailCode?: string;

  @Property()
  lastCodeSentAt?: Date;

  @Enum({
    items: () => UserType,
    default: UserType.USER,
  })
  role?: UserType;
}
