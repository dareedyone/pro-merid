import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  RekognitionClient,
  CompareFacesCommand,
  DetectTextCommand,
  RekognitionClientConfig,
  DetectFacesCommand,
  DetectFacesCommandOutput,
} from '@aws-sdk/client-rekognition';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { RekognitionCompareType } from './aws.type';
import { MIN } from 'class-validator';
import { MIN_SIMILARITY } from 'src/common/contant';
import { CreateMediaDto } from 'src/common/dtos/location-media.dto';

type BufferType = Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>;

@Injectable()
export class RekognitionService {
  private rekognition: RekognitionClient;

  constructor(private config: ConfigService) {
    const region = this.getRequiredConfig('AWS_REGION');
    const credentials = this.getAwsCredentials();

    const clientConfig: RekognitionClientConfig = {
      region,
      credentials,
    };

    this.rekognition = new RekognitionClient(clientConfig);
  }

  private getRequiredConfig(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }

  private getAwsCredentials(): AwsCredentialIdentity {
    return {
      accessKeyId: this.getRequiredConfig('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.getRequiredConfig('AWS_SECRET_ACCESS_KEY'),
    };
  }

  private async getImageBytesFromUrl(url: string): Promise<Uint8Array> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
      });
      return new Uint8Array(response.data);
    } catch (error) {
      throw new Error(
        `Failed to fetch image from URL: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async compareFaces(source: BufferType, target: BufferType): Promise<number> {
    const command = new CompareFacesCommand({
      SourceImage: { Bytes: source },
      TargetImage: { Bytes: target },
      SimilarityThreshold: MIN_SIMILARITY,
    });

    try {
      const response = await this.rekognition.send(command);
      const match = response.FaceMatches?.[0];
      return match ? (match.Similarity ?? 0) : 0;
    } catch (error) {
      //   throw new Error(
      //     `Face comparison failed: ${error instanceof Error ? error.message : String(error)}`,
      //   );
      throw new UnprocessableEntityException(
        `Face comparison failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async compareFacesFromUrl(
    sourceUrl: string,
    targetUrl: string,
  ): Promise<number> {
    // try {
    const [sourceBytes, targetBytes] = await Promise.all([
      this.getImageBytesFromUrl(sourceUrl),
      this.getImageBytesFromUrl(targetUrl),
    ]);

    return await this.compareFaces(sourceBytes, targetBytes);
    // } catch (error) {
    //   throw new Error(
    //     `Face comparison failed: ${error instanceof Error ? error.message : String(error)}`,
    //   );
    // }
  }

  async compareFacesFromFiles(
    sourceFile: Express.Multer.File,
    targetFile: Express.Multer.File,
  ): Promise<number> {
    return await this.compareFaces(sourceFile.buffer, targetFile.buffer);
  }

  async compareFaceAgainstMany(
    source: Express.Multer.File,
    targets: CreateMediaDto[],
  ): Promise<RekognitionCompareType[]> {
    const results: {
      similarity: number;
      order: number;
      file: Express.Multer.File;
    }[] = [];

    for (const { file, order } of targets) {
      try {
        const similarity = await this.compareFacesFromFiles(source, file);
        results.push({ similarity, order, file });
      } catch (error) {
        //todo: handle errors gracefully
        results.push({ similarity: 0, order, file });
      }
    }

    return results;
  }

  async extractTextFromUrl(imageUrl: string): Promise<string[]> {
    const bytes = await this.getImageBytesFromUrl(imageUrl);
    return this.extractText(bytes);
  }

  async extractTextFromFile(file: Express.Multer.File): Promise<string[]> {
    return this.extractText(file.buffer);
  }

  async extractText(buffer: BufferType): Promise<string[]> {
    const command = new DetectTextCommand({
      Image: { Bytes: buffer },
    });
    try {
      const response = await this.rekognition.send(command);
      return (response.TextDetections || [])
        .filter((t) => t.Type === 'LINE' && t.Confidence && t.Confidence > 90)
        .map((t) => t.DetectedText ?? '');
    } catch (error) {
      throw new Error(
        `Text extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async detectLiveness(file: Express.Multer.File): Promise<boolean> {
    const command = new DetectFacesCommand({
      Image: { Bytes: file.buffer },
      Attributes: ['ALL'],
    });

    let result: DetectFacesCommandOutput;
    try {
      result = await this.rekognition.send(command);
    } catch (error) {
      throw new Error(
        `Failed to detect face: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Safely check that FaceDetails exists and has exactly one face
    if (!result.FaceDetails || result.FaceDetails.length !== 1) {
      return false;
    }

    const face = result.FaceDetails[0];

    // Check that eyes are open with high confidence
    const eyesOpen =
      face.EyesOpen?.Value === true && (face.EyesOpen.Confidence ?? 0) > 95;

    // Check image quality
    const sharpnessOk = (face.Quality?.Sharpness ?? 0) > 70;
    const brightnessOk = (face.Quality?.Brightness ?? 0) > 60;

    // Check if face is naturally angled (not overly flat or skewed)
    const poseOk =
      Math.abs(face.Pose?.Yaw ?? 0) > 2 || Math.abs(face.Pose?.Pitch ?? 0) > 2;

    // Optional: detect smiling (optional behavior, can help detect spoofing)
    // const smiling = face.Smile?.Value === true && (face.Smile.Confidence ?? 0) > 90;

    return eyesOpen && sharpnessOk && brightnessOk && poseOk;
  }
}
