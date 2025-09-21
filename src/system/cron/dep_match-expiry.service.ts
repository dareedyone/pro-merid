import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/core';
import { ProfileInteraction } from '../../feature/user/entities/profile/profile-interaction.entity';
import { Match } from '../../common/entities/match.entity';
import { User } from '../../feature/user/entities/user/user.entity';
import { DatingProfile } from '../../feature/dating/entities/dating.profile';
import { ChatService } from '../../feature/chat/chat.service';
import { ChatGateway } from '../../feature/chat/chat.gateway';
import {
  ProfileType,
  // UnmatchReason, // Commented out since unmatching is now handled lazily
} from '../../common/types/enums/other.enum';
import {
  NotificationService,
  NotificationType,
} from '../notification/notification.service';
import { NotificationQueueService } from '../queue/notification/notification.qservice';
// todo: remove this service
// note we are not using this anymore, we will lazy on client since we have email running to notify users not logged in.

@Injectable()
export class MatchExpiryService {
  private readonly logger = new Logger(MatchExpiryService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationService: NotificationService,
    private readonly notificationQueueService: NotificationQueueService,
  ) {}

  // Run every 6 hours to queue match expiry notifications
  // Note: Unmatching is handled lazily by client-side matchedAt checks
  @Cron('0 */6 * * *')
  async processMatchExpiry() {
    const startTime = Date.now();
    this.logger.log('Processing match expiry notifications...');

    try {
      const now = new Date();
      const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

      const expiringSoon = await this.findMatchesExpiringBetween(
        now,
        sixHoursFromNow,
      );

      this.logger.log(`Found ${expiringSoon.length} matches expiring soon`);

      await this.queueExpiryNotifications(expiringSoon);

      const duration = Date.now() - startTime;
      this.logger.log(`Match expiry processing completed in ${duration}ms`);
    } catch (error) {
      this.logger.error('Error processing match expiry:', error);
    }
  }

  /**
   * Find matches that will expire within the given time range
   */
  private async findMatchesExpiringBetween(
    notificationStartTime: Date,
    notificationEndTime: Date,
  ): Promise<Match[]> {
    const matchExpiryDuration = 48 * 60 * 60 * 1000;

    const matchCreationStart = new Date(
      notificationStartTime.getTime() - matchExpiryDuration,
    );
    const matchCreationEnd = new Date(
      notificationEndTime.getTime() - matchExpiryDuration,
    );

    return this.em.find(
      Match,
      {
        isUnmatched: false,
        profileType: ProfileType.DATE,
        matchedAt: {
          $gte: matchCreationStart,
          $lt: matchCreationEnd,
        },
      },
      {
        orderBy: { matchedAt: 'ASC' },
      },
    );
  }

