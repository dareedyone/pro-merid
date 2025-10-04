import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Anchor } from 'src/feature/anchor/entities/anchor.entity';
import { User } from 'src/feature/user/entities/user/user.entity';
import { Auth } from 'src/feature/auth/entities/auth.entity';
import {
  AddUserToAnchorDto,
  RemoveUserFromAnchorDto,
  AnchorUserResponseDto,
  AnchorUserListResponseDto,
} from '../dtos/anchor.dto';
import { AnchorUserContext, UserPoolMode } from '../types/anchor.types';
import { AnchorRole } from '../types/anchor.enum';

@Injectable()
export class AnchorUserService {
  private readonly logger = new Logger(AnchorUserService.name);

  constructor(
    @InjectRepository(Anchor)
    private readonly anchorRepo: EntityRepository<Anchor>,
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    @InjectRepository(Auth)
    private readonly authRepo: EntityRepository<Auth>,
    private readonly em: EntityManager,
  ) {}

  async addUserToAnchor(
    anchorId: string,
    dto: AddUserToAnchorDto,
  ): Promise<AnchorUserResponseDto> {
    try {
      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      const user = await this.userRepo.findOne({ id: dto.userId });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user is already assigned to an anchor
      if (user.anchor && user.anchor.id !== anchorId) {
        throw new BadRequestException(
          'User is already assigned to another anchor',
        );
      }

      // Check anchor user limit
      const userCount = await this.userRepo.count({ anchor: { id: anchorId } });
      const maxUsers = anchor.config?.settings?.maxUsers;
      if (maxUsers && userCount >= maxUsers) {
        throw new BadRequestException('Anchor user limit reached');
      }

      // Assign user to anchor
      user.anchor = anchor;
      user.anchorRole = dto.role || AnchorRole.ADMIN;
      user.anchorJoinedAt = new Date();

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
      const user = await this.userRepo.findOne({
        id: dto.userId,
        anchor: { id: anchorId },
      });

      if (!user) {
        throw new NotFoundException('User not found in this anchor');
      }

      // Remove user from anchor
      user.anchor = null;
      user.anchorRole = null;
      user.anchorJoinedAt = null;

      await this.em.persistAndFlush(user);

      this.logger.log(`Removed user ${dto.userId} from anchor ${anchorId}`);
    } catch (error) {
      this.logger.error(`Error removing user from anchor ${anchorId}:`, error);
      throw error;
    }
  }

  async getAnchorUsers(
    anchorId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<AnchorUserListResponseDto> {
    try {
      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      const [users, total] = await this.userRepo.findAndCount(
        { anchor: { id: anchorId } },
        {
          limit,
          offset: (page - 1) * limit,
          orderBy: { anchorJoinedAt: 'DESC' },
        },
      );

      return {
        users: users.map((user: any) => this.mapUserToResponseDto(user)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Error fetching anchor users ${anchorId}:`, error);
      throw error;
    }
  }

  async getUserAnchorContext(
    userId: string,
  ): Promise<AnchorUserContext | null> {
    try {
      const user = await this.userRepo.findOne(
        { id: userId },
        { populate: ['anchor'] },
      );

      if (!user || !user.anchor) {
        return null;
      }

      const config = user.anchor.config || {};

      return {
        anchorId: user.anchor.id,
        userPoolMode: config.userPoolMode || UserPoolMode.ISOLATED,
        canSeeOtherAnchors: config.userPoolMode === UserPoolMode.MIXED,
        canMatchWithOtherAnchors:
          config.matching?.allowCrossAnchorMatching || false,
        moderationLevel: config.moderation?.level || 'none',
        features: config.features || {},
      };
    } catch (error) {
      this.logger.error(`Error getting user anchor context ${userId}:`, error);
      return null;
    }
  }

  async getUsersForMatching(
    anchorId: string,
    excludeUserId?: string,
  ): Promise<User[]> {
    try {
      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      const config = anchor.config || {};
      const userPoolMode = config.userPoolMode || UserPoolMode.ISOLATED;

      let whereCondition: any = {};

      if (userPoolMode === UserPoolMode.ISOLATED) {
        // Only users from the same anchor
        whereCondition.anchor = { id: anchorId };
      } else if (userPoolMode === UserPoolMode.MIXED) {
        // All users (no anchor restriction)
        whereCondition = {};
      } else if (userPoolMode === UserPoolMode.HYBRID) {
        // Custom logic based on config
        whereCondition = this.buildHybridUserCondition(anchorId, config);
      }

      if (excludeUserId) {
        whereCondition.id = { $ne: excludeUserId };
      }

      return await this.userRepo.find(whereCondition, {
        populate: ['anchor'],
        orderBy: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error getting users for matching ${anchorId}:`, error);
      throw error;
    }
  }

  async validateUserAccess(
    userId: string,
    anchorId: string,
    requiredRole?: AnchorRole,
  ): Promise<boolean> {
    try {
      const user = await this.userRepo.findOne({
        id: userId,
        anchor: { id: anchorId },
      });

      if (!user) {
        return false;
      }

      if (requiredRole && user.anchorRole !== requiredRole) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error validating user access ${userId} for anchor ${anchorId}:`,
        error,
      );
      return false;
    }
  }

  async getAnchorUserStats(anchorId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
    recentJoins: number;
  }> {
    try {
      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      const totalUsers = await this.userRepo.count({
        anchor: { id: anchorId },
      });
      const activeUsers = await this.userRepo.count({
        anchor: { id: anchorId },
        isActive: true,
      });

      // Get users by role
      const usersByRole = await this.userRepo.find(
        { anchor: { id: anchorId } },
        { fields: ['anchorRole'] },
      );

      const roleCounts = usersByRole.reduce(
        (acc: any, user: any) => {
          const role = user.anchorRole || 'none';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Recent joins (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentJoins = await this.userRepo.count({
        anchor: { id: anchorId },
        anchorJoinedAt: { $gte: thirtyDaysAgo },
      });

      return {
        totalUsers,
        activeUsers,
        usersByRole: roleCounts,
        recentJoins,
      };
    } catch (error) {
      this.logger.error(`Error getting anchor user stats ${anchorId}:`, error);
      throw error;
    }
  }

  private buildHybridUserCondition(anchorId: string, config: any): any {
    // Custom logic for hybrid mode based on config
    // This can be extended based on specific requirements
    const allowCrossAnchor = config.matching?.allowCrossAnchorMatching || false;

    if (allowCrossAnchor) {
      return {}; // All users
    } else {
      return { anchor: { id: anchorId } }; // Only same anchor
    }
  }

  private mapUserToResponseDto(user: any): AnchorUserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email || '',
      role: user.anchorRole || AnchorRole.ADMIN,
      joinedAt: user.anchorJoinedAt || user.createdAt,
      isActive: user.isActive || false,
    };
  }
}
