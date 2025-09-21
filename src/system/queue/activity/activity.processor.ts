import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ActivityService,
  OfflineUserData,
} from '../../../feature/activity/activity.service';
import { ActivityTrackerService } from '../../../feature/activity/activity-tracker.service';
import { EmailQueueService } from '../email/email.qservice';
import { RedisService } from '../../cache/redis.service';
import {
  REDIS_KEYS,
  generateDateKey,
} from '../../../common/constants/redis-keys';

@Injectable()
export class ActivityProcessor {
  private readonly logger = new Logger(ActivityProcessor.name);
  private readonly EMAIL_COOLDOWN_DAYS: number;

  constructor(
    private readonly activityService: ActivityService,
    private readonly activityTrackerService: ActivityTrackerService,
    private readonly emailQueueService: EmailQueueService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    const configuredCooldownDays = this.configService.get<number>(
      'EMAIL_COOLDOWN_DAYS',
      7,
    );
    this.EMAIL_COOLDOWN_DAYS = configuredCooldownDays;
  }

  async processOfflineUsersBatch(users: OfflineUserData[]): Promise<{
    emailsSent: number;
    emailsSkipped: number;
  }> {
    let emailsSent = 0;
    let emailsSkipped = 0;

    await Promise.all(
      users.map(async (user) => {
        try {
          const result = await this.processOfflineUser(user);
          if (result.emailSent) {
            emailsSent++;
          } else {
            emailsSkipped++;
          }
        } catch (error) {
          this.logger.error(`Failed to process user ${user.id}:`, error);
          emailsSkipped++;
        }
      }),
    );

    return { emailsSent, emailsSkipped };
  }

  async processOfflineUser(
    user: OfflineUserData,
  ): Promise<{ emailSent: boolean }> {
    const alreadySentToday = await this.hasEmailBeenSentToday(user.id);
    if (alreadySentToday) {
      return { emailSent: false };
    }

    const isInCooldown = await this.isUserInCooldown(user.id);
    if (isInCooldown) {
      return { emailSent: false };
    }

    const isAppropriateTime =
      await this.activityService.isAppropriateTimeForUser(user);
    if (!isAppropriateTime) {
      return { emailSent: false };
    }

    const missedActivity = await this.activityService.getMissedActivity(
      user.id,
      user.lastSeenAt,
    );

    const { shouldSend, emailData } =
      await this.activityTrackerService.shouldSendEmailIfNewerActivity(
        user.id,
        missedActivity.matches,
        missedActivity.messages,
        missedActivity.matchDetails,
      );

    if (shouldSend && emailData) {
      const subject = this.createEmailSubject(emailData);
      const body = this.createEmailBody(user, emailData);

      await this.emailQueueService.sendEmailJob({
        to: user.auth.email,
        subject,
        body,
      });

      await this.activityTrackerService.updateActivityTracker(
        user.id,
        emailData.totalMatches,
        emailData.totalMessages,
      );

      await this.markEmailSentToday(user.id);
      await this.markUserEmailCooldown(user.id);

      this.logger.debug(
        `Sent summary email to ${user.id}: ${emailData.newMatches} new matches (${emailData.totalMatches} total), ${emailData.newMessages} new messages (${emailData.totalMessages} total)`,
      );

      return { emailSent: true };
    }

    return { emailSent: false };
  }

  private createEmailSubject(emailData: {
    newMatches: number;
    newMessages: number;
  }): string {
    const { newMatches, newMessages } = emailData;

    if (newMatches > 0 && newMessages > 0) {
      return `You have ${newMatches} new match${newMatches > 1 ? 'es' : ''} and ${newMessages} new message${newMessages > 1 ? 's' : ''} on Spefynd!`;
    } else if (newMatches > 0) {
      return `You have ${newMatches} new match${newMatches > 1 ? 'es' : ''} on Spefynd!`;
    } else if (newMessages > 0) {
      return `You have ${newMessages} new message${newMessages > 1 ? 's' : ''} on Spefynd!`;
    }

    return 'New activity on Spefynd!';
  }

  private createEmailBody(
    user: OfflineUserData,
    emailData: {
      newMatches: number;
      totalMatches: number;
      newMessages: number;
      totalMessages: number;
      matchDetails: Array<{
        matchedUserId: string;
        matchedUserName: string;
        matchedAt: Date;
      }>;
    },
  ): string {
    const {
      newMatches,
      totalMatches,
      newMessages,
      totalMessages,
      matchDetails,
    } = emailData;

    const appUrl =
      this.configService.get<string>('APP_URL') || 'https://app.spefynd.com';

    const userName = user.firstName || 'there';
    let body = `Hi ${userName},\n\n`;

    // Summary with new + total
    if (newMatches > 0 && newMessages > 0) {
      body += `Great news! You have ${newMatches} new match${newMatches > 1 ? 'es' : ''} (${totalMatches} total) and ${newMessages} new message${newMessages > 1 ? 's' : ''} (${totalMessages} total) waiting for you!\n\n`;
    } else if (newMatches > 0) {
      body += `Great news! You have ${newMatches} new match${newMatches > 1 ? 'es' : ''} (${totalMatches} total)! 🎉\n\n`;
    } else if (newMessages > 0) {
      body += `You have ${newMessages} new message${newMessages > 1 ? 's' : ''} (${totalMessages} total) waiting for you! 💬\n\n`;
    }

    // Match details (show new matches only)
    if (matchDetails.length > 0) {
      body += 'Your new matches:\n';
      matchDetails.slice(0, 3).forEach((match, _index) => {
        body += `• ${match.matchedUserName}\n`;
      });

      if (matchDetails.length > 3) {
        body += `• And ${matchDetails.length - 3} more!\n`;
      }
      body += '\n';
    }

    body += `Don't keep them waiting - open the app now!\n\n`;
    body += `Open Spefynd: ${appUrl}\n\n`;
    body += `Happy matching!\nThe Spefynd Team`;

    return body;
  }

