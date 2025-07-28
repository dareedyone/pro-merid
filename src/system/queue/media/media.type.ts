import type { CreateLocationProfileMediaDto } from 'src/common/dtos/location-media.dto';
export enum MediaJobType {
  UPLOAD_MEDIA = 'upload_media',
  VERIFY_SELFIE = 'verify_selfie',
  VERIFY_PICTURES = 'verify_pictures',
}
export enum MediaCategory {
  DATING = 'dating',
  FRIEND = 'friend',
}

export interface MediaJobContext {
  category: MediaCategory;
  userId: string;
  profileId: string;
  locationProfileId: string;
  pushToken?: string;
  selfie: CreateLocationProfileMediaDto['selfie'];
  profilePictures: (CreateLocationProfileMediaDto['profilePictures'][0] & {
    similarity?: number;
  })[];
  nextStep: number;
  queueFlow: MediaJobType[];
  isNewSelfie?: boolean;
}
