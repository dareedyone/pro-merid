import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ProfileInteraction } from '../user/entities/profile/profile-interaction.entity';
import { ChatService } from '../chat/chat.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ProfileType, UnmatchReason } from 'src/common/types/enums/other.enum';
import {
  NotificationService,
  NotificationType,
} from '../../system/notification/notification.service';

@Injectable()
export class MatchTimerService {
  private readonly logger = new Logger(MatchTimerService.name);
  // todo: remove this service since it's only used by cron job
  constructor(
    private readonly em: EntityManager,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationService: NotificationService,
  ) {}

  // Manual method to process match expiry (moved from cron to system/cron)
  async processMatchExpiry() {
    const startTime = Date.now();
    this.logger.log('Processing match expiry (notifications + unmatching)...');

    try {
      const now = new Date();
      const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find matches expiring soon (for notifications)
      const expiringSoon = await this.findMatchesExpiringBetween(
        now,
        sixHoursFromNow,
      );

      // Find actually expired matches (for unmatching)
      const expired = await this.findMatchesExpiredBefore(twentyFourHoursAgo);

      this.logger.log(
        `Found ${expiringSoon.length} matches expiring soon, ${expired.length} expired matches`,
      );

      // Process both efficiently in parallel
      await Promise.all([
        this.sendExpiryNotifications(expiringSoon),
        this.unmatchExpiredPairs(expired),
      ]);

      const duration = Date.now() - startTime;
      this.logger.log(`Match expiry processing completed in ${duration}ms`);
    } catch (error) {
      this.logger.error('Error processing match expiry:', error);
    }
  }

  /**
   * Find matches that will expire within the given time range
   */
  async findMatchesExpiringBetween(
    startTime: Date,
    endTime: Date,
  ): Promise<ProfileInteraction[]> {
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return this.em.find(
      ProfileInteraction,
      {
        isMatch: true,
        profileType: ProfileType.DATE,
        matchedAt: {
          $gte: new Date(startTime.getTime() - twentyFourHours),
          $lt: new Date(endTime.getTime() - twentyFourHours),
        },
      },
      {
        populate: ['match'],
        limit: 1000, // Reasonable limit for notifications
        orderBy: { matchedAt: 'ASC' },
      },
    );
  }

  /**
   * Find matches that have already expired before the given time
   */
  async findMatchesExpiredBefore(
    beforeTime: Date,
  ): Promise<ProfileInteraction[]> {
    return this.em.find(
      ProfileInteraction,
      {
        isMatch: true,
        profileType: ProfileType.DATE,
        matchedAt: { $lt: beforeTime },
      },
      {
        populate: ['match'],
        limit: 1000, // Reasonable limit for processing
        orderBy: { matchedAt: 'ASC' },
      },
    );
  }

