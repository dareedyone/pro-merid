import {
  Entity,
  PrimaryKey,
  Property,
  BeforeCreate,
  Unique,
  OneToOne,
  BeforeUpdate,
  EventArgs,
  Enum,
  ManyToOne,
} from '@mikro-orm/core';
import { hash } from 'bcryptjs';
import { User } from './user/user.entity';
import { UserRole } from 'src/common/types/enums/user.enum';
import { Anchor } from 'src/modules/user/entities/user/anchor.entity';

@Entity()
export class Auth {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => User, (user) => user.auth)
  user?: User;

  @ManyToOne(() => Anchor, { nullable: true })
  anchor?: Anchor;

  @Property()
  @Unique()
  email!: string;

  @Property({ nullable: true })
  password?: string; // Nullable for OAuth users

  @Property({ nullable: true })
  googleId?: string;

  @Property({ nullable: true })
  appleId?: string;

  @Property({ default: false })
  isEmailVerified!: boolean;

  @Enum({
    items: () => UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @BeforeCreate()
  @BeforeUpdate()
  async hashPassword(args: EventArgs<Auth>): Promise<void> {
    const password = args.changeSet?.payload.password;

    if (password) {
      this.password = await hash(password, 10);
    }
  }
}
// add create and update timestamps
