import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import { DatingService } from './dating.service';
import { MediaQueueService } from 'src/system/queue/media/media.qservice';
import { JobContextService } from 'src/system/queue/job-context.service';
import { AuthService } from '../auth/auth.service';
import { GeoFallbackService } from '../location/geo-fallback.service';
import { DatingLocationProfile } from './entities/dating-location.profile';
import { DatingProfile } from './entities/dating.profile';
import { DatingPersonality } from './entities/dating.personality.entity';
import { DatingRelationship } from './entities/dating-relationship.entity';
import { DatingFilter } from './entities/dating.filter';
import { Media } from '../user/entities/media.entity';
import { User } from '../user/entities/user/user.entity';
import { Country } from '../location/entities/country.entity';
import { Region } from '../location/entities/region.entity';

describe('DatingService', () => {
  let service: DatingService;

  beforeEach(async () => {
    const mockMediaQueueService = {
      queueMediaJob: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockEntityManager = {
      persistAndFlush: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockJobContextService = {
      createContext: jest.fn(),
    };

    const mockAuthService = {
      fetchAuthUser: jest.fn(),
    };

    const mockGeoFallbackService = {
      reverseGeocode: jest.fn(),
    };

    const mockRepositories = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatingService,
        {
          provide: MediaQueueService,
          useValue: mockMediaQueueService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: JobContextService,
          useValue: mockJobContextService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: GeoFallbackService,
          useValue: mockGeoFallbackService,
        },
        {
          provide: getRepositoryToken(DatingLocationProfile),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(DatingProfile),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(DatingPersonality),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(DatingRelationship),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(DatingFilter),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Media),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Country),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Region),
          useValue: mockRepositories,
        },
      ],
    }).compile();

    service = module.get<DatingService>(DatingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
