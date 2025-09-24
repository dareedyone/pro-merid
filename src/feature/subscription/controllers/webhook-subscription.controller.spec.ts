import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook-subscription.controller';
import { WebhookService } from '../services/webhook-subscription.service';

describe('WebhookController', () => {
  let controller: WebhookController;
  let mockWebhookService: any;

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
      notificationType: 2,
      purchaseToken: 'mock-purchase-token',
      subscriptionId: 'com.spefynd.dating.control.monthly',
    },
  };

  beforeEach(async () => {
    mockWebhookService = {
      handleAppStoreWebhook: jest.fn(),
      handlePlayStoreWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: WebhookService,
          useValue: mockWebhookService,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleAppStoreWebhook', () => {
    it('should handle App Store webhook successfully', async () => {
      mockWebhookService.handleAppStoreWebhook.mockResolvedValue(undefined);

      const result = await controller.handleAppStoreWebhook(
        mockAppStorePayload,
        'mock-signature',
      );

      expect(result).toEqual({ success: true });
      expect(mockWebhookService.handleAppStoreWebhook).toHaveBeenCalledWith(
        mockAppStorePayload,
        'mock-signature',
      );
    });

    it('should handle App Store webhook without signature', async () => {
      mockWebhookService.handleAppStoreWebhook.mockResolvedValue(undefined);

      const result = await controller.handleAppStoreWebhook(mockAppStorePayload);

      expect(result).toEqual({ success: true });
      expect(mockWebhookService.handleAppStoreWebhook).toHaveBeenCalledWith(
        mockAppStorePayload,
        undefined,
      );
    });

    it('should handle App Store webhook errors', async () => {
      const error = new Error('Invalid webhook payload');
      mockWebhookService.handleAppStoreWebhook.mockRejectedValue(error);

      await expect(
        controller.handleAppStoreWebhook(mockAppStorePayload, 'invalid-signature'),
      ).rejects.toThrow('Invalid webhook payload');
    });

    it('should handle different notification types', async () => {
      const notificationTypes = [
        'SUBSCRIBED',
        'DID_RENEW',
        'DID_FAIL_TO_RENEW',
        'DID_CHANGE_RENEWAL_PREF',
        'DID_CHANGE_RENEWAL_STATUS',
        'EXPIRED',
        'REVOKE',
      ];

      for (const notificationType of notificationTypes) {
        const payload = { ...mockAppStorePayload, notification_type: notificationType };
        mockWebhookService.handleAppStoreWebhook.mockResolvedValue(undefined);

        const result = await controller.handleAppStoreWebhook(payload, 'mock-signature');

        expect(result).toEqual({ success: true });
        expect(mockWebhookService.handleAppStoreWebhook).toHaveBeenCalledWith(
          payload,
          'mock-signature',
        );
      }
    });
  });

  describe('handlePlayStoreWebhook', () => {
    it('should handle Play Store webhook successfully', async () => {
      mockWebhookService.handlePlayStoreWebhook.mockResolvedValue(undefined);

      const result = await controller.handlePlayStoreWebhook(
        mockPlayStorePayload,
        'mock-signature',
      );

      expect(result).toEqual({ success: true });
      expect(mockWebhookService.handlePlayStoreWebhook).toHaveBeenCalledWith(
        mockPlayStorePayload,
        'mock-signature',
      );
    });

    it('should handle Play Store webhook without signature', async () => {
      mockWebhookService.handlePlayStoreWebhook.mockResolvedValue(undefined);

      const result = await controller.handlePlayStoreWebhook(mockPlayStorePayload);

      expect(result).toEqual({ success: true });
      expect(mockWebhookService.handlePlayStoreWebhook).toHaveBeenCalledWith(
        mockPlayStorePayload,
        undefined,
      );
    });

    it('should handle Play Store webhook errors', async () => {
      const error = new Error('Invalid webhook payload');
      mockWebhookService.handlePlayStoreWebhook.mockRejectedValue(error);

      await expect(
        controller.handlePlayStoreWebhook(mockPlayStorePayload, 'invalid-signature'),
      ).rejects.toThrow('Invalid webhook payload');
    });

    it('should handle subscription notifications', async () => {
      const subscriptionPayload = {
        ...mockPlayStorePayload,
        subscriptionNotification: {
          version: '1.0',
          notificationType: 2, // SUBSCRIPTION_RENEWED
          purchaseToken: 'mock-purchase-token',
          subscriptionId: 'com.spefynd.dating.control.monthly',
        },
      };

      mockWebhookService.handlePlayStoreWebhook.mockResolvedValue(undefined);

      const result = await controller.handlePlayStoreWebhook(subscriptionPayload, 'mock-signature');

      expect(result).toEqual({ success: true });
      expect(mockWebhookService.handlePlayStoreWebhook).toHaveBeenCalledWith(
        subscriptionPayload,
        'mock-signature',
      );
    });

    it('should handle one-time product notifications', async () => {
      const oneTimeProductPayload = {
        ...mockPlayStorePayload,
        subscriptionNotification: undefined,
        oneTimeProductNotification: {
          version: '1.0',
          notificationType: 1, // ONE_TIME_PRODUCT_PURCHASED
          purchaseToken: 'mock-purchase-token',
          sku: 'com.spefynd.dating.truefynd.onetime',
        },
      };

      mockWebhookService.handlePlayStoreWebhook.mockResolvedValue(undefined);

      const result = await controller.handlePlayStoreWebhook(oneTimeProductPayload, 'mock-signature');

      expect(result).toEqual({ success: true });
      expect(mockWebhookService.handlePlayStoreWebhook).toHaveBeenCalledWith(
        oneTimeProductPayload,
        'mock-signature',
      );
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      const error = new Error('Service unavailable');
      mockWebhookService.handleAppStoreWebhook.mockRejectedValue(error);

      await expect(
        controller.handleAppStoreWebhook(mockAppStorePayload, 'mock-signature'),
      ).rejects.toThrow('Service unavailable');
    });

    it('should handle invalid payload format', async () => {
      const invalidPayload = { invalid: 'data' };
      const error = new Error('Invalid payload format');
      mockWebhookService.handleAppStoreWebhook.mockRejectedValue(error);

      await expect(
        controller.handleAppStoreWebhook(invalidPayload as any, 'mock-signature'),
      ).rejects.toThrow('Invalid payload format');
    });
  });

  describe('request validation', () => {
    it('should accept valid App Store payload structure', async () => {
      const validPayload = {
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

      mockWebhookService.handleAppStoreWebhook.mockResolvedValue(undefined);

      const result = await controller.handleAppStoreWebhook(validPayload, 'mock-signature');

      expect(result).toEqual({ success: true });
    });

    it('should accept valid Play Store payload structure', async () => {
      const validPayload = {
        version: '1.0',
        packageName: 'com.spefynd.app',
        eventTimeMillis: Date.now().toString(),
        subscriptionNotification: {
          version: '1.0',
          notificationType: 2,
          purchaseToken: 'mock-purchase-token',
          subscriptionId: 'com.spefynd.dating.control.monthly',
        },
      };

      mockWebhookService.handlePlayStoreWebhook.mockResolvedValue(undefined);

      const result = await controller.handlePlayStoreWebhook(validPayload, 'mock-signature');

      expect(result).toEqual({ success: true });
    });
  });
});
