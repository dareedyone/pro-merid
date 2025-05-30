import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from './entities/user/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly em: EntityManager) {}

  // async findByEmail(email: string): Promise<User | null> {
  //   return this.em.findOne(User, { email });
  // }

  // async findByGoogleId(googleId: string): Promise<User | null> {
  //   return this.em.findOne(User, { googleId });
  // }

  // async findByAppleId(appleId: string): Promise<User | null> {
  //   return this.em.findOne(User, { appleId });
  // }

  async auth(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = this.em.create(User, data);
    await this.em.persistAndFlush(user);
    return user;
  }
}
