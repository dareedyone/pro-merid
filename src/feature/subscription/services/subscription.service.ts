import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { User } from 'src/feature/user/entities/user/user.entity';
import { DatingProfile } from 'src/feature/dating/entities/dating.profile';
import { FriendProfile } from 'src/feature/friends/entities/friend.profile';
import {
  SubscriptionHistory,
  SubscriptionAction,
} from '../entities/subscription-history.entity';
import { AuthService } from 'src/feature/auth/auth.service';
import {
  PurchaseSubscriptionDto,
  SubscriptionStatusDto,
  SubscriptionPlanDto,
  RenewSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionHistoryDto,
  SubscriptionType,
  SubscriptionStatus,
} from '../dtos/subscription.dto';
import { ProfileType } from 'src/common/types/enums/other.enum';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    @InjectRepository(DatingProfile)
    private readonly datingProfileRepo: EntityRepository<DatingProfile>,
    @InjectRepository(FriendProfile)
    private readonly friendProfileRepo: EntityRepository<FriendProfile>,
    @InjectRepository(SubscriptionHistory)
    private readonly subscriptionHistoryRepo: EntityRepository<SubscriptionHistory>,
    private readonly authService: AuthService,
    private readonly em: EntityManager,
  ) {}

  getSubscriptionPlans(profileType: ProfileType): SubscriptionPlanDto[] {
    const plans: SubscriptionPlanDto[] = [];

    if (profileType === ProfileType.DATE) {
      plans.push(
        {
          type: SubscriptionType.CONTROL,
          name: 'Control',
          description: 'Premium monthly subscription with full filter control',
          price: 9.99,
          currency: 'USD',
          duration: 30, // 30 days
          features: [
            'Full filter control',
            'Advanced matching',
            'Unlimited likes',
            'See who liked you',
            'Priority support',
          ],
          isAvailable: true,
        },
        {
          type: SubscriptionType.TRUEFYND,
          name: 'TrueFynd',
          description: 'One-time purchase with advanced compatibility analysis',
          price: 49.99,
          currency: 'USD',
          duration: 180, // 6 months
          features: [
            'Advanced compatibility analysis',
            'Detailed match insights',
            'Priority matching',
            'Exclusive features',
            'Premium support',
          ],
          isAvailable: true,
        },
      );
    } else if (profileType === ProfileType.FRIEND) {
      plans.push({
        type: SubscriptionType.CONTROL,
        name: 'Control',
        description: 'Premium monthly subscription with full filter control',
        price: 4.99,
        currency: 'USD',
        duration: 30, // 30 days
        features: [
          'Full filter control',
          'Advanced friend matching',
          'Unlimited connections',
          'Priority support',
        ],
        isAvailable: true,
      });
    }

    return plans;
  }

  async purchaseSubscription(
    authId: string,
    dto: PurchaseSubscriptionDto,
  ): Promise<SubscriptionStatusDto> {
    return this.processSubscription(authId, dto, SubscriptionAction.PURCHASED);
  }

  async getSubscriptionStatus(
    authId: string,
    profileType: ProfileType,
  ): Promise<SubscriptionStatusDto> {
    const { user } = await this.authService.fetchAuthUser(authId);

    if (profileType === ProfileType.DATE) {
      return this.getDatingSubscriptionStatus(user);
    } else if (profileType === ProfileType.FRIEND) {
      return this.getFriendSubscriptionStatus(user);
    }

    throw new BadRequestException('Invalid profile type');
  }

  async renewSubscription(
    authId: string,
    dto: RenewSubscriptionDto,
  ): Promise<SubscriptionStatusDto> {
    return this.processSubscription(authId, dto, SubscriptionAction.RENEWED);
  }

  async processSubscription(
    authId: string,
    dto: PurchaseSubscriptionDto | RenewSubscriptionDto,
    action: SubscriptionAction,
  ): Promise<SubscriptionStatusDto> {
    try {
      const { user } = await this.authService.fetchAuthUser(authId);

      // Validate receipt data
      const isValidReceipt = await this.validateReceipt(
        dto.receiptData,
        dto.subscriptionType,
      );
      if (!isValidReceipt) {
        throw new BadRequestException('Invalid receipt data');
      }

      // Check for duplicate transactions
      if (dto.transactionId) {
        const existingTransaction = await this.subscriptionHistoryRepo.findOne({
          transactionId: dto.transactionId,
        });
        if (existingTransaction) {
          this.logger.warn(
            `Duplicate transaction detected: ${dto.transactionId}`,
          );
          return this.getSubscriptionStatus(authId, dto.profileType);
        }
      }

      const expiresAt = this.calculateExpirationDate(dto.subscriptionType);

      // Update subscription based on profile type
      if (dto.profileType === ProfileType.DATE) {
        await this.updateDatingSubscription(
          user,
          dto.subscriptionType,
          expiresAt,
        );
      } else if (dto.profileType === ProfileType.FRIEND) {
        if (dto.subscriptionType === SubscriptionType.TRUEFYND) {
          throw new BadRequestException(
            'TrueFynd is not available for friends',
          );
        }
        await this.updateFriendSubscription(
          user,
          dto.subscriptionType,
          expiresAt,
        );
      }

      // Record subscription history
      await this.recordSubscriptionHistory(user, dto, expiresAt, action);

      this.logger.log(
        `Successfully processed ${action} for user ${authId}, profile: ${dto.profileType}`,
      );

      return this.getSubscriptionStatus(authId, dto.profileType);
    } catch (error) {
      this.logger.error(
        `Error processing subscription ${action} for user ${authId}:`,
        error,
      );
      throw error;
    }
  }

  async cancelSubscription(
    authId: string,
    dto: CancelSubscriptionDto,
  ): Promise<{ message: string }> {
    const { user } = await this.authService.fetchAuthUser(authId);

    if (dto.profileType === ProfileType.DATE) {
      await this.cancelDatingSubscription(user, dto.subscriptionType);
    } else if (dto.profileType === ProfileType.FRIEND) {
      await this.cancelFriendSubscription(user, dto.subscriptionType);
    }

    await this.recordSubscriptionHistory(
      user,
      dto,
      new Date(),
      SubscriptionAction.CANCELLED,
      dto.reason,
    );

    return { message: 'Subscription cancelled successfully' };
  }

  async getSubscriptionHistory(
    authId: string,
    profileType: ProfileType,
  ): Promise<SubscriptionHistoryDto[]> {
    const { user } = await this.authService.fetchAuthUser(authId);

    const history = await this.subscriptionHistoryRepo.find(
      { user, profileType },
      { orderBy: { createdAt: 'desc' } },
    );

    return history.map((record) => ({
      id: record.id,
      profileType: record.profileType,
      subscriptionType: record.subscriptionType as SubscriptionType,
      status: record.status as any,
      purchasedAt: record.purchasedAt,
      expiresAt: record.expiresAt || null,
      cancelledAt: record.cancelledAt || null,
      transactionId: record.transactionId || null,
      productId: record.productId || null,
      amount: record.amount || null,
      currency: record.currency || null,
    }));
  }

  private async validateReceipt(
    receiptData: string,
    subscriptionType: SubscriptionType,
  ): Promise<boolean> {
    try {
      if (this.isAppStoreReceipt(receiptData)) {
        return await this.validateAppStoreReceipt(
          receiptData,
          subscriptionType,
        );
      } else if (this.isPlayStoreReceipt(receiptData)) {
        return await this.validatePlayStoreReceipt(
          receiptData,
          subscriptionType,
        );
      } else {
        throw new BadRequestException('Invalid receipt format');
      }
    } catch (error) {
      this.logger.error('Receipt validation failed:', error);
      return false;
    }
  }

  private isAppStoreReceipt(receiptData: string): boolean {
    try {
      // App Store receipts are base64 encoded JSON
      const decoded = Buffer.from(receiptData, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      return parsed && typeof parsed === 'object';
    } catch {
      return false;
    }
  }

  private isPlayStoreReceipt(receiptData: string): boolean {
    try {
      // Play Store receipts are typically JSON strings
      const parsed = JSON.parse(receiptData);
      return parsed && (parsed.purchaseToken || parsed.orderId);
    } catch {
      return false;
    }
  }

  private async validateAppStoreReceipt(
    receiptData: string,
    subscriptionType: SubscriptionType,
  ): Promise<boolean> {
    try {
      const config = this.getSubscriptionConfig();

      // Decode the receipt
      const receipt = JSON.parse(
        Buffer.from(receiptData, 'base64').toString('utf-8'),
      );

      // Verify with Apple's servers
      const verifyUrl = config.appStore.verifyReceiptUrl;
      const sharedSecret = config.appStore.sharedSecret;

      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'receipt-data': receiptData,
          password: sharedSecret,
          'exclude-old-transactions': true,
        }),
      });

      const result = await response.json();

      if (result.status === 0) {
        // Valid receipt - check if it matches our subscription type
        const latestReceiptInfo =
          result.latest_receipt_info || result.receipt?.in_app || [];
        const activeSubscription = latestReceiptInfo.find((item: any) => {
          const productId = item.product_id;
          const expiresDate = parseInt(item.expires_date_ms);
          const now = Date.now();

          // Check if subscription is still active and matches our type
          return (
            expiresDate > now &&
            this.matchesSubscriptionType(productId, subscriptionType)
          );
        });

        return !!activeSubscription;
      } else if (result.status === 21007) {
        // Sandbox receipt - retry with sandbox URL
        return await this.validateAppStoreReceiptSandbox(
          receiptData,
          subscriptionType,
        );
      } else {
        this.logger.error(
          `App Store validation failed with status: ${result.status}`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error('App Store receipt validation error:', error);
      return false;
    }
  }

  private async validateAppStoreReceiptSandbox(
    receiptData: string,
    subscriptionType: SubscriptionType,
  ): Promise<boolean> {
    try {
      const config = this.getSubscriptionConfig();
      const sandboxUrl = config.appStore.sandboxUrl;
      const sharedSecret = config.appStore.sharedSecret;

      const response = await fetch(sandboxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'receipt-data': receiptData,
          password: sharedSecret,
          'exclude-old-transactions': true,
        }),
      });

      const result = await response.json();

      if (result.status === 0) {
        const latestReceiptInfo =
          result.latest_receipt_info || result.receipt?.in_app || [];
        const activeSubscription = latestReceiptInfo.find((item: any) => {
          const productId = item.product_id;
          const expiresDate = parseInt(item.expires_date_ms);
          const now = Date.now();

          return (
            expiresDate > now &&
            this.matchesSubscriptionType(productId, subscriptionType)
          );
        });

        return !!activeSubscription;
      }

      return false;
    } catch (error) {
      this.logger.error('App Store sandbox validation error:', error);
      return false;
    }
  }

  private async validatePlayStoreReceipt(
    receiptData: string,
    subscriptionType: SubscriptionType,
  ): Promise<boolean> {
    try {
      const config = this.getSubscriptionConfig();
      const receipt = JSON.parse(receiptData);

      // For Play Store, we need to verify with Google Play Developer API
      // This is a simplified version - in production, you'd use the Google Play Developer API

      if (!receipt.purchaseToken || !receipt.packageName) {
        return false;
      }

      // Verify package name matches our app
      if (receipt.packageName !== config.playStore.packageName) {
        return false;
      }

      // Check if product ID matches our subscription type
      const productId = receipt.productId || receipt.sku;
      if (!this.matchesSubscriptionType(productId, subscriptionType)) {
        return false;
      }

      // In production, you would:
      // 1. Use Google Play Developer API to verify the purchase token
      // 2. Check subscription status
      // 3. Validate expiration dates

      // For now, we'll do basic validation
      return true;
    } catch (error) {
      this.logger.error('Play Store receipt validation error:', error);
      return false;
    }
  }

  private matchesSubscriptionType(
    productId: string,
    subscriptionType: SubscriptionType,
  ): boolean {
    const productMappings = {
      [SubscriptionType.CONTROL]: [
        'com.spefynd.dating.control.monthly',
        'com.spefynd.friends.control.monthly',
        'dating_control_monthly',
        'friends_control_monthly',
      ],
      [SubscriptionType.TRUEFYND]: [
        'com.spefynd.dating.truefynd.6months',
        'dating_truefynd_6months',
      ],
    };

    return productMappings[subscriptionType]?.includes(productId) || false;
  }

  private getSubscriptionConfig() {
    // This would come from your config service
    return {
      appStore: {
        verifyReceiptUrl:
          process.env.APP_STORE_VERIFY_RECEIPT_URL ||
          'https://buy.itunes.apple.com/verifyReceipt',
        sandboxUrl:
          process.env.APP_STORE_SANDBOX_URL ||
          'https://sandbox.itunes.apple.com/verifyReceipt',
        sharedSecret: process.env.APP_STORE_SHARED_SECRET || '',
      },
      playStore: {
        packageName: process.env.PLAY_STORE_PACKAGE_NAME || 'com.spefynd.app',
        serviceAccountKey: process.env.PLAY_STORE_SERVICE_ACCOUNT_KEY || '',
      },
    };
  }

  private calculateExpirationDate(subscriptionType: SubscriptionType): Date {
    const now = new Date();

    if (subscriptionType === SubscriptionType.CONTROL) {
      // Monthly subscription
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (subscriptionType === SubscriptionType.TRUEFYND) {
      // 6 months
      return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    }

    throw new BadRequestException('Invalid subscription type');
  }

  private async updateDatingSubscription(
    user: User,
    subscriptionType: SubscriptionType,
    expiresAt: Date,
  ): Promise<void> {
    const datingProfile = await this.datingProfileRepo.findOneOrFail(
      { user },
      { populate: ['user'] },
    );

    if (subscriptionType === SubscriptionType.CONTROL) {
      datingProfile.controlEndsAt = expiresAt;
    } else if (subscriptionType === SubscriptionType.TRUEFYND) {
      datingProfile.trueFyndEndsAt = expiresAt;
    }

    await this.em.persistAndFlush(datingProfile);
  }

  private async updateFriendSubscription(
    user: User,
    subscriptionType: SubscriptionType,
    expiresAt: Date,
  ): Promise<void> {
    const friendProfile = await this.friendProfileRepo.findOneOrFail(
      { user },
      { populate: ['user'] },
    );

    if (subscriptionType === SubscriptionType.CONTROL) {
      friendProfile.controlEndsAt = expiresAt;
    }

    await this.em.persistAndFlush(friendProfile);
  }

  private async getDatingSubscriptionStatus(
    user: User,
  ): Promise<SubscriptionStatusDto> {
    const datingProfile = await this.datingProfileRepo.findOne(
      { user },
      { populate: ['user'] },
    );

    const noSubscription = {
      profileType: ProfileType.DATE,
      subscriptionType: null,
      status: SubscriptionStatus.EXPIRED,
      isActive: false,
      expiresAt: null,
      purchasedAt: null,
      autoRenew: false,
    };

    if (!datingProfile) {
      return noSubscription;
    }

    const now = new Date();
    const hasControl =
      datingProfile.controlEndsAt &&
      new Date(datingProfile.controlEndsAt) > now;
    const hasTrueFynd =
      datingProfile.trueFyndEndsAt &&
      new Date(datingProfile.trueFyndEndsAt) > now;

    if (hasTrueFynd) {
      return {
        profileType: ProfileType.DATE,
        subscriptionType: SubscriptionType.TRUEFYND,
        status: SubscriptionStatus.ACTIVE,
        isActive: true,
        expiresAt: datingProfile.trueFyndEndsAt || null,
        purchasedAt: datingProfile.createdAt || new Date(),
        autoRenew: false,
      };
    } else if (hasControl) {
      return {
        profileType: ProfileType.DATE,
        subscriptionType: SubscriptionType.CONTROL,
        status: SubscriptionStatus.ACTIVE,
        isActive: true,
        expiresAt: datingProfile.controlEndsAt || null,
        purchasedAt: datingProfile.createdAt || new Date(),
        autoRenew: true,
      };
    }

    return noSubscription;
  }

  private async getFriendSubscriptionStatus(
    user: User,
  ): Promise<SubscriptionStatusDto> {
    const friendProfile = await this.friendProfileRepo.findOne(
      { user },
      { populate: ['user'] },
    );

    if (!friendProfile) {
      return {
        profileType: ProfileType.FRIEND,
        subscriptionType: null,
        status: SubscriptionStatus.EXPIRED,
        isActive: false,
        expiresAt: null,
        purchasedAt: null,
        autoRenew: false,
      };
    }

    const now = new Date();
    const hasControl =
      friendProfile.controlEndsAt &&
      new Date(friendProfile.controlEndsAt) > now;

    if (hasControl) {
      return {
        profileType: ProfileType.FRIEND,
        subscriptionType: SubscriptionType.CONTROL,
        status: SubscriptionStatus.ACTIVE,
        isActive: true,
        expiresAt: friendProfile.controlEndsAt || null,
        purchasedAt: friendProfile.createdAt || new Date(),
        autoRenew: true, // Control is monthly subscription
      };
    }

    return {
      profileType: ProfileType.FRIEND,
      subscriptionType: null,
      status: SubscriptionStatus.EXPIRED,
      isActive: false,
      expiresAt: null,
      purchasedAt: null,
      autoRenew: false,
    };
  }

  private async cancelDatingSubscription(
    user: User,
    subscriptionType: SubscriptionType,
  ): Promise<void> {
    const datingProfile = await this.datingProfileRepo.findOneOrFail(
      { user },
      { populate: ['user'] },
    );

    if (subscriptionType === SubscriptionType.CONTROL) {
      datingProfile.controlEndsAt = new Date();
    } else if (subscriptionType === SubscriptionType.TRUEFYND) {
      datingProfile.trueFyndEndsAt = new Date();
    }

    await this.em.persistAndFlush(datingProfile);
  }

  private async cancelFriendSubscription(
    user: User,
    subscriptionType: SubscriptionType,
  ): Promise<void> {
    const friendProfile = await this.friendProfileRepo.findOneOrFail(
      { user },
      { populate: ['user'] },
    );

    if (subscriptionType === SubscriptionType.CONTROL) {
      friendProfile.controlEndsAt = new Date();
    }

    await this.em.persistAndFlush(friendProfile);
  }

  private async recordSubscriptionHistory(
    user: User,
    dto: PurchaseSubscriptionDto | RenewSubscriptionDto | CancelSubscriptionDto,
    expiresAt: Date,
    action: SubscriptionAction,
    reason?: string,
  ): Promise<void> {
    const plan = this.getSubscriptionPlans(dto.profileType).find(
      (p) => p.type === dto.subscriptionType,
    );

    // Extract receipt data safely based on DTO type
    const receiptData = 'receiptData' in dto ? dto.receiptData : undefined;
    const transactionId =
      'transactionId' in dto ? dto.transactionId : undefined;
    const productId = 'productId' in dto ? dto.productId : undefined;

    const historyRecord = this.subscriptionHistoryRepo.create({
      user,
      profileType: dto.profileType,
      subscriptionType: dto.subscriptionType,
      action,
      status:
        action === SubscriptionAction.CANCELLED
          ? SubscriptionStatus.CANCELLED
          : SubscriptionStatus.ACTIVE,
      purchasedAt: new Date(),
      expiresAt: action === SubscriptionAction.CANCELLED ? null : expiresAt,
      cancelledAt: action === SubscriptionAction.CANCELLED ? new Date() : null,
      transactionId,
      productId,
      amount: plan?.price,
      currency: plan?.currency,
      receiptData,
      reason,
      metadata: {
        // Only store additional context, not duplicated data
        timestamp: new Date().toISOString(),
        source: 'api',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(historyRecord);
  }
}
