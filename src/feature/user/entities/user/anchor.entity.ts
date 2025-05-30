import {
  Entity,
  Property,
  Collection,
  OneToMany,
  OneToOne,
  Cascade,
} from '@mikro-orm/core';
import { User } from './user.entity';
import { Auth } from '../../../auth/entities/auth.entity';
import { BaseTimeEntity } from 'src/common/entities/base.entity';

@Entity()
export class Anchor extends BaseTimeEntity {
  @OneToOne(() => Auth, (auth) => auth.user, {
    cascade: [Cascade.ALL],
  })
  auth!: Auth;

  @Property()
  name!: string;

  @Property()
  subdomain?: string;

  @Property({ type: 'json', nullable: true })
  config?: Record<string, any>; // logo, colors, settings, etc.

  @OneToMany(() => User, (user) => user.anchor)
  users = new Collection<User>(this);

  @OneToMany(() => Auth, (auth) => auth.anchor)
  authAccounts = new Collection<Auth>(this);

  @Property()
  createdAt = new Date();
}
