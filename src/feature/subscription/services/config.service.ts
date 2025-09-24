import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SubscriptionConfig {
  appStore: {
    sharedSecret: string;
    verifyReceiptUrl: string;
    sandboxUrl: string;
  };
  playStore: {
    serviceAccountKey: string;
    packageName: string;
  };
  webhook: {
    appStoreSecret: string;
    playStoreSecret: string;
  };
  features: {
    enableReceiptValidation: boolean;
    enableWebhookProcessing: boolean;
    enableAnalytics: boolean;
  };
}

@Injectable()
export class SubscriptionConfigService {
  constructor(private readonly configService: ConfigService) {}

  getConfig(): SubscriptionConfig {
    return {
      appStore: {
        sharedSecret: this.configService.get<string>('APP_STORE_SHARED_SECRET', ''),
        verifyReceiptUrl: this.configService.get<string>('APP_STORE_VERIFY_RECEIPT_URL', 'https://buy.itunes.apple.com/verifyReceipt'),
        sandboxUrl: this.configService.get<string>('APP_STORE_SANDBOX_URL', 'https://sandbox.itunes.apple.com/verifyReceipt'),
      },
      playStore: {
        serviceAccountKey: this.configService.get<string>('PLAY_STORE_SERVICE_ACCOUNT_KEY', ''),
        packageName: this.configService.get<string>('PLAY_STORE_PACKAGE_NAME', ''),
      },
      webhook: {
        appStoreSecret: this.configService.get<string>('WEBHOOK_APP_STORE_SECRET', ''),
        playStoreSecret: this.configService.get<string>('WEBHOOK_PLAY_STORE_SECRET', ''),
      },
      features: {
        enableReceiptValidation: this.configService.get<boolean>('ENABLE_RECEIPT_VALIDATION', true),
        enableWebhookProcessing: this.configService.get<boolean>('ENABLE_WEBHOOK_PROCESSING', true),
        enableAnalytics: this.configService.get<boolean>('ENABLE_ANALYTICS', true),
      },
    };
  }

  isReceiptValidationEnabled(): boolean {
    return this.getConfig().features.enableReceiptValidation;
  }

  isWebhookProcessingEnabled(): boolean {
    return this.getConfig().features.enableWebhookProcessing;
  }

  isAnalyticsEnabled(): boolean {
    return this.getConfig().features.enableAnalytics;
  }
}
