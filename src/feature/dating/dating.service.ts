import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { v4 as uuidv4 } from 'uuid';
import { DatingLocationProfile } from './entities/dating-location.profile';
import { DatingProfile } from './entities/dating.profile';
import {
  CreateDatingProfileDto,
  UpdateDatingProfileDto,
} from './dto/dating-profile.dto';
import { UserService } from '../user/user.service';
import {
  CreateDatingPersonalityDto,
  UpdateDatingPersonalityDto,
} from './dto/dating-personality.dto';
import { DatingPersonality } from './entities/dating.personality.entity';
import { DatingRelationship } from './entities/dating-relationship.entity';
import {
  CreateDatingRelationshipDto,
  UpdateDatingRelationshipDto,
} from './dto/dating-relationship.dto';
import { LocationType } from 'src/common/types/enums/user.enum';
import {
  CreateLocationProfileMediaDto,
  RemoveMediaDto,
  UpdateMediaDto,
} from 'src/common/dtos/location-media.dto';
import { MediaQueueService } from 'src/system/queue/media/media.qservice';
import { UploadPictureResponseObjType } from 'src/common/types/interface';
import { GeoFallbackService } from '../location/geo-fallback.service';
import { Country } from '../location/entities/country.entity';
import { Region } from '../location/entities/region.entity';
import { UnknownCountry } from 'src/common/seeders/osm/country-meta';
import { AuthService } from '../auth/auth.service';
import { Media } from '../user/entities/media.entity';
import { ConfigService } from '@nestjs/config';
import { MAX_PROFILE_PICTURE } from 'src/common/contant';
import {
  CreateLocationProfileDto,
  UpdateProfileLocationDto,
} from 'src/common/dtos/base-location-profile.dto';
import { OrmHelperService } from 'src/common/services/orm-helper.service';
import { JobContextService } from 'src/system/queue/job-context.service';
import {
  MediaCategory,
  MediaJobContext,
  MediaJobType,
} from 'src/system/queue/media/media.type';
import { basename } from 'path';
import { Readable } from 'stream';
import { downloadUrlAsMulterFile } from 'src/common/utils/file.util';
import { UpdateDateFilterDto } from './dto/dating-filter.dto';
import { DatingFilter } from './entities/dating.filter';
import { RangeEmbDto } from 'src/common/dtos/range-emb-.dto';
import { RangeEmb } from 'src/common/entities/range.emb';

@Injectable()
export class DatingService {
  constructor(
    private readonly mediaQueueService: MediaQueueService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly geoFallbackService: GeoFallbackService,
    private readonly em: EntityManager,
    private readonly ormHelper: OrmHelperService,
    private readonly jobContextService: JobContextService,
    @InjectRepository(DatingLocationProfile)
    private datingLocationProfileRepo: EntityRepository<DatingLocationProfile>,
    @InjectRepository(DatingProfile)
    private datingProfileRepo: EntityRepository<DatingProfile>,
    @InjectRepository(DatingPersonality)
    private personalityRepo: EntityRepository<DatingPersonality>,
    @InjectRepository(DatingRelationship)
    private datingRelationshipRepo: EntityRepository<DatingRelationship>,
    @InjectRepository(DatingFilter)
    private datingFilterRepo: EntityRepository<DatingFilter>,
    @InjectRepository(Country) private countryRepo: EntityRepository<Country>,
    @InjectRepository(Region) private regionRepo: EntityRepository<Region>,
    @InjectRepository(Media) private mediaRepo: EntityRepository<Media>,
  ) {}

  private async handleLocation(
    payload: Pick<CreateLocationProfileDto, 'location' | 'address'>,
  ) {
    const { coords } = payload.location;
    let { country: countryName, isoCountryCode } = payload.address;

    const { city, district, subregion, region } = payload.address;

    let situated;

    if (!isoCountryCode && !countryName) {
      const location = await this.geoFallbackService.reverseGeocode(coords);
      countryName = location.country;
      isoCountryCode = location.countryCode;
      situated =
        city ??
        location.city ??
        district ??
        location.district ??
        subregion ??
        region ??
        location.region;
    }

    const point = {
      type: 'Point',
      coordinates: [coords.longitude, coords.latitude], // Note: [lng, lat] order!
    };

    let country = await this.countryRepo.findOne({
      $or: [{ isoCode: isoCountryCode }, { name: countryName }],
    });

    if (!country) {
      const region = (await this.regionRepo.findOne({
        name: UnknownCountry.region,
      })) as Region;

      country = this.countryRepo.create({
        ...UnknownCountry,
        name: `lt:${coords.longitude}|lg${coords.latitude}`,
        region,
      });
      // could log or check manually
    }

    return {
      country,
      point,
      location: situated,
      isoCountryCode,
    };
  }

