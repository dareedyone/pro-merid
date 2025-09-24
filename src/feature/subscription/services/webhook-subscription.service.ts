import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { SubscriptionType } from '../dtos/subscription.dto';
import { SubscriptionAction } from '../entities/subscription-history.entity';
import * as crypto from 'crypto';

export interface AppStoreWebhookPayload {
  notification_type: string;
  subtype?: string;
  notification_uuid: string;
  data: {
    app_apple_id: number;
    bundle_id: string;
    environment: string;
    signed_transaction_info: string;
    signed_renewal_info: string;
  };
  version: string;
  signed_date: number;
}

export interface PlayStoreWebhookPayload {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
  oneTimeProductNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    sku: string;
  };
}

export interface AppStoreTransactionInfo {
  transactionId: string;
  productId: string;
  userId: string;
  expiresDate: number;
  purchaseDate: number;
  originalTransactionId: string;
  webOrderLineItemId: string;
}

export interface PlayStoreNotification {
  version: string;
  notificationType: number;
  purchaseToken: string;
  subscriptionId?: string;
  sku?: string;
}

interface DecodedAppStoreTransaction {
  transaction_id: string;
  product_id: string;
  app_account_token: string;
  expires_date_ms: number;
  purchase_date_ms: number;
  original_transaction_id: string;
  web_order_line_item_id: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Handle App Store webhook notifications
   */
  async handleAppStoreWebhook(
    payload: AppStoreWebhookPayload,
    signature?: string,
  ): Promise<void> {
    this.logger.log(`Received App Store webhook: ${payload.notification_type}`);

    try {
      // Verify webhook signature if provided
      if (
        signature &&
        !this.verifyAppStoreWebhookSignature(payload, signature)
      ) {
        throw new BadRequestException('Invalid webhook signature');
      }

      // Decode and verify the signed transaction info
      const transactionInfo = await this.decodeAppStoreTransaction(
        payload.data.signed_transaction_info,
      );

      switch (payload.notification_type) {
        case 'SUBSCRIBED':
          await this.handleAppStoreSubscription(transactionInfo, 'purchased');
          break;
        case 'DID_RENEW':
          await this.handleAppStoreSubscription(transactionInfo, 'renewed');
          break;
        case 'DID_FAIL_TO_RENEW':
          await this.handleAppStoreSubscription(
            transactionInfo,
            'failed_renewal',
          );
          break;
        case 'DID_CHANGE_RENEWAL_PREF':
          await this.handleAppStoreSubscription(
            transactionInfo,
            'renewal_preference_changed',
          );
          break;
        case 'DID_CHANGE_RENEWAL_STATUS':
          await this.handleAppStoreSubscription(
            transactionInfo,
            'renewal_status_changed',
          );
          break;
        case 'EXPIRED':
          await this.handleAppStoreSubscription(transactionInfo, 'expired');
          break;
        case 'REVOKE':
          await this.handleAppStoreSubscription(transactionInfo, 'revoked');
          break;
        default:
          this.logger.warn(
            `Unhandled App Store notification type: ${payload.notification_type}`,
          );
      }
    } catch (error) {
      this.logger.error('Error processing App Store webhook:', error);
      throw new BadRequestException('Invalid webhook payload');
    }
  }

  /**
   * Handle Play Store webhook notifications
   */
  async handlePlayStoreWebhook(
    payload: PlayStoreWebhookPayload,
    signature?: string,
  ): Promise<void> {
    this.logger.log(
      `Received Play Store webhook for package: ${payload.packageName}`,
    );

    try {
      // Verify webhook signature if provided
      if (
        signature &&
        !this.verifyPlayStoreWebhookSignature(payload, signature)
      ) {
        throw new BadRequestException('Invalid webhook signature');
      }

      if (payload.subscriptionNotification) {
        await this.handlePlayStoreSubscription(
          payload.subscriptionNotification,
        );
      } else if (payload.oneTimeProductNotification) {
        await this.handlePlayStoreOneTimeProduct(
          payload.oneTimeProductNotification,
        );
      }
    } catch (error) {
      this.logger.error('Error processing Play Store webhook:', error);
      throw new BadRequestException('Invalid webhook payload');
    }
  }

  // Private helper methods

