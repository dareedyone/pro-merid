import {
  Entity,
  Property,
  Collection,
  OneToMany,
  OneToOne,
  Cascade,
} from '@mikro-orm/core';
import { User } from '../../user/entities/user/user.entity';
import { Auth } from '../../auth/entities/auth.entity';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { AnchorStatus } from 'src/feature/anchor/types/anchor.enum';

@Entity()
export class Anchor extends BaseTimeEntity {
  @OneToOne(() => Auth, (auth) => auth.user, {
    cascade: [Cascade.ALL],
    nullable: true,
  })
  auth?: Auth;

  @Property()
  name!: string;

  @Property()
  subdomain?: string;

  @Property({ type: 'json', nullable: true })
  config?: Record<string, any>; // logo, colors, settings, etc.

  @Property({ type: 'enum' })
  status: AnchorStatus = AnchorStatus.ACTIVE;

  @OneToMany(() => User, (user) => user.anchor)
  users = new Collection<User>(this);

  @OneToMany(() => Auth, (auth) => auth.anchor)
  authAccounts = new Collection<Auth>(this);

  @Property()
  createdAt = new Date();

  @Property()
  updatedAt = new Date();
}
