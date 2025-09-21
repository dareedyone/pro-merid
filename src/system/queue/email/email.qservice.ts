import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Injectable } from '@nestjs/common';
import { SendEmailCodeType } from './email.type';
import { EMAIL_QUEUE } from '../const/queue';
import {
  SEND_EMAIL_CODE_JOB,
  SEND_EMAIL_JOB,
  SEND_WELCOME_EMAIL_JOB,
} from '../const/job';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}

  async sendEmailCode(data: SendEmailCodeType) {
    await this.emailQueue.add(SEND_EMAIL_CODE_JOB, data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
    });
  }

  async sendWelcomeEmail(data: { to: string; subject: string }) {
    await this.emailQueue.add(SEND_WELCOME_EMAIL_JOB, data, {
      delay: 1000,
      attempts: 3,
    });
  }

  async sendEmailJob(data: { to: string; subject: string; body: string }) {
    return await this.emailQueue.add(SEND_EMAIL_JOB, data, {
      attempts: 3,
      backoff: 5000,
    });
  }
}
