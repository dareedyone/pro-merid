import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { User } from './entities/user/user.entity';
import { EmailQueueService } from 'src/system/queue/email/email.queue';
import { Auth } from '../auth/entities/auth.entity';
import { Anchor } from './entities/user/anchor.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly em: EntityManager,
    private readonly emailQueueService: EmailQueueService,
    @InjectRepository(Auth) private authRepo: EntityRepository<Auth>,
    @InjectRepository(User) private userRepo: EntityRepository<User>,
    @InjectRepository(Anchor) private anchorRepo: EntityRepository<Anchor>,
  ) {}

  // async findByEmail(email: string): Promise<User | null> {
  //   return this.em.findOne(User, { email });
  // }

  // async findByGoogleId(googleId: string): Promise<User | null> {
  //   return this.em.findOne(User, { googleId });
  // }

  // async findByAppleId(appleId: string): Promise<User | null> {
  //   return this.em.findOne(User, { appleId });
  // }

  // async auth(email: string): Promise<User | null> {
  //   return this.em.findOne(User, { email });
  // }

  // async createUser(data: Partial<User>): Promise<User> {
  //   const user = this.userRepo.create({});
  //   await this.em.persistAndFlush(user);
  //   return user;
  // }
  // base onboard
  async onboard(authId: string, payload: CreateUserDto): Promise<void> {
    const user = this.userRepo.create({
      ...payload,
      auth: this.authRepo.getReference(authId),
    });
    await this.em.persistAndFlush(user);
  }

  async update(authId: string, payload: CreateUserDto): Promise<void> {
    const user = this.userRepo.create({
      ...payload,
      auth: this.authRepo.getReference(authId),
    });
    await this.em.persistAndFlush(user);
  }

  // friend or date onboard

  // should update handle files and id verification?

  async fetchUser(authId: string, payload: CreateUserDto): Promise<User> {
    const user = this.userRepo.create({
      ...payload,
      auth: this.authRepo.getReference(authId),
    });
    await this.em.persistAndFlush(user);
    return user;
  }

  // findLovers

  // subscribe

  // compatible match

  // deleteAcc
  // : anchor realm ?
  // like - one or many ?
  //  dont like
  // views
  // match
  // unmatch
  // chat
}
