import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { EmailQueueService } from 'src/system/queue/email/email.qservice';
import { Auth } from '../auth/entities/auth.entity';
import { User } from './entities/user/user.entity';
import { Interest } from './entities/user/character/interest.entity';
import { Country } from '../location/entities/country.entity';
import { Profession } from './entities/user/character/profession.entity';
import { ReligionSect } from './entities/user/character/religion-sect.entity';
import { Ethnic } from '../location/entities/ethnic.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const mockEmailQueueService = { sendEmail: jest.fn() };
    const mockEntityManager = { persistAndFlush: jest.fn(), find: jest.fn() };
    const mockRepositories = { findOne: jest.fn(), findOneOrFail: jest.fn(), find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: EmailQueueService,
          useValue: mockEmailQueueService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: getRepositoryToken(Auth),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Interest),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Country),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Profession),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(ReligionSect),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Ethnic),
          useValue: mockRepositories,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
