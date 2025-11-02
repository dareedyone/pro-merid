import { Injectable, Logger } from '@nestjs/common';
import { ChatGateway } from '../../feature/chat/chat.gateway';
import { PushNotificationService } from './push-notification.service';
import { EmailQueueService } from '../queue/email/email.qservice';
import { UserService } from '../../feature/user/user.service';

export enum NotificationType {
  MATCH = 'match',
  MESSAGE = 'message',
  UNMATCH = 'unmatch',
  VERIFICATION = 'verification',
  MEDIA = 'media',
  WELCOME = 'welcome',
  REMATCH_REQUEST = 'rematch_request',
  REMATCH_ACCEPTED = 'rematch_accepted',
  REMATCH_REJECTED = 'rematch_rejected',
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPTED = 'friend_accepted',
  FRIEND_DECLINED = 'friend_declined',
  UNFRIEND = 'unfriend',
  CALL_INCOMING = 'call_incoming',
  CALL_ENDED = 'call_ended',
  CALL_MISSED = 'call_missed',
  CALL_DECLINED = 'call_declined',
  CONTENT_BLOG_PUBLISHED = 'content_blog_published',
  CONTENT_EVENT_PUBLISHED = 'content_event_published',
  CONTENT_STORY_PUBLISHED = 'content_story_published',
}

export interface NotificationContext {
  userId: string;
  type: NotificationType;
  data: {
    matchedUserId?: string;
    matchedUserName?: string;
    chatId?: string;
    message?: string;
    senderName?: string;
    title?: string;
    body?: string;
    fromUserId?: string;
    fromUserName?: string;
    matchId?: string;
    rejectedByUserId?: string;
    rejectedByUserName?: string;
    callId?: string;
    callType?: string;
    callerName?: string;
    callerAvatar?: string;
    duration?: number;
    contentId?: string;
    contentType?: 'blog' | 'event' | 'success_story';
    contentTitle?: string;
    contentSlug?: string;
    contentPreview?: string;
    contentImage?: string;
  };
}

