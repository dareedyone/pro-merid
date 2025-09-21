import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
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

@Injectable()
export class ActivityQueueService {
  private readonly logger = new Logger(ActivityQueueService.name);

  constructor(
    @InjectQueue(ACTIVITY_QUEUE) private readonly activityQueue: Queue,
  ) {}

  async scheduleOfflineUserProcessing(
    data: ProcessOfflineUsersData,
  ): Promise<Job<ProcessOfflineUsersData>> {
    this.logger.log('Scheduling offline user processing');

    return await this.activityQueue.add(PROCESS_OFFLINE_USERS_JOB, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 5,
      removeOnFail: 10,
      delay: data.isFirstBatch ? 0 : 1000,
    });
  }

  async processBatch(
    data: ProcessUserBatchData,
  ): Promise<Job<ProcessUserBatchData>> {
    return await this.activityQueue.add(PROCESS_USER_BATCH_JOB, data, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 1000 },
      removeOnComplete: 20,
      removeOnFail: 10,
    });
  }

  async processSingleUser(
    data: ProcessSingleUserData,
  ): Promise<Job<ProcessSingleUserData>> {
    return await this.activityQueue.add(PROCESS_SINGLE_USER_JOB, data, {
      attempts: 2,
      delay: 100,
      removeOnComplete: 50,
      removeOnFail: 20,
    });
  }

  async scheduleNextBatch(
    jobData: ProcessOfflineUsersData,
  ): Promise<Job<ProcessOfflineUsersData>> {
    try {
      const job = await this.activityQueue.add(
        PROCESS_OFFLINE_USERS_JOB,
        jobData,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 5,
          removeOnFail: 10,
          delay: 1000,
        },
      );

      this.logger.debug('Scheduled next offline user processing batch');
      return job;
    } catch (error) {
      this.logger.error('Failed to schedule next batch:', error);
      throw error;
    }
  }

  async getQueueStats() {
    const waiting = await this.activityQueue.getWaiting();
    const active = await this.activityQueue.getActive();
    const completed = await this.activityQueue.getCompleted();
    const failed = await this.activityQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}
