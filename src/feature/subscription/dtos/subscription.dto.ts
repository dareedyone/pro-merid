import { IsEnum, IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { ProfileType } from 'src/common/types/enums/other.enum';

export enum SubscriptionType {
  CONTROL = 'control',
  TRUEFYND = 'truefynd',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

export class PurchaseSubscriptionDto {
  @IsEnum(ProfileType)
  profileType!: ProfileType;

  @IsEnum(SubscriptionType)
  subscriptionType!: SubscriptionType;

  @IsString()
  receiptData!: string; // App Store/Play Store receipt data

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  productId?: string; // App Store/Play Store product ID
}

export class SubscriptionStatusDto {
  profileType: ProfileType;
  subscriptionType: SubscriptionType | null;
  status: SubscriptionStatus;
  isActive: boolean;
  expiresAt: Date | null;
  purchasedAt: Date | null;
  autoRenew: boolean;
}

export class SubscriptionPlanDto {
  type: SubscriptionType;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // in days
  features: string[];
  isAvailable: boolean;
}

export class RenewSubscriptionDto {
  @IsEnum(ProfileType)
  profileType!: ProfileType;

  @IsEnum(SubscriptionType)
  subscriptionType!: SubscriptionType;

  @IsString()
  receiptData!: string;

  @IsString()
  @IsOptional()
  transactionId?: string;
}

export class CancelSubscriptionDto {
  @IsEnum(ProfileType)
  profileType!: ProfileType;

  @IsEnum(SubscriptionType)
  subscriptionType!: SubscriptionType;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class SubscriptionHistoryDto {
  id: string;
  profileType: ProfileType;
  subscriptionType: SubscriptionType;
  status: SubscriptionStatus;
  purchasedAt: Date;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  transactionId: string | null;
  productId: string | null;
  amount: number | null;
  currency: string | null;
}
