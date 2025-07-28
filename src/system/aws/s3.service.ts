// import { Injectable } from '@nestjs/common';
// import { Express } from 'express';
// import {
//   S3Client,
//   PutObjectCommand,
//   PutObjectCommandInput,
// } from '@aws-sdk/client-s3';
// import { v4 as uuid } from 'uuid';
// import { ConfigService } from '@nestjs/config';
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { Multer } from 'multer';
// import { UploadPictureType } from 'src/common/types/interface';

// @Injectable()
// export class S3Service {
//   private readonly s3: S3Client;
//   private readonly bucketName: string;
//   private readonly region: string; // Added region as class property

//   constructor(private readonly configService: ConfigService) {
//     const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
//     const secretAccessKey = this.configService.get<string>(
//       'AWS_SECRET_ACCESS_KEY',
//     );
//     this.region = this.configService.get<string>('AWS_REGION') as string;
//     this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') as string;

//     if (!accessKeyId || !secretAccessKey || !this.region || !this.bucketName) {
//       throw new Error(
//         'Missing AWS S3 configuration: check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET',
//       );
//     }

//     this.s3 = new S3Client({
//       region: this.region,
//       credentials: {
//         accessKeyId,
//         secretAccessKey,
//       },
//     });
//   }

//   async uploadFile(payload: UploadPictureType): Promise<void> {
//     if (!payload.file?.buffer) {
//       throw new Error('Invalid file: buffer is missing');
//     }

//     const params: PutObjectCommandInput = {
//       Bucket: this.bucketName,
//       Key: payload.url,
//       Body: payload.file.buffer,
//       ContentType: payload.file.mimetype,
//     };

//     try {
//       await this.s3.send(new PutObjectCommand(params));
//       // todo: create a static medthod for the url to use in user serv
//       // return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${url}`;
//     } catch (error) {
//       throw new Error(
//         `Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`,
//       );
//     }
//   }

//   async uploadFiles(
//     // files: Express.Multer.File[],
//     // folder: string,
//     files: UploadPictureType[],
//   ): Promise<void> {
//     if (!Array.isArray(files)) {
//       throw new Error('Files must be an array');
//     }

//     const uploadPromises = files.map((file) => this.uploadFile(file));
//     await Promise.all(uploadPromises);
//   }
// }

import { Injectable } from '@nestjs/common';
import { Express } from 'express';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer';
import {
  UploadPictureResponseType,
  UploadPictureType,
} from 'src/common/types/interface';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly region: string; // Added region as class property

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    this.region = this.configService.get<string>('AWS_REGION') as string;
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') as string;

    if (!accessKeyId || !secretAccessKey || !this.region || !this.bucketName) {
      throw new Error(
        'Missing AWS S3 configuration: check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET',
      );
    }

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(
    payload: UploadPictureType,
  ): Promise<UploadPictureResponseType> {
    const { file, key: keyPart, isUser, order } = payload;

    if (!file?.buffer) {
      throw new Error('Invalid file: buffer is missing');
    }

    const key = `${keyPart}/${order}/${uuid()}-${file.originalname}`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await this.s3.send(new PutObjectCommand(params));
      return {
        url: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`,
        isUser,
        order,
        fileType: file.mimetype,
      };
    } catch (error) {
      throw new Error(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async uploadFiles(
    payload: UploadPictureType[],
  ): Promise<UploadPictureResponseType[]> {
    if (!Array.isArray(payload)) {
      throw new Error('Files must be an array');
    }

    const uploadPromises = payload.map((data) => this.uploadFile(data));
    return await Promise.all(uploadPromises);
  }

  private extractS3KeyFromUrl(url: string): string {
    const match = url.match(/amazonaws\.com\/(.+)$/);
    return match?.[1] ?? '';
  }

  async deleteFile(url: string): Promise<void> {
    const s3Key = this.extractS3KeyFromUrl(url);
    if (!s3Key) {
      console.warn(`Invalid S3 URL provided: ${url}`);
      return;
    }

    const params: DeleteObjectCommandInput = {
      Bucket: this.bucketName,
      Key: s3Key,
    };

    try {
      await this.s3.send(new DeleteObjectCommand(params));
    } catch (error) {
      throw new Error(
        `Failed to delete file from S3: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async deleteFiles(urls: string[]): Promise<void> {
    const deletePromises = urls.map((url) => this.deleteFile(url));
    await Promise.all(deletePromises);
  }

  async bulkDeleteFiles(urls: string[]): Promise<void> {
    const keys = urls
      .map(this.extractS3KeyFromUrl)
      .filter((k) => k)
      .map((Key) => ({ Key }));

    if (!keys.length) return;

    try {
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: { Objects: keys },
        }),
      );
    } catch (error) {
      throw new Error(
        `Bulk delete failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