  private async queueExpiryNotifications(
    expiringMatches: Match[],
  ): Promise<void> {
    if (expiringMatches.length === 0) return;

    this.logger.log(
      `Queueing expiry notifications for ${expiringMatches.length} matches`,
    );

    // Get user subscription status for premium check
    const userIds = new Set<string>();
    for (const match of expiringMatches) {
      userIds.add(match.sourceUserId);
      userIds.add(match.targetUserId);
    }

    // Fetch user subscription data for premium check
    const users = await this.em.find(
      User,
      { id: { $in: Array.from(userIds) } },
      { populate: ['datingProfile'] },
    );

    const userSubscriptionMap = new Map<string, boolean>();
    for (const user of users) {
      const isPremium = this.checkUserSubscription(user.datingProfile || null);
      userSubscriptionMap.set(user.id, isPremium);
    }

    // Group by user to avoid duplicate notifications
    const userNotifications = new Map<string, Match[]>();

    for (const match of expiringMatches) {
      const sourceUserId = match.sourceUserId;
      const targetUserId = match.targetUserId;

      // Only queue notifications for premium users
      if (userSubscriptionMap.get(sourceUserId)) {
        if (!userNotifications.has(sourceUserId)) {
          userNotifications.set(sourceUserId, []);
        }
        userNotifications.get(sourceUserId)!.push(match);
      }

      if (userSubscriptionMap.get(targetUserId)) {
        if (!userNotifications.has(targetUserId)) {
          userNotifications.set(targetUserId, []);
        }
        userNotifications.get(targetUserId)!.push(match);
      }
    }

    // Create notification contexts for each user
    const notificationContexts = Array.from(userNotifications.entries()).map(
      ([userId, matches]) => {
        const match = matches[0];
        const timeLeft = this.calculateTimeLeft(match.matchedAt);

        // Determine the other user for this notification
        const otherUserId =
          match.sourceUserId === userId
            ? match.targetUserId
            : match.sourceUserId;

        // Find the other user's name
        const otherUser = users.find((u) => u.id === otherUserId);

        return {
          userId,
          type: NotificationType.MATCH,
          data: {
            title: 'Match Expiring Soon!',
            body: `You have ${timeLeft} left to start chatting with your match`,
            matchedUserId: otherUserId,
            matchedUserName: otherUser?.firstName || 'Your match',
          },
        };
      },
    );

    // Queue notifications using the notification queue service
    if (notificationContexts.length > 0) {
      try {
        await this.notificationQueueService.queueBulkNotifications({
          notifications: notificationContexts,
        });
        this.logger.log(
          `Successfully queued ${notificationContexts.length} expiry notifications for premium users`,
        );
      } catch (error) {
        this.logger.error('Error queueing expiry notifications:', error);
      }
    } else {
      this.logger.log('No premium users found for expiry notifications');
    }
  }

  // /**
  //  * Find matches that have already expired before the given time
  //  * @deprecated - Unmatching is now handled lazily by client-side matchedAt checks
  //  */
  // private async findMatchesExpiredBefore(
  //   beforeTime: Date,
  // ): Promise<ProfileInteraction[]> {
  //   return this.em.find(
  //     ProfileInteraction,
  //     {
  //       isMatch: true,
  //       profileType: ProfileType.DATE,
  //       match: { isUnmatched: false },
  //       matchedAt: { $lt: beforeTime },
  //     },
  //     {
  //       populate: ['match'],
  //       limit: 1000, // Reasonable limit for processing
  //       orderBy: { matchedAt: 'ASC' },
  //     },
  //   );
  // }

  /**
   * Queue expiry notifications for processing
   * TODO: Implement premium feature check - only queue for premium users
   */

  /**
   * Send expiry notifications to users with matches expiring soon
   * @deprecated - Use queueExpiryNotifications instead
   */
  private async sendExpiryNotifications(
    expiringMatches: ProfileInteraction[],
  ): Promise<void> {
    if (expiringMatches.length === 0) return;

    this.logger.log(
      `Sending expiry notifications for ${expiringMatches.length} matches`,
    );

    // Group by user to avoid duplicate notifications
    const userNotifications = new Map<string, ProfileInteraction[]>();

    for (const match of expiringMatches) {
      const sourceUserId = match.sourceUser.id;
      const targetUserId = match.targetUser.id;

      if (!userNotifications.has(sourceUserId)) {
        userNotifications.set(sourceUserId, []);
      }
      if (!userNotifications.has(targetUserId)) {
        userNotifications.set(targetUserId, []);
      }

      userNotifications.get(sourceUserId)!.push(match);
      userNotifications.get(targetUserId)!.push(match);
    }

    // Send notifications to each user
    const notificationPromises = Array.from(userNotifications.entries()).map(
      async ([userId, matches]) => {
        try {
          const timeLeft = this.calculateTimeLeft(matches[0].matchedAt!);

          await this.notificationService.sendNotification({
            userId,
            type: NotificationType.MATCH,
            data: {
              title: 'Match Expiring Soon!',
              body: `You have ${timeLeft} left to start chatting with your match`,
              matchedUserId: matches[0].targetUser.id,
              matchedUserName: matches[0].targetUser.firstName,
            },
          });
        } catch (error) {
          this.logger.error(
            `Error sending expiry notification to user ${userId}:`,
            error,
          );
        }
      },
    );

    await Promise.all(notificationPromises);
  }

