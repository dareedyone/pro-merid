import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
// import { User } from '../user/user.entity';
// import { RekognitionService } from '../common/rekognition.service';
import { ConfigService } from '@nestjs/config';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Verification } from './entities/verification.entity';
import { RekognitionService } from 'src/system/aws/rekognition.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly em: EntityManager,
    private readonly rekognition: RekognitionService,
    private readonly config: ConfigService,
    @InjectRepository(Verification)
    private verificationRepo: EntityRepository<Verification>,
  ) {}

  // async verifyUser(userId: string, selfieUrl: string, idUrl: string) {
  //   const similarity = await this.rekognition.compareFaces(selfieUrl, idUrl);
  //   const idText = await this.rekognition.extractText(idUrl);

  //   const user = await this.em.findOneOrFail(User, userId);

  //   const nameMatches = idText.some(
  //     (text) => user.name && text.includes(user.name),
  //   );

  //   const flagged = similarity < 85 || !nameMatches;

  //   const verification = this.em.create(Verification, {
  //     user,
  //     selfieUrl,
  //     idUrl,
  //     similarity,
  //     idText,
  //     flagged,
  //     status: 'PENDING',
  //   });

  //   await this.em.persistAndFlush(verification);
  //   return verification;
  // }

  // async escalateToIDWise(verificationId: string) {
  //   const verification = await this.verificationRepo.findOneOrFail(
  //     { id: verificationId },
  //     // { populate: ['user'] },
  //   );

  //   const apiKey = this.config.get<string>('IDWISE_API_KEY');
  //   const response = await axios.post(
  //     'https://api.idwise.com/v1/verify',
  //     {
  //       documentImageUrl: verification?.data?.idUrl,
  //       selfieImageUrl: verification?.data?.selfieUrl,
  //     },
  //     {
  //       headers: { Authorization: `Bearer ${apiKey}` },
  //     },
  //   );

  //   if (verification && verification.data) {
  //     verification.data.idwiseResult = response.data;
  //   }
  //   verification.status = response.data.verified ? 'VERIFIED' : 'REJECTED';

  //   await this.em.persistAndFlush(verification);

  //   return verification;
  // }

  // async startIDWiseJourney(verificationId: string): Promise<string> {
  //   const apiKey = this.config.get<string>('IDWISE_API_KEY');
  //   const resp = await axios.post(
  //     'https://api.idwise.com/v1/journeys', // actual endpoint
  //     {
  //       reference: verificationId,
  //       // you can specify which modules to include (ID doc, selfie, etc.)
  //     },
  //     { headers: { Authorization: `Bearer ${apiKey}` } },
  //   );
  //   const journeyId = resp.data.journeyId;
  //   // Save journeyId to DB for later steps
  //   await this.em.nativeUpdate(
  //     Verification,
  //     { id: verificationId },
  //     { idwiseJourneyId: journeyId },
  //   );
  //   return journeyId;
  // }

  // async submitToJourney(verificationId: string): Promise<void> {
  //   const verification = await this.em.findOneOrFail(
  //     Verification,
  //     verificationId,
  //   );
  //   const { idwiseJourneyId, idUrl, selfieUrl } = verification;
  //   const apiKey = this.config.get<string>('IDWISE_API_KEY');

  //   // Submit ID image
  //   await axios.post(
  //     `https://api.idwise.com/v1/journeys/${idwiseJourneyId}/steps`,
  //     { stepType: 'document', imageUrl: idUrl },
  //     { headers: { Authorization: `Bearer ${apiKey}` } },
  //   );

  //   // Submit selfie image
  //   await axios.post(
  //     `https://api.idwise.com/v1/journeys/${idwiseJourneyId}/steps`,
  //     { stepType: 'selfie', imageUrl: selfieUrl },
  //     { headers: { Authorization: `Bearer ${apiKey}` } },
  //   );
  // }

  // async completeIDWiseJourney(verificationId: string): Promise<any> {
  //   const verification = await this.em.findOneOrFail(
  //     Verification,
  //     verificationId,
  //   );
  //   const apiKey = this.config.get<string>('IDWISE_API_KEY');

  //   const resp = await axios.post(
  //     `https://api.idwise.com/v1/journeys/${verification.idwiseJourneyId}/complete`,
  //     {},
  //     { headers: { Authorization: `Bearer ${apiKey}` } },
  //   );

  //   verification.idwiseResult = resp.data;
  //   verification.status = resp.data.verified ? 'VERIFIED' : 'REJECTED';
  //   await this.em.persistAndFlush(verification);
  //   return resp.data;
  // }
}
