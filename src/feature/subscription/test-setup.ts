/**
 * Test setup utilities for subscription module
 * This file provides common test utilities, mocks, and helpers
 * for testing the subscription feature
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { SubscriptionType, SubscriptionStatus } from './dtos/subscription.dto';
import { SubscriptionAction } from './entities/subscription-history.entity';

// Mock data factories
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  ...overrides,
});

export const createMockDatingProfile = (overrides: Partial<any> = {}) => ({
  id: 'dating-profile-123',
  user: createMockUser(),
  controlEndsAt: null,
  trueFyndEndsAt: null,
  ...overrides,
});

export const createMockFriendProfile = (overrides: Partial<any> = {}) => ({
  id: 'friend-profile-123',
  user: createMockUser(),
  controlEndsAt: null,
  ...overrides,
});

export const createMockSubscriptionHistory = (overrides: Partial<any> = {}) => ({
  id: 'history-123',
  user: createMockUser(),
  profileType: ProfileType.DATE,
  subscriptionType: 'control',
  action: SubscriptionAction.PURCHASED,
  status: SubscriptionStatus.ACTIVE,
  purchasedAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancelledAt: null,
  transactionId: 'txn-123',
  productId: 'com.spefynd.dating.control.monthly',
  amount: 9.99,
  currency: 'USD',
  receiptData: 'mock-receipt-data',
  reason: null,
  metadata: { source: 'api' },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock repositories
export const createMockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  persistAndFlush: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

export const createMockDatingProfileRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  persistAndFlush: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

export const createMockFriendProfileRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  persistAndFlush: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

export const createMockSubscriptionHistoryRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  persistAndFlush: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

// Mock EntityManager
export const createMockEntityManager = () => ({
  getConnection: jest.fn().mockReturnValue({
    execute: jest.fn(),
  }),
  persistAndFlush: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
});

// Mock AuthService
export const createMockAuthService = () => ({
  fetchAuthUser: jest.fn(),
  validateUser: jest.fn(),
  createUser: jest.fn(),
});

// Mock Logger
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

// Test data constants
export const TEST_CONSTANTS = {
  USER_ID: 'user-123',
  DATING_PROFILE_ID: 'dating-profile-123',
  FRIEND_PROFILE_ID: 'friend-profile-123',
  SUBSCRIPTION_HISTORY_ID: 'history-123',
  TRANSACTION_ID: 'txn-123',
  PRODUCT_ID_CONTROL: 'com.spefynd.dating.control.monthly',
  PRODUCT_ID_TRUEFYND: 'com.spefynd.dating.truefynd.onetime',
  PRODUCT_ID_FRIENDS: 'com.spefynd.friends.control.monthly',
  RECEIPT_DATA: 'mock-receipt-data',
  WEBHOOK_SIGNATURE: 'mock-webhook-signature',
  AMOUNT: 9.99,
  CURRENCY: 'USD',
} as const;

// Webhook payloads
export const createAppStoreWebhookPayload = (overrides: Partial<any> = {}) => ({
  notification_type: 'SUBSCRIBED',
  notification_uuid: 'test-uuid',
  data: {
    app_apple_id: 123456789,
    bundle_id: 'com.spefynd.app',
    environment: 'Sandbox',
    signed_transaction_info: 'mock-signed-transaction',
    signed_renewal_info: 'mock-signed-renewal',
  },
  version: '2.0',
  signed_date: Date.now(),
  ...overrides,
});

export const createPlayStoreWebhookPayload = (overrides: Partial<any> = {}) => ({
  version: '1.0',
  packageName: 'com.spefynd.app',
  eventTimeMillis: Date.now().toString(),
  subscriptionNotification: {
    version: '1.0',
    notificationType: 2, // SUBSCRIPTION_RENEWED
    purchaseToken: 'mock-purchase-token',
    subscriptionId: 'com.spefynd.dating.control.monthly',
  },
  ...overrides,
});

// DTOs
export const createPurchaseSubscriptionDto = (overrides: Partial<any> = {}) => ({
  profileType: ProfileType.DATE,
  subscriptionType: SubscriptionType.CONTROL,
  receiptData: TEST_CONSTANTS.RECEIPT_DATA,
  transactionId: TEST_CONSTANTS.TRANSACTION_ID,
  productId: TEST_CONSTANTS.PRODUCT_ID_CONTROL,
  ...overrides,
});

export const createRenewSubscriptionDto = (overrides: Partial<any> = {}) => ({
  profileType: ProfileType.DATE,
  subscriptionType: SubscriptionType.CONTROL,
  receiptData: TEST_CONSTANTS.RECEIPT_DATA,
  transactionId: TEST_CONSTANTS.TRANSACTION_ID,
  productId: TEST_CONSTANTS.PRODUCT_ID_CONTROL,
  ...overrides,
});

export const createCancelSubscriptionDto = (overrides: Partial<any> = {}) => ({
  profileType: ProfileType.DATE,
  subscriptionType: SubscriptionType.CONTROL,
  reason: 'User requested cancellation',
  ...overrides,
});

// Analytics mock data
export const createMockAnalytics = () => ({
  totalSubscriptions: 1000,
  activeSubscriptions: 800,
  expiredSubscriptions: 150,
  cancelledSubscriptions: 50,
  totalRevenue: 50000,
  thisMonthRevenue: 5000,
  lastMonthRevenue: 4500,
  revenueGrowth: 11.11,
  controlSubscriptions: 200,
  truefyndSubscriptions: 100,
  datingSubscriptions: 600,
  friendsSubscriptions: 400,
  activeInLast30Days: 50,
  churnRate: 6.25,
  averageDuration: 30.5,
  averageDurationDays: 30.5,
});

export const createMockTrends = () => ({
  daily: [
    { date: '2024-01-01', subscriptions: 10, revenue: 1000 },
    { date: '2024-01-02', subscriptions: 15, revenue: 1500 },
  ],
  weekly: [
    { week: '2024-01-01', subscriptions: 50, revenue: 5000 },
    { week: '2024-01-08', subscriptions: 60, revenue: 6000 },
  ],
  monthly: [
    { month: '2024-01-01', subscriptions: 200, revenue: 20000 },
  ],
});

export const createMockUserMetrics = () => ({
  totalSpent: 1500,
  totalSubscriptions: 7,
  activeSubscriptions: 3,
  averageDuration: 45.5,
  averageDurationDays: 45.5,
  preferredSubscriptionType: 'control',
});

// Test utilities
export const expectToBeCalledWith = (mockFn: jest.Mock, expectedArgs: any[]) => {
  expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
};

export const expectToBeCalledTimes = (mockFn: jest.Mock, times: number) => {
  expect(mockFn).toHaveBeenCalledTimes(times);
};

export const expectToBeCalled = (mockFn: jest.Mock) => {
  expect(mockFn).toHaveBeenCalled();
};

export const expectNotToBeCalled = (mockFn: jest.Mock) => {
  expect(mockFn).not.toHaveBeenCalled();
};

// Date utilities
export const createDate = (daysFromNow: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

export const createExpirationDate = (subscriptionType: SubscriptionType) => {
  const days = subscriptionType === SubscriptionType.CONTROL ? 30 : 365;
  return createDate(days);
};

// Error utilities
export const createMockError = (message: string = 'Test error') => {
  return new Error(message);
};

export const createMockBadRequestException = (message: string = 'Bad request') => {
  const error = new Error(message);
  error.name = 'BadRequestException';
  return error;
};

// Environment setup
export const setupTestEnvironment = () => {
  process.env.WEBHOOK_APP_STORE_SECRET = 'test-app-store-secret';
  process.env.WEBHOOK_PLAY_STORE_SECRET = 'test-play-store-secret';
  process.env.APP_STORE_VERIFY_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
  process.env.APP_STORE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
  process.env.APP_STORE_SHARED_SECRET = 'test-shared-secret';
  process.env.PLAY_STORE_VERIFY_URL = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
  process.env.PLAY_STORE_SERVICE_ACCOUNT_KEY = 'test-service-account-key';
};

export const cleanupTestEnvironment = () => {
  delete process.env.WEBHOOK_APP_STORE_SECRET;
  delete process.env.WEBHOOK_PLAY_STORE_SECRET;
  delete process.env.APP_STORE_VERIFY_URL;
  delete process.env.APP_STORE_SANDBOX_URL;
  delete process.env.APP_STORE_SHARED_SECRET;
  delete process.env.PLAY_STORE_VERIFY_URL;
  delete process.env.PLAY_STORE_SERVICE_ACCOUNT_KEY;
};

// Database query mocks
export const createMockDatabaseResult = (data: any) => [data];

export const createMockCountResult = (count: number) => count;

export const createMockExecuteResult = (data: any[]) => data;

// Subscription plan mocks
export const createMockSubscriptionPlans = (profileType: ProfileType) => {
  if (profileType === ProfileType.DATE) {
    return [
      {
        type: SubscriptionType.CONTROL,
        name: 'Control',
        description: 'Full access to all filters',
        price: 9.99,
        currency: 'USD',
        duration: 30,
        features: ['All filters', 'Unlimited matches'],
      },
      {
        type: SubscriptionType.TRUEFYND,
        name: 'TrueFynd',
        description: 'One-time premium access',
        price: 29.99,
        currency: 'USD',
        duration: 365,
        features: ['All filters', 'Unlimited matches', 'Priority support'],
      },
    ];
  } else {
    return [
      {
        type: SubscriptionType.CONTROL,
        name: 'Control',
        description: 'Full access to all filters',
        price: 9.99,
        currency: 'USD',
        duration: 30,
        features: ['All filters', 'Unlimited matches'],
      },
    ];
  }
};

// Status mocks
export const createMockSubscriptionStatus = (profileType: ProfileType, overrides: Partial<any> = {}) => ({
  profileType,
  hasControl: false,
  hasTrueFynd: false,
  controlExpiresAt: null,
  trueFyndExpiresAt: null,
  isActive: false,
  ...overrides,
});
