import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';

import { ACTIVITY_QUEUE } from '../const/queue';
import {
  PROCESS_OFFLINE_USERS_JOB,
  PROCESS_USER_BATCH_JOB,
  PROCESS_SINGLE_USER_JOB,
} from '../const/job';
import {
  ProcessOfflineUsersData,
  ProcessUserBatchData,
  ProcessSingleUserData,
} from './activity.type';

import { ActivityService } from '../../../feature/activity/activity.service';
import { ActivityProcessor } from './activity.processor';
import { ActivityQueueService } from './activity.qservice';

@Processor(ACTIVITY_QUEUE)
@Injectable()
export class ActivityQueueWorker {
  private readonly logger = new Logger(ActivityQueueWorker.name);

  constructor(
    private readonly activityService: ActivityService,
    private readonly activityProcessor: ActivityProcessor,
    private readonly activityQueueService: ActivityQueueService,
  ) {}

  @Process(PROCESS_OFFLINE_USERS_JOB)
  async processOfflineUsers(job: Job<ProcessOfflineUsersData>) {
    const {
      batchSize = 1000,
      lastProccessedOfflineUserLastSeenAt,
      isFirstBatch = false,
      totalProcessed = 0,
      totalEmailsSent = 0,
      totalEmailsSkipped = 0,
    } = job.data;

    this.logger.log(
      `Processing offline users batch - First: ${isFirstBatch}, Last processed: ${lastProccessedOfflineUserLastSeenAt?.toISOString() || 'none'}`,
    );

    try {
      const offlineDurationMS = 24 * 60 * 60 * 1000; // 24 hours
      const batch = await this.activityService.getOfflineUsers(
        offlineDurationMS,
        batchSize,
        {
          excludeEmailedToday: true,
          excludeCooldownUsers: true,
          lastProccessedOfflineUserLastSeenAt,
        },
      );

      if (batch.length === 0) {
        this.logger.log('No more offline users to process - job completed');

        await this.activityProcessor.markJobCompleted();

        return {
          totalProcessed,
          emailsSent: totalEmailsSent,
          emailsSkipped: totalEmailsSkipped,
          completedAt: new Date(),
          message: 'All offline users processed successfully',
        };
      }

      this.logger.debug(`Processing batch of ${batch.length} users`);

      const batchResults =
        await this.activityProcessor.processOfflineUsersBatch(batch);

      const newTotalProcessed = totalProcessed + batch.length;
      const newTotalEmailsSent = totalEmailsSent + batchResults.emailsSent;
      const newTotalEmailsSkipped =
        totalEmailsSkipped + batchResults.emailsSkipped;

      const latestLastSeenAt = batch[batch.length - 1].lastSeenAt;
      if (latestLastSeenAt) {
        await this.activityProcessor.updateLastProccessedOfflineUserLastSeenAt(
          latestLastSeenAt,
        );
      }

      const progress = Math.min(
        (newTotalProcessed / (newTotalProcessed + batchSize)) * 100,
        95,
      );
      await job.progress(progress);

      this.logger.log(
        `Batch completed: ${batch.length} users processed, ${batchResults.emailsSent} emails sent, ${batchResults.emailsSkipped} emails skipped`,
      );

      if (batch.length < batchSize) {
        await this.activityProcessor.markJobCompleted();

        this.logger.log(
          `Offline user processing completed: ${newTotalProcessed} users processed, ${newTotalEmailsSent} emails sent, ${newTotalEmailsSkipped} emails skipped`,
        );
      } else {
        const nextJobData: ProcessOfflineUsersData = {
          timestamp: new Date(),
          batchSize,
          lastProccessedOfflineUserLastSeenAt: latestLastSeenAt || new Date(),
          isFirstBatch: false,
          totalProcessed: newTotalProcessed,
          totalEmailsSent: newTotalEmailsSent,
          totalEmailsSkipped: newTotalEmailsSkipped,
        };
        await this.activityQueueService.scheduleNextBatch(nextJobData);
      }

      return {
        totalProcessed: newTotalProcessed,
        emailsSent: newTotalEmailsSent,
        emailsSkipped: newTotalEmailsSkipped,
        completedAt: new Date(),
        isLastBatch: batch.length < batchSize,
      };
    } catch (error) {
      this.logger.error('Failed to process offline users batch:', error);
      throw error;
    }
  }

  @Process(PROCESS_USER_BATCH_JOB)
  async processUserBatch(job: Job<ProcessUserBatchData>) {
    const { userIds } = job.data;

    this.logger.debug(`Processing user batch of ${userIds.length} users`);

    try {
      const offlineDurationMS = 24 * 60 * 60 * 1000;
      const users = await this.activityService.getOfflineUsers(
        offlineDurationMS,
        userIds.length,
        {
          specificUserIds: userIds,
        },
      );

      const results =
        await this.activityProcessor.processOfflineUsersBatch(users);

      return {
        processed: users.length,
        emailsSent: results.emailsSent,
        emailsSkipped: results.emailsSkipped,
      };
    } catch (error) {
      this.logger.error('Failed to process user batch:', error);
      throw error;
    }
  }

  @Process(PROCESS_SINGLE_USER_JOB)
  async processSingleUser(job: Job<ProcessSingleUserData>) {
    const { userId } = job.data;

    try {
      this.logger.debug(`Processing single user: ${userId}`);

      const offlineDurationMS = 24 * 60 * 60 * 1000;
      const users = await this.activityService.getOfflineUsers(
        offlineDurationMS,
        1,
        {
          specificUserIds: [userId],
        },
      );

      if (users.length > 0) {
        const result = await this.activityProcessor.processOfflineUser(
          users[0],
        );
        return {
          userId,
          processedAt: new Date(),
          emailSent: result.emailSent,
        };
      }

      return {
        userId,
        processedAt: new Date(),
        emailSent: false,
        message: 'User not found or not offline',
      };
    } catch (error) {
      this.logger.error(
        `Failed to process single user ${userId}:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}