  private async decodeAppStoreTransaction(
    signedTransactionInfo: string,
  ): Promise<AppStoreTransactionInfo> {
    try {
      // In production, you would:
      // 1. Verify the JWT signature using Apple's public key
      // 2. Decode the JWT payload
      // 3. Validate the transaction data

      // For now, we'll implement a basic structure
      // In production, use a library like 'jsonwebtoken' with Apple's public keys
      const decoded = JSON.parse(
        Buffer.from(signedTransactionInfo.split('.')[1], 'base64').toString(),
      ) as DecodedAppStoreTransaction;

      return {
        transactionId: decoded.transaction_id,
        productId: decoded.product_id,
        userId: decoded.app_account_token, // This should be your user ID
        expiresDate: decoded.expires_date_ms,
        purchaseDate: decoded.purchase_date_ms,
        originalTransactionId: decoded.original_transaction_id,
        webOrderLineItemId: decoded.web_order_line_item_id,
      };
    } catch (error) {
      this.logger.error('Error decoding App Store transaction:', error);
      throw new BadRequestException('Invalid transaction data');
    }
  }

  private async handleAppStoreSubscription(
    transactionInfo: AppStoreTransactionInfo,
    action: string,
  ): Promise<void> {
    try {
      // Map product ID to subscription type and profile type
      const { subscriptionType, profileType } = this.mapProductIdToSubscription(
        transactionInfo.productId,
      );

      // Find user by app account token (userId)
      const userId = transactionInfo.userId;
      if (!userId) {
        this.logger.warn('No user ID found in transaction info');
        return;
      }

      // Handle different webhook actions
      switch (action) {
        case 'purchased':
        case 'renewed':
          await this.subscriptionService.processSubscription(
            userId,
            {
              profileType,
              subscriptionType,
              receiptData: JSON.stringify(transactionInfo),
              transactionId: transactionInfo.transactionId,
              productId: transactionInfo.productId,
            },
            action === 'purchased'
              ? SubscriptionAction.PURCHASED
              : SubscriptionAction.RENEWED,
          );
          break;

        case 'failed_renewal':
        case 'expired':
        case 'revoked':
          await this.subscriptionService.cancelSubscription(userId, {
            profileType,
            subscriptionType,
            reason: `Webhook: ${action}`,
          });
          break;

        case 'renewal_preference_changed':
        case 'renewal_status_changed':
          // Log these events but don't change subscription status
          this.logger.log(
            `Subscription preference/status changed for user ${userId}`,
          );
          break;

        default:
          this.logger.warn(`Unhandled webhook action: ${action}`);
      }

      this.logger.log(
        `Successfully processed App Store ${action} for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling App Store subscription ${action}:`,
        error,
      );
      throw error;
    }
  }

  private async handlePlayStoreSubscription(
    notification: PlayStoreNotification,
  ): Promise<void> {
    try {
      const { subscriptionType, profileType } = this.mapProductIdToSubscription(
        notification.subscriptionId!,
      );

      // Find user by purchase token (you'd need to store this mapping)
      const userId = await this.findUserByPurchaseToken(
        notification.purchaseToken,
      );
      if (!userId) {
        this.logger.warn('No user found for purchase token');
        return;
      }

      switch (notification.notificationType) {
        case 1: // SUBSCRIPTION_RECOVERED
        case 2: // SUBSCRIPTION_RENEWED
          await this.subscriptionService.processSubscription(
            userId,
            {
              profileType,
              subscriptionType,
              receiptData: JSON.stringify(notification),
              transactionId: notification.purchaseToken,
              productId: notification.subscriptionId,
            },
            SubscriptionAction.RENEWED,
          );
          break;

        case 3: // SUBSCRIPTION_CANCELED
        case 4: // SUBSCRIPTION_PURCHASED
          await this.subscriptionService.processSubscription(
            userId,
            {
              profileType,
              subscriptionType,
              receiptData: JSON.stringify(notification),
              transactionId: notification.purchaseToken,
              productId: notification.subscriptionId,
            },
            SubscriptionAction.PURCHASED,
          );
          break;

        case 5: // SUBSCRIPTION_ON_HOLD
        case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
        case 7: // SUBSCRIPTION_RESTARTED
          // Handle grace period and hold states
          this.logger.log(
            `Subscription in special state for user ${userId}: ${notification.notificationType}`,
          );
          break;

        case 12: // SUBSCRIPTION_EXPIRED
          await this.subscriptionService.cancelSubscription(userId, {
            profileType,
            subscriptionType,
            reason: 'Webhook: subscription expired',
          });
          break;

        default:
          this.logger.warn(
            `Unhandled Play Store notification type: ${notification.notificationType}`,
          );
      }

      this.logger.log(
        `Successfully processed Play Store notification ${notification.notificationType} for user ${userId}`,
      );
    } catch (error) {
      this.logger.error('Error handling Play Store subscription:', error);
      throw error;
    }
  }

