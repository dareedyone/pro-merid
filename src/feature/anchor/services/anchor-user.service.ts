import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { Anchor } from 'src/feature/anchor/entities/anchor.entity';
import { User } from 'src/feature/user/entities/user/user.entity';
import {
  AddUserToAnchorDto,
  RemoveUserFromAnchorDto,
  AnchorUserResponse,
  AnchorUserListResponse,
} from '../dtos/anchor.dto';
import { AnchorMatchingOptionsDto } from '../dtos/anchor-matching.dto';
import { UserPoolMode } from '../types/anchor.types';
import { DatingService } from 'src/feature/dating/dating.service';
import {
  FacilitateMatchDto,
  MatchModerationContextDto,
} from '../dtos/anchor-moderation.dto';
import { Match } from 'src/common/entities/match.entity';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { InteractionService } from 'src/common/services/interaction.service';

@Injectable()
export class AnchorUserService {
  private readonly logger = new Logger(AnchorUserService.name);

  constructor(
    @InjectRepository(Anchor)
    private readonly anchorRepo: EntityRepository<Anchor>,
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly datingService: DatingService,
    @InjectRepository(Match)
    private readonly matchRepo: EntityRepository<Match>,
    private readonly interactionService: InteractionService,
  ) {}

  // todo: consider add and remove for admin
  async addUserToAnchor(
    anchorId: string,
    dto: AddUserToAnchorDto,
  ): Promise<AnchorUserResponse> {
    try {
      const anchor = await this.anchorRepo.findOneOrFail({ id: anchorId });
      const user = await this.userRepo.findOneOrFail({ id: dto.userId });

      if (user.anchor && user.anchor.id !== anchorId) {
        throw new BadRequestException(
          'User is already assigned to another anchor',
        );
      }

      const maxUsers = (anchor.config as Record<string, any>)?.settings
        ?.maxUsers;
      if (maxUsers) {
        const userCount = await this.userRepo.count({
          anchor: { id: anchorId },
        });
        if (userCount >= maxUsers) {
          throw new BadRequestException('Anchor user limit reached');
        }
      }

      user.anchor = anchor;
      await this.em.persistAndFlush(user);

      this.logger.log(`Added user ${dto.userId} to anchor ${anchorId}`);

      return this.mapUserToResponseDto(user);
    } catch (error) {
      this.logger.error(`Error adding user to anchor ${anchorId}:`, error);
      throw error;
    }
  }

  async removeUserFromAnchor(
    anchorId: string,
    dto: RemoveUserFromAnchorDto,
  ): Promise<void> {
    try {
      const user = await this.userRepo.findOneOrFail({
        id: dto.userId,
        anchor: { id: anchorId },
      });

      user.anchor = undefined;

      await this.em.persistAndFlush(user);
    } catch (error) {
      this.logger.error(`Error removing user from anchor ${anchorId}:`, error);
      throw error;
    }
  }
  // ends for admin

