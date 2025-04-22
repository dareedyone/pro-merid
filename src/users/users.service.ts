import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.em.findOne(User, { googleId });
  }

  async findByAppleId(appleId: string): Promise<User | null> {
    return this.em.findOne(User, { appleId });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = this.em.create(User, data);
    await this.em.persistAndFlush(user);
    return user;
  }
}
