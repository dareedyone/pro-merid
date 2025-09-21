import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ActivityQueueService } from '../queue/activity/activity.qservice';
import { ActivityProcessor } from '../queue/activity/activity.processor';

@Injectable()
export class EmailSchedulerService {
  private readonly logger = new Logger(EmailSchedulerService.name);

  constructor(
    private readonly activityQueueService: ActivityQueueService,
    private readonly activityProcessor: ActivityProcessor,
  ) {}

  @Cron('0 */6 * * *') // Every 6 hours
  async scheduleOfflineUserEmailProcessing() {
    try {
      this.logger.log('Scheduling offline user email processing');

      const isJobRunning = await this.activityProcessor.isJobRunning();
      if (isJobRunning) {
        this.logger.log(
          'Offline user processing job is already running, skipping...',
        );
        return {
          message: 'Job already running, skipped scheduling',
          skipped: true,
        };
      }

      const lastProccessedOfflineUserLastSeenAt =
        await this.activityProcessor.getLastProccessedOfflineUserLastSeenAt();

      const job = await this.activityQueueService.scheduleOfflineUserProcessing(
        {
          timestamp: new Date(),
          batchSize: 1000, // Will be overridden by processor's configurable batch size
          lastProccessedOfflineUserLastSeenAt:
            lastProccessedOfflineUserLastSeenAt || undefined,
          isFirstBatch: true,
          totalProcessed: 0,
          totalEmailsSent: 0,
          totalEmailsSkipped: 0,
        },
      );

      this.logger.log(`Scheduled offline user processing job: ${job.id}`);

      return {
        jobId: job.id,
        scheduledAt: new Date(),
        message: 'Offline user email processing scheduled successfully',
        lastProccessedOfflineUserLastSeenAt,
      };
    } catch (error) {
      this.logger.error(
        'Failed to schedule offline user email processing:',
        error,
      );
      throw error;
    }
  }
}