  /**
   * Send expiry notifications to users with matches expiring soon
   */
  async sendExpiryNotifications(
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
   */
  async unmatchExpiredPairs(
    expiredMatches: ProfileInteraction[],
  ): Promise<void> {
    if (expiredMatches.length === 0) return;

    this.logger.log(`Unmatching ${expiredMatches.length} expired pairs`);

    // Process in batches to prevent memory issues
    const batchSize = 50;
    for (let i = 0; i < expiredMatches.length; i += batchSize) {
      const batch = expiredMatches.slice(i, i + batchSize);
      await Promise.all(batch.map((match) => this.processExpiredMatch(match)));
    }
  }

  /**
   * Calculate time left until match expires
   */
  calculateTimeLeft(matchedAt: Date): string {
    const now = new Date();
    const timeLeft = matchedAt.getTime() + 24 * 60 * 60 * 1000 - now.getTime();

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

  private async processExpiredMatch(match: ProfileInteraction) {
    try {
      // Check if there's a corresponding reverse match
      const reverseMatch = await this.em.findOne(
        ProfileInteraction,
        {
          sourceUser: match.targetUser,
          targetUser: match.sourceUser,
          profileType: ProfileType.DATE,
          isMatch: true,
        },
        {
          populate: ['match'],
        },
      );

      if (!reverseMatch) {
        this.logger.warn(
          `No reverse match found for ${match.sourceUser} -> ${match.targetUser}`,
        );
        return;
      }

      // Check if chat exists and has messages
      const matchId = this.generateMatchId(
        match.sourceUser.id,
        match.targetUser.id,
        ProfileType.DATE,
      );
      const chat = await this.chatService.getChatByMatchId(matchId);

      let shouldUnmatch = true;

      if (chat) {
        // Check if there are any messages in this chat
        const messageCount = await this.chatService.getMessageCount(
          (chat as { id: string }).id,
        );
        shouldUnmatch = messageCount === 0;
      }

      if (shouldUnmatch) {
        await this.unmatchExpiredUsers(match, reverseMatch);
        this.logger.log(
          `Unmatched users ${match.sourceUser} and ${match.targetUser} due to 24-hour timeout`,
        );
      } else {
        this.logger.log(
          `Match between ${match.sourceUser} and ${match.targetUser} has messages, keeping active`,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing expired match ${match.id}:`, error);
    }
  }

  private async unmatchExpiredUsers(
    match1: ProfileInteraction,
    match2: ProfileInteraction,
  ) {
    try {
      const unmatchedAt = new Date();

      // Update Match entity with unmatch data
      if (match1.match) {
        const match = match1.match;
        match.isUnmatched = true;
        match.unmatchedAt = unmatchedAt;
        match.unmatchedBy = 'system'; // System-initiated unmatch
        match.unmatchReason = UnmatchReason.EXPIRED;
        match.unmatchMessage =
          'Match expired after 24 hours without first message';
        await this.em.persistAndFlush(match);
      }

      // Archive any existing chat
      await this.archiveChatForUnmatch(
        match1.sourceUser.id,
        match1.targetUser.id,
      );

      // Send notification about unmatch
      await this.chatGateway.notifyChatArchived(
        `match-${match1.sourceUser.id}-${match1.targetUser.id}`,
        [match1.sourceUser.id, match1.targetUser.id],
      );

      // Send notifications to both users about the expiry
      await Promise.all([
        this.notificationService.sendNotification({
          userId: match1.sourceUser.id,
          type: NotificationType.UNMATCH,
          data: {
            title: 'Match Expired',
            body: `Your match with ${match2.targetUser.firstName} expired after 24 hours`,
            matchedUserId: match2.targetUser.id,
            matchedUserName: match2.targetUser.firstName,
          },
        }),
        this.notificationService.sendNotification({
          userId: match2.targetUser.id,
          type: NotificationType.UNMATCH,
          data: {
            title: 'Match Expired',
            body: `Your match with ${match1.sourceUser.firstName} expired after 24 hours`,
            matchedUserId: match1.sourceUser.id,
            matchedUserName: match1.sourceUser.firstName,
          },
        }),
      ]);
    } catch (error) {
      this.logger.error('Error unmatching expired users:', error);
    }
  }

  private async archiveChatForUnmatch(
    userId1: string,
    userId2: string,
  ): Promise<void> {
    try {
      // Find the chat between these two users
      const chats = await this.chatService.getChats(
        userId1,
        ProfileType.DATE,
        1,
        100,
      );
      const chat = chats.chats.find((c: any) => {
        const participants = (
          c as {
            participants: Array<{ id: string }>;
          }
        ).participants;
        return (
          participants?.some((p: { id: string }) => p.id === userId2) || false
        );
      });

      if (chat) {
        await this.chatService.archiveChat(chat.id, userId1);
      }
    } catch (error) {
      this.logger.error('Error archiving chat for unmatch:', error);
    }
  }

  // Manual method to check specific match (for testing)
  async checkSpecificMatch(userId1: string, userId2: string) {
    const match = await this.em.findOne(
      ProfileInteraction,
      {
        sourceUser: userId1,
        targetUser: userId2,
        profileType: ProfileType.DATE,
        isMatch: true,
      },
      {
        populate: ['match'],
      },
    );

    if (match) {
      await this.processExpiredMatch(match);
    }
  }
}
