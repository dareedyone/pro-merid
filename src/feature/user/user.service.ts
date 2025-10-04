import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { User } from './entities/user/user.entity';
import { EmailQueueService } from 'src/system/queue/email/email.qservice';
import { Auth } from '../auth/entities/auth.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Interest } from './entities/user/character/interest.entity';
import { Country } from '../location/entities/country.entity';
import { Profession } from './entities/user/character/profession.entity';
import { ReligionSect } from './entities/user/character/religion-sect.entity';
import { Ethnic } from '../location/entities/ethnic.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly em: EntityManager,
    private readonly emailQueueService: EmailQueueService,
    @InjectRepository(Auth) private authRepo: EntityRepository<Auth>,
    @InjectRepository(User) private userRepo: EntityRepository<User>,
    @InjectRepository(Interest)
    private interestRepo: EntityRepository<Interest>,
    @InjectRepository(Country) private countryRepo: EntityRepository<Country>,
    @InjectRepository(Profession)
    private professionRepo: EntityRepository<Profession>,
    @InjectRepository(ReligionSect)
    private religionSectRepo: EntityRepository<ReligionSect>,
    @InjectRepository(Ethnic) private ethnicRepo: EntityRepository<Ethnic>,
  ) {}

  private async handleUserRelations(
    payload: CreateUserDto | UpdateUserDto,
    user: User,
  ): Promise<void> {
    if (payload.professionId) {
      const profession = await this.professionRepo.findOneOrFail({
        id: payload.professionId,
      });
      user.profession = profession;
    }

    if (payload.religionSectId) {
      const religionSect = await this.religionSectRepo.findOneOrFail({
        id: payload.religionSectId,
      });
      user.religionSect = religionSect;
    }

    if (payload.ethnicId) {
      const ethnic = await this.ethnicRepo.findOneOrFail({
        id: payload.ethnicId,
      });
      user.ethnicity = ethnic;
    }

    if (payload.originCountryId) {
      const country = await this.countryRepo.findOneOrFail({
        id: payload.originCountryId,
      });
      user.originCountry = country;
    }

    if (payload.grewUpInId) {
      const country = await this.countryRepo.findOneOrFail({
        id: payload.grewUpInId,
      });
      user.grewUpIn = country;
    }

    for (const interestId of payload.interestIds || []) {
      const interest = await this.interestRepo.findOneOrFail({
        id: interestId,
      });
      user.interests.add(interest);
    }

    for (const nationalityId of payload.nationalityIds || []) {
      const country = await this.countryRepo.findOneOrFail({
        id: nationalityId,
      });
      user.nationalities.add(country);
    }
  }

  private sortUserDtoFields<T extends CreateUserDto | UpdateUserDto>(
    payload: T,
  ) {
    const {
      interestIds,
      nationalityIds,
      professionId,
      religionSectId,
      ethnicId,
      originCountryId,
      grewUpInId,
      ...data
    } = payload;

    return {
      data: data,
      relationFileds: {
        interestIds,
        nationalityIds,
        professionId,
        religionSectId,
        ethnicId,
        originCountryId,
        grewUpInId,
      },
    };
  }

  async updateFaceVerificationStatus(
    userId: string,
    isFaceVerified: boolean,
  ): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ id: userId });
    user.isFaceVerified = isFaceVerified;
    await this.em.flush();
  }

  async findById(userId: string): Promise<User> {
    return this.userRepo.findOneOrFail({ id: userId }, { populate: ['auth'] });
  }

  //   if (authWithUser) {
  //     const auth = await this.authRepo.findOneOrFail(
  //       { id: authId },
  //       { populate: ['user'] },
  //     );
  //     if (!auth.user)
  //       throw new BadRequestException('This auth is not linked to a user yet.');

  //     return auth.user;
  //   }

  //   return await this.userRepo.findOneOrFail({ auth: authId });
  // }

  //   payload: UploadPictureResponseType[],
  // ): Promise<Media[]> {
  //   let locationProfile = await this.dateLocationProfileRepo.findOneOrFail({
  //     id: payload[0].locationProfileId,
  //   });

  //   const media: Media[] = [];

  //   // const bucketName = this.configService.get<string>(
  //   //   'AWS_S3_BUCKET',
  //   // ) as string;

  //   // const region = this.configService.get<string>('AWS_REGION') as string;

  //   // const media = [];
  //   // const baseUrl = `https://${bucketName}.s3.${region}.amazonaws.com`;
  //   // const fixedUrl = `${userId}/${profileId}/${locationProfileId}`;

  //   // if (selfie) {
  //   //   let url = `${baseUrl}/selfie-pictures/${fixedUrl}`;
  //   //   const newMedia = this.mediaRepo.create({
  //   //     user: userId,
  //   //     dateLocationProfile: locationProfile,
  //   //     order: 0,
  //   //     isUser: true,
  //   //     fileType: selfie.mimetype as FileType,
  //   //     url,
  //   //   });
  //   //   url += `/${newMedia.id}`;
  //   //   newMedia.url = url;
  //   //   locationProfile.media.add(newMedia);
  //   //   media.push({ ...newMedia, file: selfie });
  //   // }

  //   for (const picture of payload) {
  //     const { userId, order, url, isUser, fileType } = picture;
  //     if (locationProfile.id != picture.locationProfileId) {
  //       locationProfile = await this.dateLocationProfileRepo.findOneOrFail({
  //         id: picture.locationProfileId,
  //       });
  //     }
  //     const newMedia = this.mediaRepo.create({
  //       user: userId,
  //       dateLocationProfile: locationProfile,
  //       isUser,
  //       fileType,
  //       url,
  //     });

  //     if (order) {
  //       newMedia.order = order;
  //     }

  //     locationProfile.media.add(newMedia);
  //     media.push(newMedia);
  //   }
  //   await this.em.persistAndFlush(locationProfile);
  //   return media;
  // }

  // base onboard
  async create(authId: string, payload: CreateUserDto): Promise<void> {
    const { relationFileds, data } = this.sortUserDtoFields(payload);
    const user = this.userRepo.create({
      ...data,
      auth: this.authRepo.getReference(authId),
    });

    await this.handleUserRelations(relationFileds, user);
    await this.em.persistAndFlush(user);
    await this.emailQueueService.sendWelcomeEmail({
      to: user.auth.email,
      subject: 'Welcome to Our Service',
    });
    // todo: updat welcome email template
  }

  async update(authId: string, payload: UpdateUserDto): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ auth: authId });
    const { relationFileds, data } = this.sortUserDtoFields(payload);

    await this.handleUserRelations(relationFileds, user);
    this.em.assign(user, { ...data });
    await this.em.flush();
  }
}