  /**
   * Unmatch expired pairs and clean up
   * @deprecated - Unmatching is now handled lazily by client-side matchedAt checks
   * This reduces database load and is more efficient
   */
  private async unmatchExpiredPairs(
    expiredMatches: ProfileInteraction[],
  ): Promise<void> {
    if (expiredMatches.length === 0) return;

    this.logger.log(`Unmatching ${expiredMatches.length} expired pairs`);

    // Process in batches to prevent memory issues
    const batchSize = 50;
    for (let i = 0; i < expiredMatches.length; i += batchSize) {
      const _batch = expiredMatches.slice(i, i + batchSize);
      // await Promise.all(_batch.map((match) => this.processExpiredMatch(match)));
    }
  }

  private calculateTimeLeft(matchedAt: Date): string {
    const now = new Date();
    const timeLeft = matchedAt.getTime() + 48 * 60 * 60 * 1000 - now.getTime();

    if (timeLeft <= 0) return '0 minutes';

    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  }

  /**
   * Generate consistent matchId for both users in a match
   * Uses lexicographic ordering to ensure same ID regardless of who initiated
   */
  private generateMatchId(
    profileId1: string,
    profileId2: string,
    profileType: ProfileType,
  ): string {
    // Sort profile IDs lexicographically for consistency
    const [firstId, secondId] = [profileId1, profileId2].sort();
    return `${firstId}-${secondId}-${profileType}`;
  }

  /**
   * Process expired match for unmatching
   * @deprecated - Unmatching is now handled lazily by client-side matchedAt checks
   */
  // private async processExpiredMatch(match: ProfileInteraction) {
  //   try {
  //     // Find both interactions by matchId (more efficient)
  //     const interactions = await this.em.find(
  //       ProfileInteraction,
  //       {
  //         match: { id: match.match?.id, isUnmatched: false },
  //         isMatch: true,
  //         profileType: ProfileType.DATE,
  //       },
  //       {
  //         populate: ['match'],
  //       },
  //     );

  //     if (interactions.length !== 2) {
  //       this.logger.warn(
  //         `Invalid match data for ${match.match?.id} - expected 2 interactions, found ${interactions.length}`,
  //       );
  //       return;
  //     }

  //     // Find the reverse match
  //     const reverseMatch = interactions.find((i) => i.id !== match.id);

  //     if (!reverseMatch) {
  //       this.logger.warn(
  //         `No reverse match found for ${match.sourceUser} -> ${match.targetUser}`,
  //       );
  //       return;
  //     }

  //     // Check if chat exists and has messages
  //     const chat = await this.chatService.getChatByMatchId(
  //       match.match?.id || '',
  //     );

  //     let shouldUnmatch = true;

  //     if (chat) {
  //       // Check if there are any messages in this chat
  //       const messageCount = await this.chatService.getMessageCount(
  //         (chat as { id: string }).id,
  //       );
  //       shouldUnmatch = messageCount === 0;
  //     }

  //     if (shouldUnmatch) {
  //       await this.unmatchExpiredUsers(match, reverseMatch);
  //       this.logger.log(
  //         `Unmatched users ${match.sourceUser} and ${match.targetUser} due to 48-hour timeout`,
  //       );
  //     } else {
  //       this.logger.log(
  //         `Match between ${match.sourceUser} and ${match.targetUser} has messages, keeping active`,
  //       );
  //     }
  //   } catch (error) {
  //     this.logger.error(`Error processing expired match ${match.id}:`, error);
  //   }
  // }

  /**
   * Unmatch expired users
   * @deprecated - Unmatching is now handled lazily by client-side matchedAt checks
   */
  // private async unmatchExpiredUsers(
  //   match1: ProfileInteraction,
  //   match2: ProfileInteraction,
  // ) {
  //   try {
  //     const unmatchedAt = new Date();