  private async handlePlayStoreOneTimeProduct(
    notification: PlayStoreNotification,
  ): Promise<void> {
    try {
      // One-time products are typically TrueFynd purchases
      const { subscriptionType, profileType } = this.mapProductIdToSubscription(
        notification.sku!,
      );

      const userId = await this.findUserByPurchaseToken(
        notification.purchaseToken,
      );
      if (!userId) {
        this.logger.warn('No user found for one-time product purchase token');
        return;
      }

      if (notification.notificationType === 1) {
        // ONE_TIME_PRODUCT_PURCHASED
        await this.subscriptionService.processSubscription(
          userId,
          {
            profileType,
            subscriptionType,
            receiptData: JSON.stringify(notification),
            transactionId: notification.purchaseToken,
            productId: notification.sku,
          },
          SubscriptionAction.PURCHASED,
        );
      }

      this.logger.log(
        `Successfully processed Play Store one-time product for user ${userId}`,
      );
    } catch (error) {
      this.logger.error('Error handling Play Store one-time product:', error);
      throw error;
    }
  }

  private mapProductIdToSubscription(productId: string): {
    subscriptionType: SubscriptionType;
    profileType: ProfileType;
  } {
    // Map your product IDs to subscription types and profile types
    // This should match your App Store Connect and Play Console product configurations
    const productMap: Record<
      string,
      { subscriptionType: SubscriptionType; profileType: ProfileType }
    > = {
      'com.spefynd.dating.control.monthly': {
        subscriptionType: SubscriptionType.CONTROL,
        profileType: ProfileType.DATE,
      },
      'com.spefynd.dating.truefynd.onetime': {
        subscriptionType: SubscriptionType.TRUEFYND,
        profileType: ProfileType.DATE,
      },
      'com.spefynd.friends.control.monthly': {
        subscriptionType: SubscriptionType.CONTROL,
        profileType: ProfileType.FRIEND,
      },
    };

    const mapping = productMap[productId];
    if (!mapping) {
      this.logger.warn(`Unknown product ID: ${productId}`);
      throw new BadRequestException(`Unknown product ID: ${productId}`);
    }

    return mapping;
  }

  private async findUserByPurchaseToken(
    _purchaseToken: string,
  ): Promise<string | null> {
    // In production, you'd have a mapping table or store this in user metadata
    // For now, we'll need to implement this based on your user management system
    // This could be stored in a separate table or in user metadata
    this.logger.warn(
      'findUserByPurchaseToken not implemented - needs production implementation',
    );
    return null;
  }

  private verifyAppStoreWebhookSignature(
    payload: AppStoreWebhookPayload,
    signature: string,
  ): boolean {
    try {
      const webhookSecret = process.env.WEBHOOK_APP_STORE_SECRET;

      if (!webhookSecret) {
        this.logger.warn('App Store webhook secret not configured');
        return true; // Allow if not configured
      }

      // Create HMAC signature
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(JSON.stringify(payload));
      const expectedSignature = hmac.digest('hex');

      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Error verifying App Store webhook signature:', error);
      return false;
    }
  }

  private verifyPlayStoreWebhookSignature(
    payload: PlayStoreWebhookPayload,
    signature: string,
  ): boolean {
    try {
      const webhookSecret = process.env.WEBHOOK_PLAY_STORE_SECRET;

      if (!webhookSecret) {
        this.logger.warn('Play Store webhook secret not configured');
        return true; // Allow if not configured
      }

      // Create HMAC signature
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(JSON.stringify(payload));
      const expectedSignature = hmac.digest('hex');

      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Error verifying Play Store webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify App Store receipt
   */
  async verifyAppStoreReceipt(_receiptData: string): Promise<boolean> {
    // TODO: Implement actual App Store receipt verification
    // This would involve calling Apple's verifyReceipt API
    return true; // Mock implementation
  }

  /**
   * Verify Play Store receipt
   */
  async verifyPlayStoreReceipt(_receiptData: string): Promise<boolean> {
    // TODO: Implement actual Play Store receipt verification
    // This would involve calling Google Play Developer API
    return true; // Mock implementation
  }
}
