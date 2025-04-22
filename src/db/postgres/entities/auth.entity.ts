import {
  Entity,
  PrimaryKey,
  Property,
  BeforeCreate,
  Unique,
  OneToOne,
  BeforeUpdate,
  EventArgs,
} from '@mikro-orm/core';
import { hash } from 'bcryptjs';
import { User } from './user/user.entity';

@Entity()
export class Auth {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => User, (user) => user.auth)
  user!: User;

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
