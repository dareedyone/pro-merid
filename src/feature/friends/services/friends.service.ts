import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { AuthService } from '../../auth/auth.service';
import { User as _User } from '../../user/entities/user/user.entity';
import {
  CreateFriendProfileDto,
  UpdateFriendProfileDto,
} from '../dtos/friend-profile.dto';
import { UpdateFriendFilterDto } from '../dtos/friend-filter.dto';
import { FriendProfile } from '../entities/friend.profile';
import { FriendFilter } from '../entities/friend.filter';
import { FocusedIntention } from '../entities/focused-intention.entity';
import { BaseProfileService } from '../../../common/controllers/base-profile.controller';

@Injectable()
export class FriendsService implements BaseProfileService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    @InjectRepository(FriendProfile)
    private readonly friendProfileRepo: EntityRepository<FriendProfile>,
    @InjectRepository(FriendFilter)
    private readonly friendFilterRepo: EntityRepository<FriendFilter>,
    @InjectRepository(FocusedIntention)
    private readonly focusedIntentionRepo: EntityRepository<FocusedIntention>,
    private readonly em: EntityManager,
    private readonly authService: AuthService,
  ) {}

  async addProfile(authId: string, dto: CreateFriendProfileDto): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);

    const existingProfile = await this.friendProfileRepo.findOne({ user });
    if (existingProfile) {
      throw new BadRequestException(
        'Friend profile already exists for this user',
      );
    }

    const friendProfile = this.friendProfileRepo.create({
      user,
      bff: dto.bff || false,
      socialize: dto.socialize || false,
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
    authId: string,
    dto: UpdateFriendProfileDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);

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
    authId: string,
    dto: UpdateFriendFilterDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);

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

  async findPotentialMatches(authId: string): Promise<FriendProfile[]> {
    const { user } = await this.authService.fetchAuthUser(authId);

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

    // Apply database-level filters (reducedToAllowedFilters already handles subscription logic)
    this.applyDatabaseFilters(whereConditions, filters);

    const friendProfiles = await this.friendProfileRepo.find(whereConditions, {
      populate: ['user', 'friendFilter', 'focusedIntentions'],
      limit: hasControl ? 200 : 50, // Premium users get more results
    });

    // Sort by creation date (newest first) and limit to 50
    friendProfiles.sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0),
    );

    return friendProfiles.slice(0, 50);
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

  /**
   * Apply database-level filters
   * The filters parameter already contains only the allowed filters based on subscription level
   */
  private applyDatabaseFilters(
    whereConditions: Record<string, any>,
    filters: Omit<UpdateFriendFilterDto, 'locationProfile'>,
  ): void {
    // Apply all available filters at database level for better performance
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
  }
}
