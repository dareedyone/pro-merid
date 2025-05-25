import {
  Entity,
  PrimaryKey,
  Property,
  Collection,
  OneToMany,
} from '@mikro-orm/core';
import { User } from './user.entity';
import { Auth } from '../auth.entity';

@Entity()
export class Anchor {
  @PrimaryKey()
  id!: string;

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
