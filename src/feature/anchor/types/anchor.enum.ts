export enum UserPoolMode {
  ISOLATED = 'isolated',
  MIXED = 'mixed',
}

export enum AnchorTheme {
  LIGHT = 'light',
  DARK = 'dark',
  CUSTOM = 'custom',
}

export enum MatchingAlgorithm {
  DEFAULT = 'default',
  CUSTOM = 'custom',
}

export enum ModerationLevel {
  NONE = 'none',
  BASIC = 'basic',
  ADVANCED = 'advanced',
  FULL = 'full',
}

export enum AnchorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum AnchorRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  COUNSELOR = 'counselor',
}