  private async hasEmailBeenSentToday(userId: string): Promise<boolean> {
    try {
      const key = generateDateKey(REDIS_KEYS.EMAIL_SENT_PREFIX);
      const sent = await this.redisService.hGet(key, userId);
      return !!sent;
    } catch (error) {
      this.logger.warn(
        `Failed to check email sent status for user ${userId}:`,
        error,
      );
      return false;
    }
  }

  private async markEmailSentToday(userId: string): Promise<void> {
    try {
      const key = generateDateKey(REDIS_KEYS.EMAIL_SENT_PREFIX);
      await this.redisService.hSet(key, userId, 'true');
      // Set expiration for the entire hash (25 hours to cover timezone differences)
      await this.redisService.expire(key, 25 * 60 * 60);
    } catch (error) {
      this.logger.warn(`Failed to mark email sent for user ${userId}:`, error);
    }
  }

  private async isUserInCooldown(userId: string): Promise<boolean> {
    try {
      const lastEmailDate = await this.redisService.hGet(
        REDIS_KEYS.EMAIL_COOLDOWNS,
        userId,
      );

      if (!lastEmailDate) {
        return false;
      }

      const lastEmail = new Date(lastEmailDate);
      const cooldownExpiry = new Date(
        lastEmail.getTime() + this.EMAIL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
      );
      const now = new Date();

      return now < cooldownExpiry;
    } catch (error) {
      this.logger.warn(`Failed to check cooldown for user ${userId}:`, error);
      return false;
    }
  }

  private async markUserEmailCooldown(userId: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      await this.redisService.hSet(REDIS_KEYS.EMAIL_COOLDOWNS, userId, now);
      await this.redisService.expire(
        REDIS_KEYS.EMAIL_COOLDOWNS,
        30 * 24 * 60 * 60,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to mark email cooldown for user ${userId}:`,
        error,
      );
    }
  }

  private async getUsersInCooldown(): Promise<string[]> {
    try {
      const hashData: Record<string, string> = await this.redisService.hGetAll(
        REDIS_KEYS.EMAIL_COOLDOWNS,
      );
      const userIds: string[] = [];

      for (const [userId, lastEmailDate] of Object.entries(hashData)) {
        if (lastEmailDate) {
          const lastEmail = new Date(lastEmailDate);
          const cooldownExpiry = new Date(
            lastEmail.getTime() +
              this.EMAIL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
          );
          const now = new Date();

          if (now < cooldownExpiry) {
            userIds.push(userId);
          }
        }
      }

      return userIds;
    } catch (error) {
      this.logger.warn('Failed to get users in cooldown:', error);
      return [];
    }
  }

  async isJobRunning(): Promise<boolean> {
    try {
      const statusKey = `${REDIS_KEYS.JOB_STATUS_PREFIX}status`;
      const isRunning = await this.redisService.get(statusKey);
      return isRunning === 'running';
    } catch (error) {
      this.logger.warn('Failed to check job status:', error);
      return false;
    }
  }

  async markJobRunning(): Promise<void> {
    try {
      const statusKey = `${REDIS_KEYS.JOB_STATUS_PREFIX}status`;
      const startTimeKey = `${REDIS_KEYS.JOB_STATUS_PREFIX}start_time`;

      await this.redisService.set(statusKey, 'running', 24 * 60 * 60);
      await this.redisService.set(
        startTimeKey,
        new Date().toISOString(),
        24 * 60 * 60,
      );
    } catch (error) {
      this.logger.warn('Failed to mark job as running:', error);
    }
  }

  async markJobCompleted(): Promise<void> {
    try {
      const statusKey = `${REDIS_KEYS.JOB_STATUS_PREFIX}status`;
      const completedTimeKey = `${REDIS_KEYS.JOB_STATUS_PREFIX}completed_time`;

      await this.redisService.set(statusKey, 'completed', 24 * 60 * 60);
      await this.redisService.set(
        completedTimeKey,
        new Date().toISOString(),
        24 * 60 * 60,
      );
    } catch (error) {
      this.logger.warn('Failed to mark job as completed:', error);
    }
  }

  async getLastProccessedOfflineUserLastSeenAt(): Promise<Date | null> {
    try {
      const lastProcessedKey = `${REDIS_KEYS.JOB_STATUS_PREFIX}last_processed`;
      const lastProcessed = await this.redisService.get(lastProcessedKey);
      return lastProcessed ? new Date(lastProcessed) : null;
    } catch (error) {
      this.logger.warn('Failed to get last processed timestamp:', error);
      return null;
    }
  }

  async updateLastProccessedOfflineUserLastSeenAt(
    timestamp: Date,
  ): Promise<void> {
    try {
      const lastProcessedKey = `${REDIS_KEYS.JOB_STATUS_PREFIX}last_processed`;
      await this.redisService.set(
        lastProcessedKey,
        timestamp.toISOString(),
        7 * 24 * 60 * 60,
      );
    } catch (error) {
      this.logger.warn('Failed to update last processed timestamp:', error);
    }
  }
}
