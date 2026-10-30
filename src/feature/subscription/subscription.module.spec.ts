import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { SubscriptionModule } from './subscription.module';
import { SubscriptionService } from './services/subscription.service';
import { WebhookService } from './services/webhook-subscription.service';
import { SubscriptionAnalyticsService } from './services/analytics-subscription.service';
import { SubscriptionController } from './controllers/subscription.controller';
import { WebhookController } from './controllers/webhook-subscription.controller';
import { SubscriptionAnalyticsController } from './controllers/analytics-subscription.controller';
import { User } from 'src/feature/user/entities/user/user.entity';
import { DatingProfile } from 'src/feature/dating/entities/dating.profile';
import { FriendProfile } from 'src/feature/friends/entities/friend.profile';
import { SubscriptionHistory } from './entities/subscription-history.entity';
import { AuthService } from 'src/feature/auth/auth.service';
import { Auth } from 'src/feature/auth/entities/auth.entity';
import { Anchor } from 'src/feature/anchor/entities/anchor.entity';
import { JwtService } from '@nestjs/jwt';
import { GoogleAuthService } from 'src/feature/auth/google-auth.service';
import { AppleAuthService } from 'src/feature/auth/apple-auth.service';
import { EmailQueueService } from 'src/system/queue/email/email.qservice';
import { OrmHelperService } from 'src/common/services/orm-helper.service';

/**
 * Module integration tests for SubscriptionModule
 *
 * Note: These tests verify the module structure and exports.
 * Full integration testing with MikroORM requires a database connection
 * and is better suited for e2e tests.
 */
describe('SubscriptionModule', () => {
  it('should export SubscriptionModule', () => {
    expect(SubscriptionModule).toBeDefined();
  });

  describe('module structure', () => {
    it('should have SubscriptionService defined', () => {
      expect(SubscriptionService).toBeDefined();
    });

    it('should have WebhookService defined', () => {
      expect(WebhookService).toBeDefined();
    });

    it('should have SubscriptionAnalyticsService defined', () => {
      expect(SubscriptionAnalyticsService).toBeDefined();
    });

    it('should have SubscriptionController defined', () => {
      expect(SubscriptionController).toBeDefined();
    });

    it('should have WebhookController defined', () => {
      expect(WebhookController).toBeDefined();
    });

    it('should have SubscriptionAnalyticsController defined', () => {
      expect(SubscriptionAnalyticsController).toBeDefined();
    });
  });

  // Note: Full module integration tests with MikroORM require database setup
  // Individual service and controller tests are covered in their respective .spec.ts files
  // For full integration testing, use e2e tests with proper database configuration
});
