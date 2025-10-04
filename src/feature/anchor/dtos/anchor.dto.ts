import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEmail,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  UserPoolMode,
  AnchorTheme,
  MatchingAlgorithm,
  ModerationLevel,
  AnchorStatus,
  AnchorRole,
} from '../types/anchor.enum';

export class AnchorBrandingDto {
  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsEnum(AnchorTheme)
  theme: AnchorTheme = AnchorTheme.LIGHT;

  @IsOptional()
  @IsString()
  customCss?: string;

  @IsOptional()
  @IsString()
  favicon?: string;

  @IsOptional()
  @IsString()
  appName?: string;
}

export class AnchorFeaturesDto {
  @IsBoolean()
  allowMatching: boolean = true;

  @IsBoolean()
  allowChatModeration: boolean = false;

  @IsBoolean()
  allowUserManagement: boolean = true;

  @IsBoolean()
  allowCustomOnboarding: boolean = false;

  @IsBoolean()
  allowBulkOperations: boolean = false;

  @IsBoolean()
  allowAnalytics: boolean = true;

  @IsBoolean()
  allowExport: boolean = false;
}

export class AnchorMatchingDto {
  @IsEnum(MatchingAlgorithm)
  algorithm: MatchingAlgorithm = MatchingAlgorithm.DEFAULT;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customFilters?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxDistance?: number;

  @IsOptional()
  @IsObject()
  ageRange?: {
    min: number;
    max: number;
  };

  @IsOptional()
  @IsBoolean()
  allowCrossAnchorMatching?: boolean;
}

export class AnchorModerationDto {
  @IsEnum(ModerationLevel)
  level: ModerationLevel = ModerationLevel.NONE;

  @IsBoolean()
  requireApproval: boolean = false;

  @IsBoolean()
  allowCounselorAccess: boolean = false;

  @IsBoolean()
  chatMonitoring: boolean = false;

  @IsBoolean()
  autoModeration: boolean = false;

  @IsNumber()
  @Min(1)
  @Max(10)
  reportThreshold: number = 3;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedCounselorRoles: string[] = [];
}

export class AnchorSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsers?: number;

  @IsBoolean()
  allowSelfRegistration: boolean = true;

  @IsBoolean()
  requireEmailVerification: boolean = true;

  @IsBoolean()
  requirePhoneVerification: boolean = false;

  @IsString()
  defaultLanguage: string = 'en';

  @IsString()
  timezone: string = 'UTC';
}

export class AnchorConfigDto {
  @IsEnum(UserPoolMode)
  userPoolMode: UserPoolMode = UserPoolMode.ISOLATED;

  @ValidateNested()
  @Type(() => AnchorBrandingDto)
  branding: AnchorBrandingDto;

  @ValidateNested()
  @Type(() => AnchorFeaturesDto)
  features: AnchorFeaturesDto;

  @ValidateNested()
  @Type(() => AnchorMatchingDto)
  matching: AnchorMatchingDto;

  @ValidateNested()
  @Type(() => AnchorModerationDto)
  moderation: AnchorModerationDto;

  @ValidateNested()
  @Type(() => AnchorSettingsDto)
  settings: AnchorSettingsDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateAnchorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  subdomain?: string;

  @ValidateNested()
  @Type(() => AnchorConfigDto)
  config: AnchorConfigDto;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;
}

export class UpdateAnchorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AnchorConfigDto)
  config?: AnchorConfigDto;

  @IsOptional()
  @IsEnum(AnchorStatus)
  status?: AnchorStatus;
}

export class AnchorResponseDto {
  id: string;
  name: string;
  subdomain?: string;
  config: AnchorConfigDto;
  status: AnchorStatus;
  createdAt: Date;
  updatedAt: Date;
  userCount: number;
  authAccountCount: number;
}

export class AnchorListResponseDto {
  anchors: AnchorResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class AddUserToAnchorDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsEnum(AnchorRole)
  role?: AnchorRole = AnchorRole.ADMIN;
}

export class RemoveUserFromAnchorDto {
  @IsString()
  userId: string;
}

export class AnchorUserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AnchorRole;
  joinedAt: Date;
  isActive: boolean;
}

export class AnchorUserListResponseDto {
  users: AnchorUserResponseDto[];
  total: number;
  page: number;
  limit: number;
}