  //     // Enhanced unmatch tracking for system-initiated unmatch
  //     // Update Match entity with unmatch data
  //     if (match1.match) {
  //       const match = match1.match;
  //       match.isUnmatched = true;
  //       match.unmatchedAt = unmatchedAt;
  //       match.unmatchedBy = 'system'; // System-initiated unmatch
  //       match.unmatchReason = UnmatchReason.EXPIRED;
  //       match.unmatchMessage =
  //         'Match expired after 48 hours without first message';
  //       await this.em.persistAndFlush(match);
  //     }

  //     // Archive any existing chat
  //     await this.archiveChatForUnmatch(
  //       match1.sourceUser.id,
  //       match1.targetUser.id,
  //     );

  //     // Send notification about unmatch
  //     await this.chatGateway.notifyChatArchived(
  //       `match-${match1.sourceUser.id}-${match1.targetUser.id}`,
  //       [match1.sourceUser.id, match1.targetUser.id],
  //     );

  //     // Send notifications to both users about the expiry
  //     await Promise.all([
  //       this.notificationService.sendNotification({
  //         userId: match1.sourceUser.id,
  //         type: NotificationType.UNMATCH,
  //         data: {
  //           title: 'Match Expired',
  //           body: `Your match with ${match2.targetUser.firstName} expired after 48 hours`,
  //           matchedUserId: match2.targetUser.id,
  //           matchedUserName: match2.targetUser.firstName,
  //         },
  //       }),
  //       this.notificationService.sendNotification({
  //         userId: match2.targetUser.id,
  //         type: NotificationType.UNMATCH,
  //         data: {
  //           title: 'Match Expired',
  //           body: `Your match with ${match1.sourceUser.firstName} expired after 48 hours`,
  //           matchedUserId: match1.sourceUser.id,
  //           matchedUserName: match1.sourceUser.firstName,
  //         },
  //       }),
  //     ]);
  //   } catch (error) {
  //     this.logger.error('Error unmatching expired users:', error);
  //   }
  // }

  /**
   * Archive chat for unmatch
   * @deprecated - Unmatching is now handled lazily by client-side matchedAt checks
   */
  // private async archiveChatForUnmatch(
  //   userId1: string,
  //   userId2: string,
  // ): Promise<void> {
  //   try {
  //     // Generate matchId to find the specific chat
  //     const matchId = this.generateMatchId(
  //       userId1, // Using userId as profileId for simplicity
  //       userId2,
  //       ProfileType.DATE,
  //     );

  //     const chat = await this.chatService.getChatByMatchId(matchId);

  //     if (chat) {
  //       await this.chatService.archiveChat(chat._id.toString(), userId1);
  //     }
  //   } catch (error) {
  //     this.logger.error('Error archiving chat for unmatch:', error);
  //   }
  // }

  /**
   * Manual method to check specific match (for testing)
   * @deprecated - Unmatching is now handled lazily by client-side matchedAt checks
   */
  async checkSpecificMatch(userId1: string, userId2: string) {
    const match = await this.em.findOne(
      ProfileInteraction,
      {
        sourceUser: userId1,
        targetUser: userId2,
        profileType: ProfileType.DATE,
        isMatch: true,
        match: { isUnmatched: false },
      },
      {
        populate: ['match'],
      },
    );

    if (match) {
      // await this.processExpiredMatch(match);
    }
  }

  /**
   * Check if user has premium subscription based on dating profile
   * This mirrors the logic from DatingInteractionService.checkSubscriptions
   */
  private checkUserSubscription(datingProfile: DatingProfile | null): boolean {
    if (!datingProfile) return false;

    const now = new Date();
    const hasControl = Boolean(
      datingProfile.controlEndsAt &&
        new Date(datingProfile.controlEndsAt) > now,
    );
    const hasTrueFynd = Boolean(
      datingProfile.trueFyndEndsAt &&
        new Date(datingProfile.trueFyndEndsAt) > now,
    );

    return hasControl || hasTrueFynd;
  }
}
