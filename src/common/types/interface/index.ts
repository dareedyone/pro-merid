import type { CreateLocationProfileMediaDto } from 'src/common/dtos/location-media.dto';
export enum UploadCategory {
  DATING = 'dating',
  FRIEND = 'friend',
}
export interface VerifyUploadPictureType {
  category: UploadCategory;
  userId: string;
  profileId: string;
  locationProfileId: string;
  pushToken?: string;
  selfie: CreateLocationProfileMediaDto['selfie'];
  profilePictures: CreateLocationProfileMediaDto['profilePictures'];
}

export interface UploadPictureType {
  key: string;
  order: number;
  isUser: boolean;
  file: Express.Multer.File;
}

export interface UploadPictureObjType {
  category: UploadCategory;
  pushToken?: string;
  userId: string;
  locationProfileId: string;
  pictures: UploadPictureType[];
}

export interface UploadPictureResponseType {
  url: string;
  isUser: boolean;
  fileType: string;
  order: number;
}

export interface UploadPictureResponseObjType {
  pictures: UploadPictureResponseType[];
  profileId: string;
  userId: string;
}
