import { SubscriptionHistory, SubscriptionAction } from './subscription-history.entity';
import { SubscriptionStatus } from '../dtos/subscription.dto';
import { ProfileType } from 'src/common/types/enums/other.enum';

describe('SubscriptionHistory Entity', () => {
  let subscriptionHistory: SubscriptionHistory;

  beforeEach(() => {
    subscriptionHistory = new SubscriptionHistory();
  });

  it('should be defined', () => {
    expect(subscriptionHistory).toBeDefined();
  });

  describe('entity properties', () => {
    it('should have all required properties', () => {
      expect(subscriptionHistory).toHaveProperty('id');
      expect(subscriptionHistory).toHaveProperty('user');
      expect(subscriptionHistory).toHaveProperty('profileType');
      expect(subscriptionHistory).toHaveProperty('subscriptionType');
      expect(subscriptionHistory).toHaveProperty('action');
      expect(subscriptionHistory).toHaveProperty('status');
      expect(subscriptionHistory).toHaveProperty('purchasedAt');
      expect(subscriptionHistory).toHaveProperty('expiresAt');
      expect(subscriptionHistory).toHaveProperty('cancelledAt');
      expect(subscriptionHistory).toHaveProperty('transactionId');
      expect(subscriptionHistory).toHaveProperty('productId');
      expect(subscriptionHistory).toHaveProperty('amount');
      expect(subscriptionHistory).toHaveProperty('currency');
      expect(subscriptionHistory).toHaveProperty('receiptData');
      expect(subscriptionHistory).toHaveProperty('reason');
      expect(subscriptionHistory).toHaveProperty('metadata');
      expect(subscriptionHistory).toHaveProperty('createdAt');
      expect(subscriptionHistory).toHaveProperty('updatedAt');
    });
  });

  describe('SubscriptionAction enum', () => {
    it('should have all required action values', () => {
      expect(SubscriptionAction.PURCHASED).toBe('purchased');
      expect(SubscriptionAction.RENEWED).toBe('renewed');
      expect(SubscriptionAction.CANCELLED).toBe('cancelled');
      expect(SubscriptionAction.REFUNDED).toBe('refunded');
    });
  });

  describe('entity creation', () => {
    it('should create entity with valid data', () => {
      const mockUser = { id: 'user-1' } as any;
      const now = new Date();

      subscriptionHistory.id = 'history-1';
      subscriptionHistory.user = mockUser;
      subscriptionHistory.profileType = ProfileType.DATE;
      subscriptionHistory.subscriptionType = 'control';
      subscriptionHistory.action = SubscriptionAction.PURCHASED;
      subscriptionHistory.status = SubscriptionStatus.ACTIVE;
      subscriptionHistory.purchasedAt = now;
      subscriptionHistory.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      subscriptionHistory.transactionId = 'txn-123';
      subscriptionHistory.productId = 'com.spefynd.dating.control.monthly';
      subscriptionHistory.amount = 9.99;
      subscriptionHistory.currency = 'USD';
      subscriptionHistory.receiptData = 'mock-receipt-data';
      subscriptionHistory.metadata = { source: 'api' };
      subscriptionHistory.createdAt = now;
      subscriptionHistory.updatedAt = now;

      expect(subscriptionHistory.id).toBe('history-1');
      expect(subscriptionHistory.user).toBe(mockUser);
      expect(subscriptionHistory.profileType).toBe(ProfileType.DATE);
      expect(subscriptionHistory.subscriptionType).toBe('control');
      expect(subscriptionHistory.action).toBe(SubscriptionAction.PURCHASED);
      expect(subscriptionHistory.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscriptionHistory.purchasedAt).toBe(now);
      expect(subscriptionHistory.transactionId).toBe('txn-123');
      expect(subscriptionHistory.productId).toBe('com.spefynd.dating.control.monthly');
      expect(subscriptionHistory.amount).toBe(9.99);
      expect(subscriptionHistory.currency).toBe('USD');
      expect(subscriptionHistory.receiptData).toBe('mock-receipt-data');
      expect(subscriptionHistory.metadata).toEqual({ source: 'api' });
    });

    it('should handle nullable fields', () => {
      subscriptionHistory.expiresAt = undefined;
      subscriptionHistory.cancelledAt = undefined;
      subscriptionHistory.transactionId = undefined;
      subscriptionHistory.productId = undefined;
      subscriptionHistory.amount = undefined;
      subscriptionHistory.currency = undefined;
      subscriptionHistory.receiptData = undefined;
      subscriptionHistory.reason = undefined;
      subscriptionHistory.metadata = undefined;

      expect(subscriptionHistory.expiresAt).toBeUndefined();
      expect(subscriptionHistory.cancelledAt).toBeUndefined();
      expect(subscriptionHistory.transactionId).toBeUndefined();
      expect(subscriptionHistory.productId).toBeUndefined();
      expect(subscriptionHistory.amount).toBeUndefined();
      expect(subscriptionHistory.currency).toBeUndefined();
      expect(subscriptionHistory.receiptData).toBeUndefined();
      expect(subscriptionHistory.reason).toBeUndefined();
      expect(subscriptionHistory.metadata).toBeUndefined();
    });
  });

  describe('subscription types', () => {
    it('should support dating profile subscriptions', () => {
      subscriptionHistory.profileType = ProfileType.DATE;
      subscriptionHistory.subscriptionType = 'control';

      expect(subscriptionHistory.profileType).toBe(ProfileType.DATE);
      expect(subscriptionHistory.subscriptionType).toBe('control');
    });

    it('should support friends profile subscriptions', () => {
      subscriptionHistory.profileType = ProfileType.FRIEND;
      subscriptionHistory.subscriptionType = 'control';

      expect(subscriptionHistory.profileType).toBe(ProfileType.FRIEND);
      expect(subscriptionHistory.subscriptionType).toBe('control');
    });

    it('should support TrueFynd subscriptions for dating', () => {
      subscriptionHistory.profileType = ProfileType.DATE;
      subscriptionHistory.subscriptionType = 'truefynd';

      expect(subscriptionHistory.profileType).toBe(ProfileType.DATE);
      expect(subscriptionHistory.subscriptionType).toBe('truefynd');
    });
  });

  describe('subscription statuses', () => {
    it('should support active status', () => {
      subscriptionHistory.status = SubscriptionStatus.ACTIVE;
      expect(subscriptionHistory.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should support cancelled status', () => {
      subscriptionHistory.status = SubscriptionStatus.CANCELLED;
      expect(subscriptionHistory.status).toBe(SubscriptionStatus.CANCELLED);
    });

    it('should support expired status', () => {
      subscriptionHistory.status = SubscriptionStatus.EXPIRED;
      expect(subscriptionHistory.status).toBe(SubscriptionStatus.EXPIRED);
    });
  });

  describe('subscription actions', () => {
    it('should support purchased action', () => {
      subscriptionHistory.action = SubscriptionAction.PURCHASED;
      expect(subscriptionHistory.action).toBe(SubscriptionAction.PURCHASED);
    });

    it('should support renewed action', () => {
      subscriptionHistory.action = SubscriptionAction.RENEWED;
      expect(subscriptionHistory.action).toBe(SubscriptionAction.RENEWED);
    });

    it('should support cancelled action', () => {
      subscriptionHistory.action = SubscriptionAction.CANCELLED;
      expect(subscriptionHistory.action).toBe(SubscriptionAction.CANCELLED);
    });

    it('should support refunded action', () => {
      subscriptionHistory.action = SubscriptionAction.REFUNDED;
      expect(subscriptionHistory.action).toBe(SubscriptionAction.REFUNDED);
    });
  });

  describe('metadata handling', () => {
    it('should store complex metadata objects', () => {
      const complexMetadata = {
        source: 'webhook',
        timestamp: new Date().toISOString(),
        webhookId: 'webhook-123',
        additionalData: {
          platform: 'ios',
          version: '1.0.0',
        },
      };

      subscriptionHistory.metadata = complexMetadata;

      expect(subscriptionHistory.metadata).toEqual(complexMetadata);
    });

    it('should handle simple metadata', () => {
      const simpleMetadata = {
        source: 'api',
        timestamp: new Date().toISOString(),
      };

      subscriptionHistory.metadata = simpleMetadata;

      expect(subscriptionHistory.metadata).toEqual(simpleMetadata);
    });
  });

  describe('date handling', () => {
    it('should handle valid date ranges', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      subscriptionHistory.purchasedAt = now;
      subscriptionHistory.expiresAt = futureDate;

      expect(subscriptionHistory.purchasedAt).toBe(now);
      expect(subscriptionHistory.expiresAt).toBe(futureDate);
      expect(subscriptionHistory.expiresAt!.getTime()).toBeGreaterThan(
        subscriptionHistory.purchasedAt.getTime(),
      );
    });

    it('should handle same day purchase and expiry', () => {
      const now = new Date();
      const sameDay = new Date(now.getTime() + 1000); // 1 second later

      subscriptionHistory.purchasedAt = now;
      subscriptionHistory.expiresAt = sameDay;

      expect(subscriptionHistory.purchasedAt).toBe(now);
      expect(subscriptionHistory.expiresAt).toBe(sameDay);
    });
  });

  describe('amount and currency', () => {
    it('should handle decimal amounts', () => {
      subscriptionHistory.amount = 9.99;
      subscriptionHistory.currency = 'USD';

      expect(subscriptionHistory.amount).toBe(9.99);
      expect(subscriptionHistory.currency).toBe('USD');
    });

    it('should handle different currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'CAD'];
      
      currencies.forEach(currency => {
        subscriptionHistory.currency = currency;
        expect(subscriptionHistory.currency).toBe(currency);
      });
    });

    it('should handle zero amounts', () => {
      subscriptionHistory.amount = 0;
      expect(subscriptionHistory.amount).toBe(0);
    });
  });

  describe('receipt data handling', () => {
    it('should handle base64 encoded receipts', () => {
      const receiptData = Buffer.from(JSON.stringify({
        receipt: 'mock-receipt-data',
      })).toString('base64');

      subscriptionHistory.receiptData = receiptData;

      expect(subscriptionHistory.receiptData).toBe(receiptData);
    });

    it('should handle JSON string receipts', () => {
      const receiptData = JSON.stringify({
        purchaseToken: 'mock-token',
        orderId: 'mock-order',
      });

      subscriptionHistory.receiptData = receiptData;

      expect(subscriptionHistory.receiptData).toBe(receiptData);
    });
  });
});
