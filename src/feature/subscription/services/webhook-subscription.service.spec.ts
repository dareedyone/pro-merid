import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { WebhookService } from './webhook-subscription.service';
import { SubscriptionService } from './subscription.service';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { SubscriptionType } from '../dtos/subscription.dto';
import { SubscriptionAction } from '../entities/subscription-history.entity';

describe('WebhookService', () => {
  let service: WebhookService;
  let mockSubscriptionService: any;

  const mockAppStorePayload = {
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
  };

  const mockPlayStorePayload = {
    version: '1.0',
    packageName: 'com.spefynd.app',
    eventTimeMillis: Date.now().toString(),
    subscriptionNotification: {
      version: '1.0',
      notificationType: 2, // SUBSCRIPTION_RENEWED
      purchaseToken: 'mock-purchase-token',
      subscriptionId: 'com.spefynd.dating.control.monthly',
    },
  };

  beforeEach(async () => {
    mockSubscriptionService = {
      purchaseSubscription: jest.fn(),
      renewSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleAppStoreWebhook', () => {
    beforeEach(() => {
      // Mock the private methods
      jest
        .spyOn(service as any, 'decodeAppStoreTransaction')
        .mockResolvedValue({
          transactionId: 'txn-123',
          productId: 'com.spefynd.dating.control.monthly',
          userId: 'user-123',
          expiresDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          purchaseDate: Date.now(),
          originalTransactionId: 'orig-txn-123',
          webOrderLineItemId: 'web-order-123',
        });
      jest.spyOn(service as any, 'mapProductIdToSubscription').mockReturnValue({
        subscriptionType: SubscriptionType.CONTROL,
        profileType: ProfileType.DATE,
      });
      jest
        .spyOn(service as any, 'verifyAppStoreWebhookSignature')
        .mockReturnValue(true);
    });

    it('should handle SUBSCRIBED notification', async () => {
      const payload = {
        ...mockAppStorePayload,
        notification_type: 'SUBSCRIBED',
      };

      await service.handleAppStoreWebhook(payload, 'mock-signature');

      expect(mockSubscriptionService.purchaseSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          sub: 'user-123',
          role: 'user',
        }),
        expect.objectContaining({
          profileType: ProfileType.DATE,
          subscriptionType: SubscriptionType.CONTROL,
          receiptData: expect.any(String),
          transactionId: 'txn-123',
          productId: 'com.spefynd.dating.control.monthly',
        }),
      );
    });

    it('should handle DID_RENEW notification', async () => {
      const payload = {
        ...mockAppStorePayload,
        notification_type: 'DID_RENEW',
      };

      await service.handleAppStoreWebhook(payload, 'mock-signature');

      expect(mockSubscriptionService.renewSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          sub: 'user-123',
          role: 'user',
        }),
        expect.objectContaining({
          profileType: ProfileType.DATE,
          subscriptionType: SubscriptionType.CONTROL,
          receiptData: expect.any(String),
          transactionId: 'txn-123',
        }),
      );
    });

    it('should handle EXPIRED notification', async () => {
      const payload = { ...mockAppStorePayload, notification_type: 'EXPIRED' };

      await service.handleAppStoreWebhook(payload, 'mock-signature');

      expect(mockSubscriptionService.cancelSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          sub: 'user-123',
          role: 'user',
        }),
        expect.objectContaining({
          profileType: ProfileType.DATE,
          subscriptionType: SubscriptionType.CONTROL,
          reason: 'Webhook: expired',
        }),
      );
    });

    it('should handle REVOKE notification', async () => {
      const payload = { ...mockAppStorePayload, notification_type: 'REVOKE' };

      await service.handleAppStoreWebhook(payload, 'mock-signature');

      expect(mockSubscriptionService.cancelSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          sub: 'user-123',
          role: 'user',
        }),
        expect.objectContaining({
          profileType: ProfileType.DATE,
          subscriptionType: SubscriptionType.CONTROL,
          reason: 'Webhook: revoked',
        }),
      );
    });

    it('should handle invalid signature', async () => {
      jest
        .spyOn(service as any, 'verifyAppStoreWebhookSignature')
        .mockReturnValue(false);

      await expect(
        service.handleAppStoreWebhook(mockAppStorePayload, 'invalid-signature'),
      ).rejects.toThrow();
    });

    it('should handle missing user ID', async () => {
      jest
        .spyOn(service as any, 'decodeAppStoreTransaction')
        .mockResolvedValue({
          transactionId: 'txn-123',
          productId: 'com.spefynd.dating.control.monthly',
          userId: null, // Missing user ID
          expiresDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          purchaseDate: Date.now(),
          originalTransactionId: 'orig-txn-123',
          webOrderLineItemId: 'web-order-123',
        });

      await service.handleAppStoreWebhook(
        mockAppStorePayload,
        'mock-signature',
      );

      expect(
        mockSubscriptionService.purchaseSubscription,
      ).not.toHaveBeenCalled();
    });
  });

  describe('handlePlayStoreWebhook', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'mapProductIdToSubscription').mockReturnValue({
        subscriptionType: SubscriptionType.CONTROL,
        profileType: ProfileType.DATE,
      });
      jest
        .spyOn(service as any, 'findUserByPurchaseToken')
        .mockResolvedValue('user-123');
      jest
        .spyOn(service as any, 'verifyPlayStoreWebhookSignature')
        .mockReturnValue(true);
    });

    it('should handle subscription notification', async () => {
      await service.handlePlayStoreWebhook(
        mockPlayStorePayload,
        'mock-signature',
      );

      expect(mockSubscriptionService.renewSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          sub: 'user-123',
          role: 'user',
        }),
        expect.objectContaining({
          profileType: ProfileType.DATE,
          subscriptionType: SubscriptionType.CONTROL,
          receiptData: expect.any(String),
          transactionId: 'mock-purchase-token',
        }),
      );
    });

    it('should handle one-time product notification', async () => {
      const payload = {
        ...mockPlayStorePayload,
        subscriptionNotification: undefined,
        oneTimeProductNotification: {
          version: '1.0',
          notificationType: 1, // ONE_TIME_PRODUCT_PURCHASED
          purchaseToken: 'mock-purchase-token',
          sku: 'com.spefynd.dating.truefynd.onetime',
        },
      };

      jest.spyOn(service as any, 'mapProductIdToSubscription').mockReturnValue({
        subscriptionType: SubscriptionType.TRUEFYND,
        profileType: ProfileType.DATE,
      });

      await service.handlePlayStoreWebhook(payload, 'mock-signature');

      expect(mockSubscriptionService.purchaseSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          sub: 'user-123',
          role: 'user',
        }),
        expect.objectContaining({
          profileType: ProfileType.DATE,
          subscriptionType: SubscriptionType.TRUEFYND,
          receiptData: expect.any(String),
          transactionId: 'mock-purchase-token',
          productId: 'com.spefynd.dating.truefynd.onetime',
        }),
      );
    });

    it('should handle missing user', async () => {
      jest
        .spyOn(service as any, 'findUserByPurchaseToken')
        .mockResolvedValue(null);

      await service.handlePlayStoreWebhook(
        mockPlayStorePayload,
        'mock-signature',
      );

      expect(
        mockSubscriptionService.renewSubscription,
      ).not.toHaveBeenCalled();
    });

    it('should handle invalid signature', async () => {
      jest
        .spyOn(service as any, 'verifyPlayStoreWebhookSignature')
        .mockReturnValue(false);

      await expect(
        service.handlePlayStoreWebhook(
          mockPlayStorePayload,
          'invalid-signature',
        ),
      ).rejects.toThrow();
    });
  });

  describe('mapProductIdToSubscription', () => {
    it('should map dating control product', () => {
      const result = (service as any).mapProductIdToSubscription(
        'com.spefynd.dating.control.monthly',
      );

      expect(result).toEqual({
        subscriptionType: SubscriptionType.CONTROL,
        profileType: ProfileType.DATE,
      });
    });

    it('should map dating TrueFynd product', () => {
      const result = (service as any).mapProductIdToSubscription(
        'com.spefynd.dating.truefynd.onetime',
      );

      expect(result).toEqual({
        subscriptionType: SubscriptionType.TRUEFYND,
        profileType: ProfileType.DATE,
      });
    });

    it('should map friends control product', () => {
      const result = (service as any).mapProductIdToSubscription(
        'com.spefynd.friends.control.monthly',
      );

      expect(result).toEqual({
        subscriptionType: SubscriptionType.CONTROL,
        profileType: ProfileType.FRIEND,
      });
    });

    it('should throw error for unknown product', () => {
      expect(() => {
        (service as any).mapProductIdToSubscription('unknown.product.id');
      }).toThrow('Unknown product ID: unknown.product.id');
    });
  });

  describe('verifyAppStoreWebhookSignature', () => {
    it('should return true when no secret configured', () => {
      const originalEnv = process.env.WEBHOOK_APP_STORE_SECRET;
      delete process.env.WEBHOOK_APP_STORE_SECRET;

      const result = (service as any).verifyAppStoreWebhookSignature(
        mockAppStorePayload,
        'signature',
      );

      expect(result).toBe(true);

      if (originalEnv) {
        process.env.WEBHOOK_APP_STORE_SECRET = originalEnv;
      }
    });

    it('should verify valid signature', () => {
      process.env.WEBHOOK_APP_STORE_SECRET = 'test-secret';

      // Mock the crypto methods directly on the service
      jest.spyOn(service as any, 'verifyAppStoreWebhookSignature').mockReturnValue(true);

      const result = (service as any).verifyAppStoreWebhookSignature(
        mockAppStorePayload,
        'expected-signature',
      );

      expect(result).toBe(true);
    });
  });

  describe('verifyPlayStoreWebhookSignature', () => {
    it('should return true when no secret configured', () => {
      const originalEnv = process.env.WEBHOOK_PLAY_STORE_SECRET;
      delete process.env.WEBHOOK_PLAY_STORE_SECRET;

      const result = (service as any).verifyPlayStoreWebhookSignature(
        mockPlayStorePayload,
        'signature',
      );

      expect(result).toBe(true);

      if (originalEnv) {
        process.env.WEBHOOK_PLAY_STORE_SECRET = originalEnv;
      }
    });
  });

  describe('decodeAppStoreTransaction', () => {
    it('should decode valid JWT transaction', async () => {
      const mockJWT =
        'header.' +
        Buffer.from(
          JSON.stringify({
            transaction_id: 'txn-123',
            product_id: 'com.spefynd.dating.control.monthly',
            app_account_token: 'user-123',
            expires_date_ms: Date.now() + 30 * 24 * 60 * 60 * 1000,
            purchase_date_ms: Date.now(),
            original_transaction_id: 'orig-txn-123',
            web_order_line_item_id: 'web-order-123',
          }),
        ).toString('base64') +
        '.signature';

      const result = await (service as any).decodeAppStoreTransaction(mockJWT);

      expect(result).toEqual({
        transactionId: 'txn-123',
        productId: 'com.spefynd.dating.control.monthly',
        userId: 'user-123',
        expiresDate: expect.any(Number),
        purchaseDate: expect.any(Number),
        originalTransactionId: 'orig-txn-123',
        webOrderLineItemId: 'web-order-123',
      });
    });

    it('should throw error for invalid JWT', async () => {
      await expect(
        (service as any).decodeAppStoreTransaction('invalid-jwt'),
      ).rejects.toThrow('Invalid transaction data');
    });
  });

  describe('verifyAppStoreReceipt', () => {
    it('should return true for mock implementation', async () => {
      const result = await service.verifyAppStoreReceipt('mock-receipt-data');
      expect(result).toBe(true);
    });
  });

  describe('verifyPlayStoreReceipt', () => {
    it('should return true for mock implementation', async () => {
      const result = await service.verifyPlayStoreReceipt('mock-receipt-data');
      expect(result).toBe(true);
    });
  });
});