  async addProfile(
    authId: string,
    payload: CreateDatingProfileDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);
    const datingProfile = this.datingProfileRepo.create({
      ...payload,
      user,
    });
    await this.em.persistAndFlush(datingProfile);
  }

  async updateProfile(
    authId: string,
    payload: UpdateDatingProfileDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);
    const datingProfile = await this.datingProfileRepo.findOneOrFail({
      user,
    });

    this.em.assign(datingProfile, payload);
    await this.em.persistAndFlush(datingProfile);
  }

  async addPersonality(
    authId: string,
    payload: CreateDatingPersonalityDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);
    const datingProfile = await this.datingProfileRepo.findOneOrFail({
      user,
    });

    if (datingProfile?.personality) {
      throw new BadRequestException(
        'Personality already exists for this user.',
      );
    }

    const datingPersonality = this.personalityRepo.create({
      ...payload,
      datingProfile,
    });

    await this.em.persist(datingPersonality);
    datingProfile.personality = datingPersonality;
    await this.em.flush();
  }

  async updatePersonality(
    authId: string,
    payload: UpdateDatingPersonalityDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);

    const datingProfile = await this.datingProfileRepo.findOneOrFail(
      {
        user,
      },
      { populate: ['personality'] },
    );

    if (!datingProfile?.personality) {
      throw new BadRequestException(
        'Personality does not exist for this user.',
      );
    }

    this.em.assign(datingProfile.personality, payload);
    await this.em.persistAndFlush(datingProfile.personality);
  }

  async addRelationship(
    authId: string,
    payload: CreateDatingRelationshipDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);
    const datingProfile = await this.datingProfileRepo.findOneOrFail({
      user,
    });

    if (datingProfile?.relationship) {
      throw new BadRequestException(
        'Relationship already exists for this user.',
      );
    }

    const datingRelationship = this.datingRelationshipRepo.create({
      ...payload,
      datingProfile,
    });

    await this.em.persist(datingRelationship);
    datingProfile.relationship = datingRelationship;
    await this.em.flush();
  }

  async updateRelationship(
    authId: string,
    payload: UpdateDatingRelationshipDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);

    const datingProfile = await this.datingProfileRepo.findOneOrFail(
      {
        user,
      },
      { populate: ['relationship'] },
    );

    if (!datingProfile?.relationship) {
      throw new BadRequestException(
        'Relationship does not exist for this user.',
      );
    }

    this.em.assign(datingProfile.relationship, payload);
    await this.em.persistAndFlush(datingProfile.relationship);
  }

  // update user location: pinned ? with country ?
  async addLocationProfile(
    authId: string,
    payload: CreateLocationProfileDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);

    const datingProfile = await this.datingProfileRepo.findOneOrFail(
      {
        user,
      },
      { populate: ['locationProfiles'] },
    );

    if (payload.type === LocationType.BASED) {
      const isTypeExist = datingProfile.locationProfiles?.find(
        (lp) => lp.type === LocationType.BASED,
      );
      if (isTypeExist) {
        throw new BadRequestException(
          'Based location profile already exists for this user.',
        );
      }
    }

    const { country, point, location } = await this.handleLocation(payload);

    const dateLocationProfile = this.datingLocationProfileRepo.create({
      user,
      country,
      datingProfile,
      point,
      location,
      type: payload.type,
    });

    await this.em.persistAndFlush(dateLocationProfile);
  }

  async updateProfileLocation(
    authId: string,
    payload: UpdateProfileLocationDto,
  ) {
    const { address, location, pinLocation, locationProfileId } = payload;
    const { user } = await this.authService.fetchAuthUser(authId);

    const datingProfile = await this.datingProfileRepo.findOneOrFail(
      {
        user,
      },
      { populate: ['locationProfiles'] },
    );
    const locationProfile = datingProfile.locationProfiles.find(
      (lp) => lp.id === locationProfileId,
    );

    if (!locationProfile) {
      throw new BadRequestException(
        'Location profile does not exist for this user.',
      );
    }

    const {
      country,
      point,
      location: situated,
      isoCountryCode: locationIsoCountryCode,
    } = await this.handleLocation({ location, address });

    if (
      locationProfile.type !== LocationType.BASED &&
      locationProfile.country?.isoCode !== locationIsoCountryCode?.toUpperCase()
    ) {
      throw new BadRequestException(
        'Cannot change country for this location profile type.',
      );
    }

    // todo: do client check for all to be sure user is not trying change/pin location to country they are not in.

    if (pinLocation) {
      locationProfile.usePinLocation = true;
      locationProfile.pinnedPoint = point;
      locationProfile.pinnedLocation = situated;
      locationProfile.pinnedCountry = country;
    } else {
      locationProfile.usePinLocation = false;
      locationProfile.point = point;
      locationProfile.location = situated;
      locationProfile.country = country;
    }

    await this.em.flush();
  }

  async addLocationProfileMedia(
    authId: string,
    payload: CreateLocationProfileMediaDto,
  ): Promise<void> {
    const { user, pushToken } = await this.authService.fetchAuthUser(authId);

    const jobId = uuidv4();

    const mediaLimit = (this.configService.get(MAX_PROFILE_PICTURE) || 5) + 1;

    const datingProfile = await this.datingProfileRepo.findOneOrFail({
      user,
    });

    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail({
      id: payload.locationProfileId,
      datingProfile,
    });

    if (locationProfile.media.length >= mediaLimit) {
      throw new BadRequestException(
        `You can only add up to ${mediaLimit - 1} pictures for a location profile.`,
      );
    }

    let jobType = MediaJobType.VERIFY_PICTURES;

    const context: MediaJobContext = {
      category: MediaCategory.DATING,
      userId: user.id,
      profileId: datingProfile.id,
      locationProfileId: locationProfile.id,
      selfie: payload.selfie,
      profilePictures: payload.profilePictures,
      pushToken,
      nextStep: 0,
      queueFlow: [MediaJobType.VERIFY_PICTURES, MediaJobType.UPLOAD_MEDIA],
    };

    if (!user.isFaceVerified) {
      if (!payload.selfie) {
        throw new BadRequestException(`Selfie is required for verification.`);
      }

      jobType = MediaJobType.VERIFY_SELFIE;
      context.isNewSelfie = true;
      context.queueFlow.unshift(MediaJobType.VERIFY_SELFIE);
    } else {
      const selfie = await this.mediaRepo.findOne({
        user,
        datingLocationProfile: locationProfile,
        order: 0,
      });

      if (!selfie || !selfie.url) {
        throw new BadRequestException(
          'Selfie is required for verification. Please upload a selfie first.',
        );
      }

      context.selfie = await downloadUrlAsMulterFile(selfie.url);
    }

    await this.jobContextService.set<MediaJobContext>('media', jobId, context);
    await this.mediaQueueService.enqueueJob(jobType, { jobId });

    // if succesful, I have decidecide to use push notification, but verification entity is still needed for id verifications
  }

  async handleMediaUpdate(
    payload: UploadPictureResponseObjType,
  ): Promise<void> {
    const { pictures, userId, locationProfileId } = payload;
    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail(
      {
        id: locationProfileId,
      },
      { populate: ['media'] },
    );

    for (const media of pictures) {
      const existingMedia = locationProfile.media
        .getItems()
        .find((m) => m.order === media.order);

      if (existingMedia) {
        existingMedia.url = media.url;
        existingMedia.fileType = media.fileType;
        existingMedia.isUser = media.isUser;
        existingMedia.order = media.order;
      } else {
        const newMedia = this.mediaRepo.create({
          user: userId,
          datingLocationProfile: locationProfile,
          url: media.url,
          fileType: media.fileType,
          isUser: media.isUser,
          order: media.order,
        });

        this.em.persist(newMedia);
        locationProfile.media.add(newMedia);
      }
    }

    await this.em.flush();
  }

  async updateLocationProfileMedia(
    authId: string,
    payload: UpdateMediaDto,
  ): Promise<void> {
    const auth = await this.authService.fetchAuthUser(authId);
    const { user } = auth;
    const { mediaId, file, reOrder, locationProfileId } = payload;
    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail(
      {
        id: locationProfileId,
        user,
      },
      { populate: ['media'] },
    );

    const media = locationProfile.media
      .getItems()
      .find((m) => m.id === mediaId);

    if (!media) {
      throw new BadRequestException('Media not found for this user.');
    }

    if (reOrder && reOrder !== media.order) {
      const otherMedia = await this.mediaRepo.findOne({
        user,
        order: reOrder,
        datingLocationProfile: locationProfile,
      });

      if (otherMedia) {
        otherMedia.order = media.order;
      }
      media.order = reOrder;

      await this.em.flush();
    }

    if (file) {
      const selfie = await this.mediaRepo.findOne({ user, order: 0 });

      if (!selfie)
        throw new UnauthorizedException('Selfie verification is required');

      const context: MediaJobContext = {
        category: MediaCategory.DATING,
        userId: user.id,
        profileId: locationProfile.datingProfile.id,
        locationProfileId: locationProfile.id,
        selfie: await downloadUrlAsMulterFile(selfie.url),
        profilePictures: [{ file, order: reOrder }],
        pushToken: auth.pushToken,
        nextStep: 0,
        queueFlow: [MediaJobType.VERIFY_PICTURES, MediaJobType.UPLOAD_MEDIA],
      };
      const jobId = uuidv4();
      await this.jobContextService.set<MediaJobContext>(
        'media',
        jobId,
        context,
      );
      await this.mediaQueueService.enqueueJob(MediaJobType.VERIFY_PICTURES, {
        jobId,
      });
    }
  }

  async removeLocationProfileMedia(
    authId: string,
    payload: RemoveMediaDto,
  ): Promise<void> {
    const auth = await this.authService.fetchAuthUser(authId);
    const { user } = auth;
    const { mediaId, locationProfileId } = payload;

    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail(
      {
        id: locationProfileId,
        user,
      },
      { populate: ['media'] },
    );

    const media = locationProfile.media
      .getItems()
      .find((m) => m.id === mediaId);

    if (!media) {
      throw new BadRequestException('Media not found for this user.');
    }

    if (media.order === 0 || locationProfile.media.length <= 2) {
      throw new BadRequestException(
        'Cannot delete or reduce picture below minimum. Please upload a new one first.',
      );
    }

    locationProfile.media.remove(media);
    await this.em.removeAndFlush(media);
  }

  _mapRangeEmbDto(dto?: RangeEmbDto): RangeEmb | undefined {
    if (!dto) return undefined;
    return new RangeEmb(dto.min, dto.max);
  }

  private reduceToAllowedFilters(
    payload: UpdateDateFilterDto,
    isPremium = false,
  ): Omit<UpdateDateFilterDto, 'locationProfileId'> {
    const {
      locationProfileId: _,
      age,
      religions,
      intentions,
      maxDistanceMile,
      ...rest
    } = payload;

    const basicFilters = { age, religions, intentions, maxDistanceMile };

    return isPremium ? { ...basicFilters, ...rest } : basicFilters;
  }

  async updateLocationFilter(
    authId: string,
    payload: UpdateDateFilterDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);
    const { locationProfileId } = payload;
    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail(
      {
        id: locationProfileId,
        user,
      },
      { populate: ['datingFilter', 'datingProfile'] },
    );

    const now = new Date();

    const hasControl =
      new Date(locationProfile.datingProfile?.controlEndsAt || now) > now;

    const hasTrueFynd =
      new Date(locationProfile.datingProfile?.trueFyndEndsAt || now) > now;

    const hasPremium = hasControl || hasTrueFynd;

    //todo:  use this again for matching: either reset when subscription expires or use only allowed fields for matching
    const allowedFilters = this.reduceToAllowedFilters(payload, hasPremium);

    if (!locationProfile.datingFilter) {
      const datingFilter = this.datingFilterRepo.create({
        user,
        locationProfile,
        ...allowedFilters,
      });
      await this.em.persist(datingFilter);
      locationProfile.datingFilter = datingFilter;
    } else {
      this.em.assign(locationProfile.datingFilter, allowedFilters);
    }
    await this.em.flush();
  }

  // async getDatingMatches(
  //   authId: string,

  // next: handle filter .
  // match
  // sub
  // messages
  // anchor
  // events
  // friends
}
