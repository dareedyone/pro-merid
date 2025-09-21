/**
 * Redis keys used across the application
 * Centralized location for all Redis key constants to ensure consistency
 */

export const REDIS_KEYS = {
  // Activity tracking
  LAST_SEEN_PREFIX: 'last_seen:',
  ACTIVITY_TRACKERS: 'activity_trackers',

  // Email processing
  EMAIL_SENT_PREFIX: 'email_sent:',
  EMAIL_COOLDOWNS: 'email_cooldowns',

  // Job processing
  JOB_STATUS_PREFIX: 'offline_processing:',
} as const;

/**
 * Helper function to generate date-based keys
 */
export const generateDateKey = (prefix: string, date?: Date): string => {
  const targetDate = date || new Date();
  const dateString = targetDate.toISOString().split('T')[0];
  return `${prefix}${dateString}`;
};

/**
 * Helper function to generate user-specific keys
 */
export const generateUserKey = (prefix: string, userId: string): string => {
  return `${prefix}${userId}`;
};
