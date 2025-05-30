import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Injectable } from '@nestjs/common';
import { EMAIL_QUEUE, SEND_EMAIL, SEND_EMAIL_CODE } from '../queue.constant';
import { SendEmailCodeType } from './email.type';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}

  async sendEmailCode(data: SendEmailCodeType) {
    await this.emailQueue.add(SEND_EMAIL_CODE, data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
    });
  }

  async sendWelcomeEmail(data: { to: string; subject: string }) {
    await this.emailQueue.add(data, {
      delay: 1000,
      attempts: 3,
    });
  }

  async sendEmailJob(data: { to: string; subject: string; body: string }) {
    await this.emailQueue.add(SEND_EMAIL, data, {
      attempts: 3,
      backoff: 5000,
    });
  }
}
