import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { S3Service } from 'src/system/aws/s3.service';
import { RekognitionService } from 'src/system/aws/rekognition.service';
import { MediaQueueService } from './media.qservice';
import { UserService } from 'src/feature/user/user.service';
import { DatingService } from 'src/feature/dating/dating.service';
import { NotificationService } from 'src/system/notification/notification.service';
import { MIN_SIMILARITY } from 'src/common/contant';
import { UnprocessableEntityException } from '@nestjs/common';
import { JobContextService } from '../job-context.service';
import { MediaCategory, MediaJobContext, MediaJobType } from './media.type';
import { JobPayload } from '../queue.type';

@Processor('media')
export class MediaProcessor {
  constructor(
    private readonly s3Service: S3Service,
    private readonly rekognitionService: RekognitionService,
    private readonly mediaQueueService: MediaQueueService,
    private readonly userService: UserService,
    private readonly datingService: DatingService,
    private readonly notificationService: NotificationService,
    private readonly jobContextService: JobContextService,
  ) {}

  private async getContext(
    jobId: string,
  ): Promise<MediaJobContext & { jobId: string }> {
    const context = await this.jobContextService.get<MediaJobContext>(
      jobId,
      'media',
    );
    if (!context) {
      // Log the error or handle it as needed
      throw new UnprocessableEntityException('Job context not found');
    }
    return { ...context, jobId };
  }

  private async handleAfterMath(
    job: Job<JobPayload>,
    context: MediaJobContext,
  ) {
    const nextStep = (context?.nextStep ?? 0) + 1;
    const next = context?.queueFlow?.[nextStep];

    if (!next) return;

    await this.jobContextService.set<MediaJobContext>('media', job.data.jobId, {
      nextStep,
    });

    await this.mediaQueueService.enqueueJob(next, job.data);
  }

  @Process(MediaJobType.VERIFY_SELFIE)
  async handleVerifySelfie(job: Job<JobPayload>) {
    const context = await this.getContext(job.data.jobId);
    const { pushToken, jobId } = context;

    if (!context?.selfie) {
      // some error log/ dd or track js, it means the selfie was provided but not here probably cache expired since dto would already checked for selfie
      return;
    }

    const isLiveSelfie = await this.rekognitionService.detectLiveness(
      context.selfie,
    );
    if (!isLiveSelfie) {
      await this.notificationService.sendPushNotification({
        pushToken,
        title: 'Selfie Verification failed',
        body: 'Your uploaded selfie could not be verified. Please try again.',
      });
      await this.jobContextService.delete('media', jobId);
      return;
    }

    await this.handleAfterMath(job, context);
  }

  @Process(MediaJobType.VERIFY_PICTURES)
  async handleVerifyPictures(job: Job<JobPayload>) {
    const context = await this.getContext(job.data.jobId);
    const { jobId, pushToken, selfie, profilePictures } = context;

    if (!selfie || !profilePictures?.length) {
      throw new UnprocessableEntityException(
        'Selfie or profile pictures are missing',
      );
    }

    const similarityResponses =
      await this.rekognitionService.compareFaceAgainstMany(
        selfie,
        profilePictures,
      );

    const matches = similarityResponses.filter(
      (response) => response.similarity,
    );

    //note: here is what controls if we want all user pictures to be them or not
    if (!matches.length || profilePictures.length !== matches.length) {
      await this.notificationService.sendPushNotification({
        pushToken,
        title: 'Profile Verification failed.',
        body: `We couldn't detect you are the one in some of your pictures. Please try again.`,
      });
      await this.jobContextService.delete('media', jobId);
    }
    await this.handleAfterMath(job, context);
  }

  @Process(MediaJobType.UPLOAD_MEDIA)
  async handleUploadMedia(job: Job<JobPayload>) {
    const context = await this.getContext(job.data.jobId);
    const {
      userId,
      profileId,
      locationProfileId,
      category,
      selfie,
      profilePictures,
      isNewSelfie,
      pushToken,
    } = context;

    const picturesToUpload = [];

    if (isNewSelfie && !selfie) {
      throw new UnprocessableEntityException(
        'Selfie is required for new selfie uploads',
      );
    }

    if (!profilePictures?.length) {
      throw new UnprocessableEntityException(
        'Profile pictures are required for upload',
      );
    }

    const fixedKey = `${userId}/${profileId}/${locationProfileId}`;

    if (isNewSelfie) {
      picturesToUpload.push({
        key: `selfies/${fixedKey}`,
        isUser: true,
        order: 0,
        file: selfie,
      });
    }
    if (profilePictures?.length) {
      const profilePicturesToUpload = profilePictures.map((picture) => ({
        key: `profile-pictures/${fixedKey}`,
        isUser: true, // since the are checked already in verify job
        file: picture.file,
        order: picture.order,
      }));
      picturesToUpload.push(...profilePicturesToUpload);
    }

    if (!picturesToUpload.length) {
      throw new UnprocessableEntityException(
        'No pictures to upload. Ensure you provide either a selfie or profile pictures.',
      );
    }

    const uploadResponse = await this.s3Service.uploadFiles(picturesToUpload);
    if (isNewSelfie) {
      await this.userService.updateFaceVerificationStatus(userId, true);
      await this.notificationService.sendPushNotification({
        pushToken,
        title: 'Profile Verification',
        body: 'Your profile pictures have been successfully verified.',
      });
    }

    const upateData = {
      pictures: uploadResponse,
      userId,
      locationProfileId,
    };
    if (category === MediaCategory.DATING) {
      await this.datingService.handleMediaUpdate(upateData);
    } else if (category === MediaCategory.FRIEND) {
      // Handle friend media upload logic here
    }

    await this.notificationService.sendPushNotification({
      pushToken,
      title: 'Media Upload',
      body: 'Your media has been successfully uploaded.',
    });

    await this.handleAfterMath(job, context);
  }
}
