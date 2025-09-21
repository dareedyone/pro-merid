import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../system/cache/redis.service';
import {
  ActivityTracker,
  ActivityEmailData,
} from '../../system/queue/activity/activity.type';
import { REDIS_KEYS } from '../../common/constants/redis-keys';

@Injectable()
export class ActivityTrackerService {
  private readonly logger = new Logger(ActivityTrackerService.name);
  private readonly TRACKER_TTL: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    const configuredDays = this.configService.get<number>(
      'ACTIVITY_TRACKER_TTL_DAYS',
      30,
    );
    this.TRACKER_TTL = configuredDays * 24 * 60 * 60; // Convert days to seconds
  }

  private async _getAllTrackers(): Promise<Record<string, ActivityTracker>> {
    try {
      const hashData = await this.redisService.hGetAll(
        REDIS_KEYS.ACTIVITY_TRACKERS,
      );
      const trackers: Record<string, ActivityTracker> = {};

      for (const [userId, trackerJson] of Object.entries(hashData)) {
        try {
          trackers[userId] = JSON.parse(trackerJson);
        } catch (parseError) {
          this.logger.warn(
            `Failed to parse tracker for user ${userId}:`,
            parseError,
          );
        }
      }

      return trackers;
    } catch (error) {
      this.logger.error('Failed to get all activity trackers:', error);
      return {};
    }
  }

  private async _saveAllTrackers(
    trackers: Record<string, ActivityTracker>,
  ): Promise<void> {
    try {
      const hashData: Record<string, string> = {};
      for (const [userId, tracker] of Object.entries(trackers)) {
        hashData[userId] = JSON.stringify(tracker);
      }

      await this.redisService.del(REDIS_KEYS.ACTIVITY_TRACKERS);
      for (const [userId, trackerJson] of Object.entries(hashData)) {
        await this.redisService.hSet(
          REDIS_KEYS.ACTIVITY_TRACKERS,
          userId,
          trackerJson,
        );
      }

      await this.redisService.expire(
        REDIS_KEYS.ACTIVITY_TRACKERS,
        this.TRACKER_TTL,
      );
    } catch (error) {
      this.logger.error('Failed to save all activity trackers:', error);
      throw error;
    }
  }

  async getActivityTracker(userId: string): Promise<ActivityTracker | null> {
    try {
      const trackerJson = await this.redisService.hGet(
        REDIS_KEYS.ACTIVITY_TRACKERS,
        userId,
      );
      if (!trackerJson) {
        return null;
      }

      return JSON.parse(trackerJson);
    } catch (error) {
      this.logger.error(
        `Failed to get activity tracker for user ${userId}:`,
        error,
      );
      return null;
    }
  }

  async updateActivityTracker(
    userId: string,
    totalMatches: number,
    totalMessages: number,
  ): Promise<void> {
    try {
      const tracker: ActivityTracker = {
        userId,
        lastSentMatchCount: totalMatches,
        lastSentMessageCount: totalMessages,
        lastEmailSentAt: new Date(),
      };

      await this.redisService.hSet(
        REDIS_KEYS.ACTIVITY_TRACKERS,
        userId,
        JSON.stringify(tracker),
      );

      const exists = await this.redisService.exists(
        REDIS_KEYS.ACTIVITY_TRACKERS,
      );
      if (!exists) {
        await this.redisService.expire(
          REDIS_KEYS.ACTIVITY_TRACKERS,
          this.TRACKER_TTL,
        );
      }

      this.logger.debug(
        `Updated activity tracker for user ${userId}: ${totalMatches} matches, ${totalMessages} messages`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update activity tracker for user ${userId}:`,
        error,
      );
    }
  }

  async resetActivityTracker(userId: string): Promise<void> {
    try {
      await this.redisService.hDel(REDIS_KEYS.ACTIVITY_TRACKERS, userId);

      this.logger.debug(`Reset activity tracker for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to reset activity tracker for user ${userId}:`,
        error,
      );
    }
  }

  async shouldSendEmailIfNewerActivity(
    userId: string,
    currentMatches: number,
    currentMessages: number,
    matchDetails: Array<{
      matchedUserId: string;
      matchedUserName: string;
      matchedAt: Date;
    }>,
  ): Promise<{ shouldSend: boolean; emailData?: ActivityEmailData }> {
    try {
      const tracker = await this.getActivityTracker(userId);

      if (!tracker) {
        if (currentMatches > 0 || currentMessages > 0) {
          return {
            shouldSend: true,
            emailData: {
              userId,
              newMatches: currentMatches,
              totalMatches: currentMatches,
              newMessages: currentMessages,
              totalMessages: currentMessages,
              matchDetails,
            },
          };
        }
        return { shouldSend: false };
      }

      const newMatches = Math.max(
        0,
        currentMatches - tracker.lastSentMatchCount,
      );
      const newMessages = Math.max(
        0,
        currentMessages - tracker.lastSentMessageCount,
      );

      if (newMatches > 0 || newMessages > 0) {
        const newMatchDetails = matchDetails.filter(
          (match) => match.matchedAt > tracker.lastEmailSentAt,
        );

        return {
          shouldSend: true,
          emailData: {
            userId,
            newMatches,
            totalMatches: currentMatches,
            newMessages,
            totalMessages: currentMessages,
            matchDetails: newMatchDetails,
          },
        };
      }

      return { shouldSend: false };
    } catch (error) {
      this.logger.error(
        `Failed to determine email sending for user ${userId}:`,
        error,
      );
      return { shouldSend: false };
    }
  }

  async batchResetActivityTrackers(userIds: string[]): Promise<void> {
    try {
      if (userIds.length > 0) {
        await this.redisService.hDel(REDIS_KEYS.ACTIVITY_TRACKERS, ...userIds);
      }

      this.logger.debug(
        `Batch reset activity trackers for ${userIds.length} users`,
      );
    } catch (error) {
      this.logger.error('Failed to batch reset activity trackers:', error);
    }
  }

  async getTrackerStats(): Promise<{
    totalTrackers: number;
    recentEmailsSent: number;
  }> {
    try {
      const allTrackers = await this._getAllTrackers();
      const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const totalTrackers = Object.keys(allTrackers).length;

      const recentEmailsSent = Object.values(allTrackers).filter(
        (tracker) =>
          tracker.lastEmailSentAt &&
          new Date(tracker.lastEmailSentAt) > recentCutoff,
      ).length;

      return {
        totalTrackers,
        recentEmailsSent,
      };
    } catch (error) {
      this.logger.error('Failed to get tracker stats:', error);
      return {
        totalTrackers: 0,
        recentEmailsSent: 0,
      };
    }
  }

  async cleanupExpiredTrackers(): Promise<void> {
    try {
      const allTrackers = await this._getAllTrackers();
      const expiryCutoff = new Date(Date.now() - this.TRACKER_TTL * 1000);
      let cleanedCount = 0;

      Object.entries(allTrackers).forEach(([userId, tracker]) => {
        if (
          tracker.lastEmailSentAt &&
          new Date(tracker.lastEmailSentAt) < expiryCutoff
        ) {
          delete allTrackers[userId];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        await this._saveAllTrackers(allTrackers);
        this.logger.debug(
          `Cleaned up ${cleanedCount} expired activity trackers`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired activity trackers:', error);
    }
  }
}
