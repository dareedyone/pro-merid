import { Module } from '@nestjs/common';
import { RekognitionService } from './rekognition.service';
import { S3Service } from './s3.service';

@Module({
  providers: [RekognitionService, S3Service],
  exports: [RekognitionService, S3Service],
})
export class AwsModule {}