  async getAnchorUsers(
    anchorId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<AnchorUserListResponse> {
    try {
      const [users, total] = await this.userRepo.findAndCount(
        { anchor: { id: anchorId } },
        {
          limit,
          offset: (page - 1) * limit,
          orderBy: { createdAt: 'DESC' },
        },
      );

      return {
        users: users.map((user: User) => this.mapUserToResponseDto(user)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Error fetching anchor users ${anchorId}:`, error);
      throw error;
    }
  }

  //   async getUserAnchorContext(
  //     userId: string,
  //   ): Promise<AnchorUserContext | null> {
  //     try {
  //       const user = await this.userRepo.findOne(
  //         { id: userId },
  //         { populate: ['anchor'] },
  //       );

  //       if (!user || !user.anchor) {
  //         return null;
  //       }

  //       const config = user.anchor.config || {};

  //       return {
  //         anchorId: user.anchor.id,
  //         userPoolMode: config.userPoolMode || UserPoolMode.ISOLATED,
  //         canSeeOtherAnchors: config.userPoolMode === UserPoolMode.MIXED,
  //         canMatchWithOtherAnchors:
  //           config.matching?.allowCrossAnchorMatching || false,
  //         moderationLevel: config.moderation?.level || 'none',
  //         features: config.features || {},
  //       };
  //     } catch (error) {
  //       this.logger.error(`Error getting user anchor context ${userId}:`, error);
  //       return null;
  //     }
  //   }

  async getUsersForMatching(
    anchorId: string,
    options: AnchorMatchingOptionsDto = {},
  ): Promise<{ users: User[]; total: number; hasMore: boolean }> {
    try {
      const anchor = await this.anchorRepo.findOneOrFail({ id: anchorId });
      const userPoolMode = anchor.poolMode || UserPoolMode.ISOLATED;

      if (userPoolMode !== UserPoolMode.ISOLATED) {
        throw new BadRequestException(
          'Users can only be matched in isolated mode',
        );
      }

      const qb =
        this.datingService.createUserWithDatingProfileQueryBuilder(anchorId);

      this.datingService.applyDatingBaseProfileFilters(qb, options);

      this.datingService.applyDateProfileFilters(qb, options);

      this.datingService.applyPersonalityFilters(qb, options);

      if (options.excludeUserIds?.length) {
        qb.andWhere('u.id NOT IN (?)', [options.excludeUserIds]);
      }

      const totalQb = qb.clone();
      const total = await totalQb.getCount();

      if (options.limit) {
        qb.limit(options.limit);
      }
      if (options.offset) {
        qb.offset(options.offset);
      }

      qb.orderBy({ 'u.createdAt': 'DESC' });

      const results = await qb.getResult();
      const users = results.map(
        (result: { datingProfile: { user: User } }) =>
          result.datingProfile.user,
      );

      return {
        users,
        total,
        hasMore: options.offset ? total > options.offset + users.length : false,
      };
    } catch (error) {
      this.logger.error(`Error getting users for matching ${anchorId}:`, error);
      throw error;
    }
  }

  async facilitateMatch(
    anchorId: string,
    dto: FacilitateMatchDto,
  ): Promise<Match> {
    try {
      const { sourceUserId, targetUserId } = dto;
      const sourceUser = await this.userRepo.findOne({
        id: sourceUserId,
        anchor: { id: anchorId },
      });
      const targetUser = await this.userRepo.findOne({
        id: targetUserId,
        anchor: { id: anchorId },
      });

      if (!sourceUser || !targetUser) {
        throw new BadRequestException(
          'One or both users do not belong to this anchor',
        );
      }

      const matchId = this.interactionService.generateMatchId(
        sourceUserId,
        targetUserId,
        ProfileType.DATE,
      );

      const match = await this.interactionService.createMatch(
        matchId,
        ProfileType.DATE,
        new Date(),
        sourceUserId,
        targetUserId,
      );

      await this.interactionService.notifyMatchParties({
        sourceUserId: sourceUser.id,
        targetUserId: targetUser.id,
        targetUserName: targetUser.firstName,
        sourceUserName: sourceUser.firstName,
      });

      return match;
    } catch (error) {
      this.logger.error(
        `Error facilitating match for anchor ${anchorId}:`,
        error,
      );
      throw error;
    }
  }

  async getAnchorUserStats(anchorId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
  }> {
    try {
      const totalUsers = await this.userRepo.count({
        anchor: { id: anchorId },
      });
      const activeUsers = await this.userRepo.count({
        anchor: { id: anchorId },
        isActivated: true,
      });

      return {
        totalUsers,
        activeUsers,
      };
    } catch (error) {
      this.logger.error(`Error getting anchor user stats ${anchorId}:`, error);
      throw error;
    }
  }

  private mapUserToResponseDto(user: User): AnchorUserResponse {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.auth.email || '',
      joinedAt: user.createdAt!,
      isActive: user.isActivated || false,
    };
  }
}
// note: counsell or root fro them
// when do that happen: 1) when they unmtach 2) when they explicitly ask e.g when the relationship is ongoing
// for 2: when the relationship is ongoing - this will be a separate paid service and selected based on socio economic characteristics
// for 1: try to resolve conflicts either through AI detection or when they explicitly ask and that's when anchor can rematch after following up with them both - phase 1 - excplicit - phase 2 - + AI
// phase AI critice someone on request based on their behaviour i.e chat history and intercations
