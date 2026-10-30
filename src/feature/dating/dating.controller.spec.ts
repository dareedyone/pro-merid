import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import { DatingController } from './dating.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DatingService } from './dating.service';
import { InteractionService } from '../../common/services/interaction.service';
import { AuthService } from '../auth/auth.service';
import { SubscriptionService } from '../subscription/services/subscription.service';
import { MediaQueueService } from 'src/system/queue/media/media.qservice';
import { JobContextService } from 'src/system/queue/job-context.service';
import { GeoFallbackService } from '../location/geo-fallback.service';
import { NotificationService } from '../../system/notification/notification.service';
import { ChatService } from '../chat/chat.service';
import { DatingLocationProfile } from './entities/dating-location.profile';
import { DatingProfile } from './entities/dating.profile';
import { DatingPersonality } from './entities/dating.personality.entity';
import { DatingRelationship } from './entities/dating-relationship.entity';
import { DatingFilter } from './entities/dating.filter';
import { Media } from '../user/entities/media.entity';
import { User } from '../user/entities/user/user.entity';
import { Country } from '../location/entities/country.entity';
import { Region } from '../location/entities/region.entity';
import { ProfileInteraction } from '../user/entities/profile/profile-interaction.entity';
import { Match } from '../../common/entities/match.entity';

describe('DatingController', () => {
  let controller: DatingController;

  beforeEach(async () => {
    const mockMediaQueueService = { queueMediaJob: jest.fn() };
    const mockConfigService = { get: jest.fn() };
    const mockEntityManager = { persistAndFlush: jest.fn(), find: jest.fn() };
    const mockJobContextService = { createContext: jest.fn() };
    const mockAuthService = { fetchAuthUser: jest.fn() };
    const mockGeoFallbackService = { reverseGeocode: jest.fn() };
    const mockNotificationService = { sendNotification: jest.fn() };
    const mockChatService = { createChat: jest.fn() };
    const mockInteractionService = {
      interactWithProfile: jest.fn(),
      createInteraction: jest.fn(),
      unmatch: jest.fn(),
    };
    const mockSubscriptionService = { getUserSubscription: jest.fn() };
    const mockRepositories = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findOneOrFail: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatingController],
      providers: [
        DatingService,
        {
          provide: InteractionService,
          useValue: mockInteractionService,
        },
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
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
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
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: getRepositoryToken(ProfileInteraction),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Match),
          useValue: mockRepositories,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DatingController>(DatingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
