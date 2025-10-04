import type {
  AnchorTheme,
  MatchingAlgorithm,
  ModerationLevel,
  UserPoolMode,
} from './anchor.enum';

// Re-export for convenience
export {
  UserPoolMode,
  AnchorTheme,
  MatchingAlgorithm,
  ModerationLevel,
} from './anchor.enum';

export interface AnchorBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme: AnchorTheme;
  customCss?: string;
  favicon?: string;
  appName?: string;
}

export interface AnchorFeatures {
  allowMatching: boolean;
  allowChatModeration: boolean;
  allowUserManagement: boolean;
  allowCustomOnboarding: boolean;
  allowBulkOperations: boolean;
  allowAnalytics: boolean;
  allowExport: boolean;
}

export interface AnchorMatching {
  algorithm: MatchingAlgorithm;
  customFilters?: string[];
  maxDistance?: number;
  ageRange?: {
    min: number;
    max: number;
  };
  allowCrossAnchorMatching?: boolean;
}

export interface AnchorModeration {
  level: ModerationLevel;
  requireApproval: boolean;
  allowCounselorAccess: boolean;
  chatMonitoring: boolean;
  autoModeration: boolean;
  reportThreshold: number;
  allowedCounselorRoles: string[];
}

export interface AnchorConfig {
  userPoolMode: UserPoolMode;
  branding: AnchorBranding;
  features: AnchorFeatures;
  matching: AnchorMatching;
  moderation: AnchorModeration;
  settings: {
    maxUsers?: number;
    allowSelfRegistration: boolean;
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
    defaultLanguage: string;
    timezone: string;
  };
  metadata?: Record<string, any>;
}

export interface AnchorUserContext {
  anchorId: string;
  userPoolMode: UserPoolMode;
  canSeeOtherAnchors: boolean;
  canMatchWithOtherAnchors: boolean;
  moderationLevel: ModerationLevel;
  features: AnchorFeatures;
}

export interface AnchorMatchContext {
  anchorId: string;
  isFacilitated: boolean;
  counselorId?: string;
  requiresApproval: boolean;
  moderationLevel: ModerationLevel;
}

export interface AnchorChatContext {
  anchorId: string;
  isMonitored: boolean;
  counselorId?: string;
  canModerate: boolean;
  moderationLevel: ModerationLevel;
}
