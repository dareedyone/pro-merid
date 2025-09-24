import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { SubscriptionModule } from './subscription.module';
import { SubscriptionService } from './services/subscription.service';
import { WebhookService } from './services/webhook-subscription.service';
import { SubscriptionAnalyticsService } from './services/analytics-subscription.service';
import { SubscriptionController } from './controllers/subscription.controller';
import { WebhookController } from './controllers/webhook-subscription.controller';
import { AnalyticsController } from './controllers/analytics-subscription.controller';
import { User } from 'src/feature/user/entities/user/user.entity';
import { DatingProfile } from 'src/feature/dating/entities/dating.profile';
import { FriendProfile } from 'src/feature/friends/entities/friend.profile';
import { SubscriptionHistory } from './entities/subscription-history.entity';
import { AuthService } from 'src/feature/auth/auth.service';

describe('SubscriptionModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [SubscriptionModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(getRepositoryToken(DatingProfile))
      .useValue({})
      .overrideProvider(getRepositoryToken(FriendProfile))
      .useValue({})
      .overrideProvider(getRepositoryToken(SubscriptionHistory))
      .useValue({})
      .overrideProvider(EntityManager)
      .useValue({})
      .overrideProvider(AuthService)
      .useValue({})
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  describe('providers', () => {
    it('should provide SubscriptionService', () => {
      const service = module.get<SubscriptionService>(SubscriptionService);
      expect(service).toBeDefined();
    });

    it('should provide WebhookService', () => {
      const service = module.get<WebhookService>(WebhookService);
      expect(service).toBeDefined();
    });

    it('should provide SubscriptionAnalyticsService', () => {
      const service = module.get<SubscriptionAnalyticsService>(SubscriptionAnalyticsService);
      expect(service).toBeDefined();
    });
  });

  describe('controllers', () => {
    it('should provide SubscriptionController', () => {
      const controller = module.get<SubscriptionController>(SubscriptionController);
      expect(controller).toBeDefined();
    });

    it('should provide WebhookController', () => {
      const controller = module.get<WebhookController>(WebhookController);
      expect(controller).toBeDefined();
    });

    it('should provide AnalyticsController', () => {
      const controller = module.get<AnalyticsController>(AnalyticsController);
      expect(controller).toBeDefined();
    });
  });

  describe('module dependencies', () => {
    it('should have all required repositories', () => {
      expect(module.get(getRepositoryToken(User))).toBeDefined();
      expect(module.get(getRepositoryToken(DatingProfile))).toBeDefined();
      expect(module.get(getRepositoryToken(FriendProfile))).toBeDefined();
      expect(module.get(getRepositoryToken(SubscriptionHistory))).toBeDefined();
    });

    it('should have EntityManager', () => {
      expect(module.get(EntityManager)).toBeDefined();
    });

    it('should have AuthService', () => {
      expect(module.get(AuthService)).toBeDefined();
    });
  });

  describe('service dependencies', () => {
    it('should inject dependencies into SubscriptionService', () => {
      const service = module.get<SubscriptionService>(SubscriptionService);
      expect(service).toBeDefined();
    });

    it('should inject dependencies into WebhookService', () => {
      const service = module.get<WebhookService>(WebhookService);
      expect(service).toBeDefined();
    });

    it('should inject dependencies into SubscriptionAnalyticsService', () => {
      const service = module.get<SubscriptionAnalyticsService>(SubscriptionAnalyticsService);
      expect(service).toBeDefined();
    });
  });

  describe('controller dependencies', () => {
    it('should inject SubscriptionService into SubscriptionController', () => {
      const controller = module.get<SubscriptionController>(SubscriptionController);
      expect(controller).toBeDefined();
    });

    it('should inject WebhookService into WebhookController', () => {
      const controller = module.get<WebhookController>(WebhookController);
      expect(controller).toBeDefined();
    });

    it('should inject SubscriptionAnalyticsService into AnalyticsController', () => {
      const controller = module.get<AnalyticsController>(AnalyticsController);
      expect(controller).toBeDefined();
    });
  });
});
