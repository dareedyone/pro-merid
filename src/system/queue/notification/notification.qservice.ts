import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { NOTIFICATION_QUEUE } from '../const/queue';
import {
  SEND_NOTIFICATION_JOB,
  SEND_BULK_NOTIFICATION_JOB,
} from '../const/job';

export interface NotificationJobData {
  userId: string;
  type: string;
  data: {
    title?: string;
    body?: string;
    matchedUserId?: string;
    matchedUserName?: string;
    chatId?: string;
    message?: string;
    senderName?: string;
    fromUserId?: string;
    fromUserName?: string;
    rejectedByUserId?: string;
    rejectedByUserName?: string;
  };
}

export interface BulkNotificationJobData {
  notifications: NotificationJobData[];
}

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {}

  /**
   * Queue a single notification
   */
  async queueNotification(data: NotificationJobData): Promise<Job<NotificationJobData>> {
    this.logger.log(`Queueing notification for user ${data.userId}`);
    
    return await this.notificationQueue.add(SEND_NOTIFICATION_JOB, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }

  /**
   * Queue bulk notifications
   */
  async queueBulkNotifications(data: BulkNotificationJobData): Promise<Job<BulkNotificationJobData>> {
    this.logger.log(`Queueing ${data.notifications.length} bulk notifications`);
    
    return await this.notificationQueue.add(SEND_BULK_NOTIFICATION_JOB, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }

  /**
   * Queue notifications with delay
   */
  async queueNotificationWithDelay(
    data: NotificationJobData,
    delayMs: number,
  ): Promise<Job<NotificationJobData>> {
    this.logger.log(`Queueing notification for user ${data.userId} with ${delayMs}ms delay`);
    
    return await this.notificationQueue.add(SEND_NOTIFICATION_JOB, data, {
      delay: delayMs,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }
}
