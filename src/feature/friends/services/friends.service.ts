import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { AuthService } from '../../auth/auth.service';
import { User as _User, User } from '../../user/entities/user/user.entity';
import {
  CreateFriendProfileDto,
  UpdateFriendProfileDto,
} from '../dtos/friend-profile.dto';
import { UpdateFriendFilterDto } from '../dtos/friend-filter.dto';
import { FriendProfile } from '../entities/friend.profile';
import { FriendFilter } from '../entities/friend.filter';
import { FocusedIntention } from '../entities/focused-intention.entity';
import { BaseProfileService } from '../../../common/services/base-profile.service';
import { Media } from '../../user/entities/media.entity';
import { CreateLocationProfileDto } from '../../../common/dtos/base-location-profile.dto';
import { UploadPictureResponseObjType } from '../../../common/types/interface';
import { GeoFallbackService } from '../../location/geo-fallback.service';
import { Country } from '../../location/entities/country.entity';
import { Region } from '../../location/entities/region.entity';
import { AuthenticatedUser } from 'src/common/types/request.types';

@Injectable()
export class FriendsService extends BaseProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    @InjectRepository(FriendProfile)
    private readonly friendProfileRepo: EntityRepository<FriendProfile>,
    @InjectRepository(FriendFilter)
    private readonly friendFilterRepo: EntityRepository<FriendFilter>,
    @InjectRepository(FocusedIntention)
    private readonly focusedIntentionRepo: EntityRepository<FocusedIntention>,
    @InjectRepository(Media)
    protected readonly mediaRepo: EntityRepository<Media>,
    protected readonly em: EntityManager,
    authService: AuthService,
    geoFallbackService: GeoFallbackService,
    @InjectRepository(Country) countryRepo: EntityRepository<Country>,
    @InjectRepository(Region) regionRepo: EntityRepository<Region>,
  ) {
    super(
      em,
      authService,
      mediaRepo,
      geoFallbackService,
      countryRepo,
      regionRepo,
    );
  }

  async addProfile(
    authUser: AuthenticatedUser,
    dto: CreateFriendProfileDto,
  ): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ id: authUser.userId });

    const existingProfile = await this.friendProfileRepo.findOne({ user });
    if (existingProfile) {
      throw new BadRequestException(
        'Friend profile already exists for this user',
      );
    }

    const { country, point, location } = await this.handleLocation(dto);

    const friendProfile = this.friendProfileRepo.create({
      user,
      bff: dto.bff || false,
      socialize: dto.socialize || false,
      country,
      point,
      location,
    });

    if (dto.focusedIntentions && dto.focusedIntentions.length > 0) {
      const intentions = await this.focusedIntentionRepo.find({
        id: { $in: dto.focusedIntentions },
      });
      friendProfile.focusedIntentions.set(intentions);
    }

    await this.em.persistAndFlush(friendProfile);
  }

  async updateProfile(
    authUser: AuthenticatedUser,
    dto: UpdateFriendProfileDto,
  ): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ id: authUser.userId });

    const friendProfile = await this.friendProfileRepo.findOneOrFail({ user });

    if (dto.bff !== undefined) friendProfile.bff = dto.bff;
    if (dto.socialize !== undefined) friendProfile.socialize = dto.socialize;

    if (dto.focusedIntentions && dto.focusedIntentions.length > 0) {
      const intentions = await this.focusedIntentionRepo.find({
        id: { $in: dto.focusedIntentions },
      });
      friendProfile.focusedIntentions.set(intentions);
    }

    await this.em.persistAndFlush(friendProfile);
  }

  async updateFilter(
    authUser: AuthenticatedUser,
    dto: UpdateFriendFilterDto,
  ): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ id: authUser.userId });

    const friendProfile = await this.friendProfileRepo.findOneOrFail(
      { user },
      { populate: ['friendFilter'] },
    );

    if (!friendProfile.friendFilter) {
      const friendFilter = this.friendFilterRepo.create({
        friendProfile,
        user: friendProfile.user,
        bff: dto.bff || false,
        socialize: dto.socialize || false,
        focusedIntentions: dto.focusedIntentions || [],
        ...dto,
      });
      await this.em.persist(friendFilter);
      friendProfile.friendFilter = friendFilter;
    } else {
      this.em.assign(friendProfile.friendFilter, {
        bff: dto.bff,
        socialize: dto.socialize,
        focusedIntentions: dto.focusedIntentions,
        ...dto,
      });
    }

    await this.em.flush();
  }

  async findPotentialMatches<T = FriendProfile>(
    authUser: AuthenticatedUser,
  ): Promise<T[]> {
    const user = await this.userRepo.findOneOrFail({ id: authUser.userId });

    const friendProfile = await this.friendProfileRepo.findOneOrFail(
      { user },
      { populate: ['friendFilter', 'focusedIntentions'] },
    );

    if (!friendProfile.friendFilter) {
      throw new BadRequestException(
        'Friend filter not found. Please set up your preferences first.',
      );
    }

    const { hasControl } = this.checkSubscriptions(friendProfile);

    const filters = this.reduceToAllowedFilters(
      friendProfile.friendFilter,
      hasControl,
    );

    const whereConditions: Record<string, any> = {
      id: { $ne: friendProfile.id },
    };

    if (filters.bff !== undefined) {
      whereConditions.bff = filters.bff;
    }

    if (filters.socialize !== undefined) {
      whereConditions.socialize = filters.socialize;
    }

    this.applyDatabaseFilters(whereConditions, filters);

    const friendProfiles = await this.friendProfileRepo.find(whereConditions, {
      populate: ['user', 'friendFilter', 'focusedIntentions'],
      orderBy: { createdAt: 'desc' },
      limit: 50,
    });

    return friendProfiles as T[];
  }

  private checkSubscriptions(friendProfile: FriendProfile) {
    const now = new Date();
    const hasControl = new Date(friendProfile?.controlEndsAt || now) > now;
    const isFree = !hasControl;

    return { hasControl, isFree };
  }

  private reduceToAllowedFilters(
    payload: UpdateFriendFilterDto | FriendFilter,
    hasControl = false,
  ): Omit<UpdateFriendFilterDto, 'locationProfile'> {
    const {
      age,
      gendersInterestedIn,
      education,
      maritalStatus,
      focusedIntentions,
      ...rest
    } = payload;

    const basicFilters = {
      age,
      gendersInterestedIn,
      education,
      maritalStatus,
      focusedIntentions,
    };

    return hasControl ? { ...basicFilters, ...rest } : basicFilters;
  }

  async handleMediaUpdate(
    payload: UploadPictureResponseObjType,
  ): Promise<void> {
    const { profileId } = payload;

    const friendProfile = await this.friendProfileRepo.findOneOrFail(
      { id: profileId },
      { populate: ['media'] },
    );

    await this.updateMediaForProfile(payload, friendProfile, 'friendProfile');
  }

  async updateLocation(
    authId: string,
    payload: Pick<CreateLocationProfileDto, 'location' | 'address'> & {
      pinLocation?: boolean;
    },
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);

    const friendProfile = await this.friendProfileRepo.findOneOrFail(
      { user },
      { populate: ['user'] },
    );

    const {
      country,
      point,
      location: situated,
    } = await this.handleLocation({
      location: payload.location,
      address: payload.address,
    });

    if (payload.pinLocation) {
      friendProfile.usePinLocation = true;
      friendProfile.pinnedPoint = point;
      friendProfile.pinnedLocation = situated;
      friendProfile.pinnedCountry = country;
    } else {
      friendProfile.usePinLocation = false;
      friendProfile.point = point;
      friendProfile.location = situated;
      friendProfile.country = country;
    }

    await this.em.flush();
  }

  private applyDatabaseFilters(
    whereConditions: Record<string, any>,
    filters: Omit<UpdateFriendFilterDto, 'locationProfile'>,
  ): void {
    if (filters.age) {
      const minAge = filters.age.min ?? 18;
      const maxAge = filters.age.max ?? 99;
      whereConditions['user.dob'] = {
        $gte: new Date(
          new Date().setFullYear(new Date().getFullYear() - maxAge),
        ),
        $lte: new Date(
          new Date().setFullYear(new Date().getFullYear() - minAge),
        ),
      };
    }

    if (filters.gendersInterestedIn?.length) {
      whereConditions['user.gender'] = { $in: filters.gendersInterestedIn };
    }

    if (filters.education) {
      whereConditions['user.educationLevel'] = {
        $gte: filters.education.min ?? 1,
        $lte: filters.education.max ?? 5,
      };
    }

    if (filters.maritalStatus?.length) {
      whereConditions['user.maritalStatus'] = { $in: filters.maritalStatus };
    }

    if (filters.focusedIntentions?.length) {
      whereConditions['focusedIntentions.id'] = {
        $in: filters.focusedIntentions,
      };
    }

    if (filters.primaryGuidePhilosophy?.length) {
      whereConditions['user.primaryGuidePhilosophy'] = {
        $in: filters.primaryGuidePhilosophy,
      };
    }

    if (filters.restrictToProfessions?.length) {
      whereConditions['user.profession'] = {
        $in: filters.restrictToProfessions,
      };
    }

    if (filters.excludeProfessions?.length) {
      whereConditions['user.profession'] = { $nin: filters.excludeProfessions };
    }

    if (filters.originCountries?.length) {
      whereConditions['user.originCountry'] = { $in: filters.originCountries };
    }

    if (filters.grewupCountries?.length) {
      whereConditions['user.grewupCountry'] = { $in: filters.grewupCountries };
    }

    if (filters.nationalitiesOf?.length) {
      whereConditions['user.nationality'] = { $in: filters.nationalitiesOf };
    }

    if (filters.basedInCountries?.length) {
      whereConditions['user.basedInCountry'] = {
        $in: filters.basedInCountries,
      };
    }

    if (filters.ethniticities?.length) {
      whereConditions['user.ethnicity'] = { $in: filters.ethniticities };
    }

    if (filters.religions?.length) {
      whereConditions['user.religion'] = { $in: filters.religions };
    }

    if (filters.religionsSects?.length) {
      whereConditions['user.religionSect'] = { $in: filters.religionsSects };
    }

    if (filters.religiousLevel) {
      whereConditions['user.religiousLevel'] = {
        $gte: filters.religiousLevel.min ?? 1,
        $lte: filters.religiousLevel.max ?? 5,
      };
    }

    if (filters.interests?.length) {
      whereConditions['user.interests'] = { $in: filters.interests };
    }

    if (filters.hasChildren) {
      whereConditions['user.hasChildren'] = {
        $gte: filters.hasChildren.min ?? 0,
        $lte: filters.hasChildren.max ?? 5,
      };
    }

    if (filters.smoking) {
      whereConditions['user.smoking'] = {
        $gte: filters.smoking.min ?? 0,
        $lte: filters.smoking.max ?? 7,
      };
    }

    if (filters.drinking) {
      whereConditions['user.drinking'] = {
        $gte: filters.drinking.min ?? 0,
        $lte: filters.drinking.max ?? 7,
      };
    }

    if (filters.drug) {
      whereConditions['user.drug'] = {
        $gte: filters.drug.min ?? 0,
        $lte: filters.drug.max ?? 7,
      };
    }

    if (filters.isFaceVerified) {
      whereConditions['user.isFaceVerified'] = true;
    }

    if (filters.isIdVerified) {
      whereConditions['user.isIdVerified'] = true;
    }

    if (filters.excludeAstroBelievers) {
      whereConditions['user.useAstronology'] = { $ne: true };
    }

    if (filters.useAstronology !== undefined) {
      whereConditions['user.useAstronology'] = filters.useAstronology;
    }
  }
}
