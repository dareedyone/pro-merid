import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { NOTIFICATION_QUEUE } from '../const/queue';
import {
  SEND_NOTIFICATION_JOB,
  SEND_BULK_NOTIFICATION_JOB,
} from '../const/job';
import {
  NotificationJobData,
  BulkNotificationJobData,
} from './notification.qservice';
import { NotificationService } from '../../notification/notification.service';

@Processor(NOTIFICATION_QUEUE)
@Injectable()
export class NotificationQueueWorker {
  private readonly logger = new Logger(NotificationQueueWorker.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Process(SEND_NOTIFICATION_JOB)
  async processNotification(job: Job<NotificationJobData>) {
    const { userId, type, data } = job.data;
    
    this.logger.log(`Processing notification for user ${userId}`);

    try {
      await this.notificationService.sendNotification({
        userId,
        type: type as any,
        data,
      });

      this.logger.log(`Successfully sent notification to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}:`, error);
      throw error; // Re-throw to trigger retry
    }
  }

  @Process(SEND_BULK_NOTIFICATION_JOB)
  async processBulkNotifications(job: Job<BulkNotificationJobData>) {
    const { notifications } = job.data;
    
    this.logger.log(`Processing ${notifications.length} bulk notifications`);

    try {
      const notificationContexts = notifications.map((notification) => ({
        userId: notification.userId,
        type: notification.type as any,
        data: notification.data,
      }));

      await this.notificationService.sendBulkNotifications(notificationContexts);

      this.logger.log(`Successfully sent ${notifications.length} bulk notifications`);
    } catch (error) {
      this.logger.error(`Failed to send bulk notifications:`, error);
      throw error; // Re-throw to trigger retry
    }
  }
}