export interface NotificationStrategy {
  webSocket: boolean;
  push: boolean;
  email: boolean;
  emailDelay?: number; // in milliseconds
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly pushNotificationService: PushNotificationService,
    private readonly emailQueueService: EmailQueueService,
    private readonly userService: UserService,
  ) {}

  private getNotificationStrategy(
    type: NotificationType,
  ): NotificationStrategy {
    switch (type) {
      case NotificationType.MATCH:
        return {
          webSocket: true,
          push: true,
          email: true,
          emailDelay: 24 * 60 * 60 * 1000, // 24 hours - if user doesn't open app after push
        };
      case NotificationType.MESSAGE:
        return { webSocket: true, push: true, email: false };
      case NotificationType.UNMATCH:
        return { webSocket: true, push: true, email: false };
      case NotificationType.VERIFICATION:
        return { webSocket: true, push: true, email: false };
      case NotificationType.MEDIA:
        return { webSocket: true, push: true, email: false };
      case NotificationType.WELCOME:
        return { webSocket: false, push: false, email: true };
      case NotificationType.REMATCH_REQUEST:
        return {
          webSocket: true,
          push: true,
          email: true,
          emailDelay: 24 * 60 * 60 * 1000, // 24 hours
        };
      case NotificationType.REMATCH_ACCEPTED:
        return { webSocket: true, push: true, email: false };
      case NotificationType.REMATCH_REJECTED:
        return { webSocket: false, push: true, email: false };
      case NotificationType.CALL_INCOMING:
        return { webSocket: true, push: true, email: false };
      case NotificationType.CALL_ENDED:
        return { webSocket: true, push: false, email: false };
      case NotificationType.CALL_MISSED:
        return { webSocket: true, push: true, email: false };
      case NotificationType.CALL_DECLINED:
        return { webSocket: true, push: false, email: false };
      case NotificationType.CONTENT_BLOG_PUBLISHED:
        return { webSocket: true, push: true, email: false };
      case NotificationType.CONTENT_EVENT_PUBLISHED:
        return { webSocket: true, push: true, email: false };
      case NotificationType.CONTENT_STORY_PUBLISHED:
        return { webSocket: true, push: true, email: false };
      default:
        return { webSocket: false, push: true, email: false };
    }
  }

  async sendNotification(context: NotificationContext) {
    const { userId, type } = context;
    const strategy = this.getNotificationStrategy(type);

    try {
      let webSocketSent = false;

      if (strategy.webSocket) {
        webSocketSent = await this.tryWebSocketNotification(context);
        if (webSocketSent) {
          this.logger.log(`WebSocket notification sent to user ${userId}`);
        }
      }

      if (strategy.push && !webSocketSent) {
        await this.sendPushNotification(context);
        this.logger.log(`Push notification sent to user ${userId}`);
      }

      // if (strategy.email) {
      //   if (strategy.emailDelay) {
      //     await this.scheduleEmailNotification(context, strategy.emailDelay);
      //   } else {
      //     await this.sendEmailNotification(context);
      //   }
      // }
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${userId}:`,
        error,
      );
    }
  }

  async sendPushOnly(context: NotificationContext) {
    const { userId } = context;

    try {
      await this.sendPushNotification(context);
      this.logger.log(`Push-only notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${userId}:`,
        error,
      );
    }
  }

  async sendEmailOnly(context: NotificationContext) {
    const { userId } = context;

    try {
      await this.sendEmailNotification(context);
      this.logger.log(`Email-only notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email notification to user ${userId}:`,
        error,
      );
    }
  }

  private async tryWebSocketNotification(
    context: NotificationContext,
  ): Promise<boolean> {
    if (!(await this.chatGateway.isUserConnected(context.userId))) {
      this.logger.debug(`User ${context.userId} not connected via WebSocket`);
      return false;
    }

    try {
      await this.sendWebSocketNotification(context);
      return true;
    } catch (error) {
      this.logger.debug(
        `WebSocket notification failed for user ${context.userId}:`,
        (error as Error).message,
      );
      return false;
    }
  }

  private async sendWebSocketNotification(context: NotificationContext) {
    const { userId, type, data } = context;

    switch (type) {
      case 'match':
        await this.chatGateway.notifyNewMatch(
          userId,
          data.matchedUserId!,
          data.chatId || null,
        );
        break;

      case 'message':
        // WebSocket message notification is handled in ChatGateway
        break;

      case 'unmatch':
        await this.chatGateway.notifyChatArchived(data.chatId!, [
          userId,
          data.matchedUserId!,
        ]);
        break;
    }
  }

  private async sendPushNotification(context: NotificationContext) {
    const { userId, type, data } = context;

    const user = await this.userService.findById(userId);
    if (!user?.auth?.pushToken) {
      this.logger.warn(`No push token found for user ${userId}`);
      return;
    }

    let title: string;
    let body: string;
    let payload: any;

    switch (type) {
      case 'match':
        title = 'New Match! 🎉';
        body = `You have a new match! Start chatting to begin your conversation.`;
        payload = {
          type: 'match',
          matchedUserId: data.matchedUserId,
          chatId: data.chatId,
          // Client will detect app state and handle accordingly
          action: 'open_chat',
          priority: 'high',
        };
        break;

      case 'message':
        title = `New message from ${data.senderName}`;
        body = data.message || 'You have a new message';
        payload = {
          type: 'message',
          chatId: data.chatId,
          senderId: data.matchedUserId,
          // Client will update UI if app is open, show notification if closed
          action: 'open_chat',
          priority: 'normal',
        };
        break;

      case 'unmatch':
        title = 'Match Expired';
        body = 'Your match has expired due to inactivity.';
        payload = {
          type: 'unmatch',
          chatId: data.chatId,
          action: 'refresh_matches',
          priority: 'normal',
        };
        break;

      default:
        return;
    }

    await this.pushNotificationService.sendPushNotification({
      pushToken: user.auth.pushToken,
      title,
      body,
      data: payload,
    });
  }

  // private async scheduleEmailNotification(
  //   context: NotificationContext,
  //   _delay: number,
  // ) {
  //   // Email scheduling is now handled automatically by EmailSchedulerService cron job
  //   // which sends summary emails to users offline for 24+ hours
  //   // No manual scheduling needed - the "last seen" approach handles all delayed emails

  //   this.logger.debug(
  //     `Email scheduling no longer needed for user ${context.userId} (type: ${context.type}) - handled by automated cron job`,
  //   );
  // }

  private async sendEmailNotification(context: NotificationContext) {
    const { userId, type, data } = context;

    const user = await this.userService.findById(userId);
    if (!user?.auth?.email) {
      this.logger.warn(`No email found for user ${userId}`);
      return;
    }

    let subject: string;
    let body: string;

    switch (type) {
      case 'match':
        subject = 'You have a new match on Spefynd!';
        body = `Hi ${user.firstName},\n\nYou have a new match! Start chatting to begin your conversation.\n\nOpen the app to start chatting: ${process.env.APP_URL || 'https://app.spefynd.com'}`;
        break;

      case 'message':
        subject = `New message from ${data.senderName}`;
        body = `Hi ${user.firstName},\n\nYou have a new message from ${data.senderName}:\n\n"${data.message}"\n\nOpen the app to reply: ${process.env.APP_URL || 'https://app.spefynd.com'}`;
        break;

      case 'unmatch':
        subject = 'Your match has expired';
        body = `Hi ${user.firstName},\n\nYour match has expired due to inactivity. Don't worry, you can always find new matches!\n\nOpen the app to continue: ${process.env.APP_URL || 'https://app.spefynd.com'}`;
        break;

      default:
        return;
    }

    await this.emailQueueService.sendEmailJob({
      to: user.auth.email,
      subject,
      body,
    });
  }

  async sendImmediateNotification(context: NotificationContext) {
    const { userId: _userId, type: _type, data: _data } = context;

    // Always try WebSocket first
    await this.sendWebSocketNotification(context);

    // Also send push notification as backup
    await this.sendPushNotification(context);
  }

  // async cancelScheduledEmail(userId: string) {
  //   // Email cancellation is no longer needed with the "last seen" cron approach
  //   // The EmailSchedulerService automatically handles offline users via cron jobs
  //   // No manual scheduling/cancellation required

  //   this.logger.debug(
  //     `Email cancellation no longer needed for user ${userId} - handled by automated cron job`,
  //   );
  // }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(contexts: NotificationContext[]) {
    const promises = contexts.map((context) => this.sendNotification(context));
    await Promise.allSettled(promises);
  }
}
