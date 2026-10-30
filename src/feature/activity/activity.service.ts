import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/entities/user/user.entity';
import { Match } from '../../common/entities/match.entity';
import { RedisService } from '../../system/cache/redis.service';
import { ChatService } from '../chat/chat.service';
import { Message, MessageDocument } from '../chat/entities/message.entity';
import { REDIS_KEYS, generateDateKey } from '../../common/constants/redis-keys';

export interface OfflineUserData {
  id: string;
  firstName?: string;
  lastName?: string;
  lastSeenAt?: Date | null;
  timezone?: string;
  auth: {
    email: string;
  };
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);
  private readonly CACHE_TTL: number;
  private readonly EMAIL_COOLDOWN_DAYS: number;
  private readonly DEFAULT_OFFLINE_DURATION: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    @InjectRepository(Match)
    private readonly matchRepo: EntityRepository<Match>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {
    const configuredCacheHours = this.configService.get<number>(
      'ACTIVITY_CACHE_TTL_HOURS',
      1,
    );
    this.CACHE_TTL = configuredCacheHours * 60 * 60;

    const configuredCooldownDays = this.configService.get<number>(
      'EMAIL_COOLDOWN_DAYS',
      7,
    );
    this.EMAIL_COOLDOWN_DAYS = configuredCooldownDays;

    const configuredHours = this.configService.get<number>(
      'OFFLINE_EMAIL_DURATION_HOURS',
      24,
    );
    this.DEFAULT_OFFLINE_DURATION = configuredHours * 60 * 60 * 1000;
  }

  async updateLastSeen(userId: string): Promise<void> {
    try {
      const now = new Date();

      await this.redisService.set(
        `${REDIS_KEYS.LAST_SEEN_PREFIX}${userId}`,
        now.toISOString(),
        this.CACHE_TTL,
      );

      this.updateDatabaseLastSeen(userId, now).catch((error) => {
        this.logger.error(
          `Failed to update lastSeenAt in database for user ${userId}:`,
          error,
        );
      });

      this.logger.debug(`Updated last seen for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update last seen for user ${userId}:`,
        error,
      );
    }
  }

  async getLastSeen(userId: string): Promise<Date | null> {
    try {
      const cached = await this.redisService.get(
        `${REDIS_KEYS.LAST_SEEN_PREFIX}${userId}`,
      );
      if (cached) {
        return new Date(cached);
      }

      const user = await this.userRepo.findOne(
        { id: userId },
        { fields: ['lastSeenAt'] },
      );
      return user?.lastSeenAt || null;
    } catch (error) {
      this.logger.error(`Failed to get last seen for user ${userId}:`, error);
      return null;
    }
  }

  async getOfflineUsers(
    offlineDurationMs: number,
    limit = 1000,
    options: {
      excludeEmailedToday?: boolean;
      excludeCooldownUsers?: boolean;
      lastProccessedOfflineUserLastSeenAt?: Date;
      specificUserIds?: string[];
    } = {},
  ): Promise<OfflineUserData[]> {
    const cutoffTime = new Date(Date.now() - offlineDurationMs);
    const {
      excludeEmailedToday = false,
      excludeCooldownUsers = false,
      lastProccessedOfflineUserLastSeenAt,
      specificUserIds,
    } = options;

    try {
      const excludeUserIds: string[] = [];

      if (excludeEmailedToday) {
        const emailedTodayUserIds = await this.getEmailedTodayUserIds();
        excludeUserIds.push(...emailedTodayUserIds);
      }

      if (excludeCooldownUsers) {
        const cooldownUserIds = await this.getUsersInCooldown();
        excludeUserIds.push(...cooldownUserIds);
      }

      const uniqueExcludeUserIds = [...new Set(excludeUserIds)];

      const queryConditions: FilterQuery<User> = {
        $or: [{ lastSeenAt: { $lt: cutoffTime } }, { lastSeenAt: null }],
        isActivated: true,
      };

      if (specificUserIds && specificUserIds.length > 0) {
        const filteredSpecificIds = specificUserIds.filter(
          (id) => !uniqueExcludeUserIds.includes(id),
        );
        if (filteredSpecificIds.length > 0) {
          queryConditions.id = { $in: filteredSpecificIds };
        } else {
          return [];
        }
      } else {
        if (uniqueExcludeUserIds.length > 0) {
          queryConditions.id = { $nin: uniqueExcludeUserIds };
        }

        if (lastProccessedOfflineUserLastSeenAt) {
          queryConditions.lastSeenAt = {
            $lt: cutoffTime,
            $gte: lastProccessedOfflineUserLastSeenAt,
          };
        }
      }

      const users = await this.userRepo.find(queryConditions, {
        populate: ['auth'],
        limit,
        orderBy: { lastSeenAt: 'ASC' }, // Process users offline longest first
        fields: [
          'id',
          'firstName',
          'lastName',
          'lastSeenAt',
          'timezone',
          'auth.email',
        ],
      });

      return users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        lastSeenAt: user.lastSeenAt,
        timezone: user.timezone,
        auth: {
          email: user.auth?.email || '',
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get offline users:', error);
      return [];
    }
  }

  async batchUpdateLastSeen(userIds: string[]): Promise<void> {
    try {
      const now = new Date();

      await this.userRepo.nativeUpdate(
        { id: { $in: userIds } },
        { lastSeenAt: now },
      );

      this.logger.debug(`Batch updated last seen for ${userIds.length} users`);
    } catch (error) {
      this.logger.error('Failed to batch update last seen:', error);
    }
  }

  private async updateDatabaseLastSeen(
    userId: string,
    timestamp: Date,
  ): Promise<void> {
    await this.userRepo.nativeUpdate({ id: userId }, { lastSeenAt: timestamp });
  }

  async getActivityStats(): Promise<{
    totalUsers: number;
    activeLastHour: number;
    activeLastDay: number;
    activeLastWeek: number;
  }> {
    const now = Date.now();
    const hourAgo = new Date(now - 60 * 60 * 1000);
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(
      now - this.EMAIL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
    );

    try {
      const [totalUsers, activeLastHour, activeLastDay, activeLastWeek] =
        await Promise.all([
          this.userRepo.count({ isActivated: true }),
          this.userRepo.count({
            lastSeenAt: { $gte: hourAgo },
            isActivated: true,
          }),
          this.userRepo.count({
            lastSeenAt: { $gte: dayAgo },
            isActivated: true,
          }),
          this.userRepo.count({
            lastSeenAt: { $gte: weekAgo },
            isActivated: true,
          }),
        ]);

      return {
        totalUsers,
        activeLastHour,
        activeLastDay,
        activeLastWeek,
      };
    } catch (error) {
      this.logger.error('Failed to get activity stats:', error);
      return {
        totalUsers: 0,
        activeLastHour: 0,
        activeLastDay: 0,
        activeLastWeek: 0,
      };
    }
  }

  private async getEmailedTodayUserIds(): Promise<string[]> {
    try {
      const key = generateDateKey(REDIS_KEYS.EMAIL_SENT_PREFIX);
      const hashData: Record<string, string> =
        await this.redisService.hGetAll(key);
      return Object.keys(hashData);
    } catch (error) {
      this.logger.error('Failed to get emailed today user IDs:', error);
      return [];
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
      this.logger.error('Failed to get users in cooldown:', error);
      return [];
    }
  }

  async getMissedActivity(
    userId: string,
    lastSeenAt?: Date | null,
  ): Promise<{
    matches: number;
    messages: number;
    matchDetails: Array<{
      matchedUserId: string;
      matchedUserName: string;
      matchedAt: Date;
    }>;
  }> {
    const cutoffTime =
      lastSeenAt || new Date(Date.now() - this.DEFAULT_OFFLINE_DURATION);

    try {
      const allMatches = await this.matchRepo.find(
        {
          $or: [{ sourceUserId: userId }, { targetUserId: userId }],
          isUnmatched: false,
        },
        {
          populate: ['sourceUser', 'targetUser'],
        },
      );

      const newMatches = allMatches.filter(
        (match) => match.matchedAt && match.matchedAt >= cutoffTime,
      );

      const matchDetails = newMatches
        .filter((match) => match.matchedAt) // Ensure matchedAt exists
        .map((match) => {
          const isSourceUser = match.sourceUserId === userId;
          const otherUser = isSourceUser ? match.targetUser : match.sourceUser;
          const otherUserId = isSourceUser
            ? match.targetUserId
            : match.sourceUserId;

          return {
            matchedUserId: otherUserId,
            matchedUserName: otherUser?.displayName || 'Someone',
            matchedAt: match.matchedAt!,
          };
        });

      let totalMissedMessages = 0;
      const messageCutoffTime = cutoffTime;

      for (const match of allMatches) {
        try {
          const chat = await this.chatService.getChatByMatchId(match.id);

          if (chat) {
            const missedMessageCount = await this.messageModel.countDocuments({
              chat: chat._id,
              senderId: { $ne: userId },
              createdAt: { $gte: messageCutoffTime },
              isDeleted: false,
            });

            totalMissedMessages += missedMessageCount;
          }
        } catch (error) {
          this.logger.warn(
            `Failed to get messages for match ${match.id}:`,
            error,
          );
        }
      }

      return {
        matches: newMatches.length,
        messages: totalMissedMessages,
        matchDetails,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get missed activity for user ${userId}:`,
        error,
      );
      return {
        matches: 0,
        messages: 0,
        matchDetails: [],
      };
    }
  }

  async isAppropriateTimeForUser(user: OfflineUserData): Promise<boolean> {
    try {
      const userTimezone = user.timezone || 'UTC';
      const now = new Date();
      const userTime = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour: 'numeric',
        hour12: false,
      }).format(now);

      const userHour = parseInt(userTime);
      const isAppropriateTime = userHour >= 8 && userHour <= 22;

      if (!isAppropriateTime) {
        this.logger.debug(
          `Skipping email for user ${user.id} - inappropriate time (${userHour}:00 in ${userTimezone})`,
        );
      }

      return isAppropriateTime;
    } catch (error) {
      this.logger.warn(
        `Failed to check timezone for user ${user.id}, defaulting to send:`,
        error,
      );
      return true;
    }
  }
}
