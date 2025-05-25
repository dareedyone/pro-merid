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

  @OneToOne(() => User, (user) => user.auth, { nullable: true })
  user?: User;

  @OneToOne(() => User, (user) => user.auth, { nullable: true })
  anchor?: User;

  @Property()
  @Unique()
  email!: string;

  @Property({ nullable: true })
  passwordHash?: string; // Nullable for OAuth users

  @Property({ nullable: true })
  googleId?: string;

  @Property({ nullable: true })
  appleId?: string;

  @Property({ default: false })
  isEmailVerified!: boolean;

  @BeforeCreate()
  @BeforeUpdate()
  async hashPassword(args: EventArgs<Auth>): Promise<void> {
    const passwordHash = args.changeSet?.payload.passwordHash;

    if (passwordHash) {
      this.passwordHash = await hash(passwordHash, 10);
    }
  }
}
// add create and update timestamps
