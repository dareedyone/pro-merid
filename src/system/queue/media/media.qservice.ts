import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Injectable } from '@nestjs/common';
import { MEDIA_QUEUE } from '../const/queue';
import { JobPayload } from '../queue.type';
import { MediaJobType } from './media.type';

@Injectable()
export class MediaQueueService {
  constructor(@InjectQueue(MEDIA_QUEUE) private readonly mediaQueue: Queue) {}

  async enqueueJob(jobType: MediaJobType, job: JobPayload) {
    switch (jobType) {
      case MediaJobType.VERIFY_SELFIE:
        return this.enqueueVerifySelfie(job);
      case MediaJobType.VERIFY_PICTURES:
        return this.enqueueVerifyPictures(job);
      case MediaJobType.UPLOAD_MEDIA:
        return this.enqueueUploadMedia(job);
      default:
        throw new Error(`Unknown jobType: ${jobType}`);
    }
  }

  private async enqueueVerifySelfie(data: JobPayload) {
    await this.mediaQueue.add(MediaJobType.VERIFY_SELFIE, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
    });
  }

  private async enqueueVerifyPictures(data: JobPayload) {
    await this.mediaQueue.add(MediaJobType.VERIFY_PICTURES, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
    });
  }

  private async enqueueUploadMedia(data: JobPayload) {
    await this.mediaQueue.add(MediaJobType.UPLOAD_MEDIA, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
    });
  }
}
