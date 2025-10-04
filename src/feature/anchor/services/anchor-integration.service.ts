import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { User } from 'src/feature/user/entities/user/user.entity';
import { Anchor } from 'src/feature/anchor/entities/anchor.entity';
import { AnchorUserContext, UserPoolMode } from '../types/anchor.types';
import { EntityRepository } from '@mikro-orm/postgresql';

@Injectable()
export class AnchorIntegrationService {
  private readonly logger = new Logger(AnchorIntegrationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    @InjectRepository(Anchor)
    private readonly anchorRepo: EntityRepository<Anchor>,
    private readonly em: EntityManager,
  ) {}

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

  async getUsersForMatching(userId: string): Promise<User[]> {
    try {
      const user = await this.userRepo.findOne(
        { id: userId },
        { populate: ['anchor'] },
      );

      if (!user) {
        return [];
      }

      const context = await this.getUserAnchorContext(userId);
      if (!context) {
        // User has no anchor, return all users (default behavior)
        return await this.userRepo.find({}, { populate: ['anchor'] });
      }

      let whereCondition: any = {};

      if (context.userPoolMode === UserPoolMode.ISOLATED) {
        // Only users from the same anchor
        whereCondition.anchor = { id: context.anchorId };
      } else if (context.userPoolMode === UserPoolMode.MIXED) {
        // All users (no anchor restriction)
        whereCondition = {};
      } else if (context.userPoolMode === UserPoolMode.HYBRID) {
        // Custom logic based on config
        whereCondition = this.buildHybridUserCondition(context);
      }

      // Exclude the requesting user
      whereCondition.id = { $ne: userId };

      return await this.userRepo.find(whereCondition, {
        populate: ['anchor'],
        orderBy: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error getting users for matching ${userId}:`, error);
      return [];
    }
  }

  async shouldAllowMatching(
    sourceUserId: string,
    targetUserId: string,
  ): Promise<boolean> {
    try {
      const sourceContext = await this.getUserAnchorContext(sourceUserId);
      const targetContext = await this.getUserAnchorContext(targetUserId);

      // If neither user has an anchor, allow matching
      if (!sourceContext && !targetContext) {
        return true;
      }

      // If only one user has an anchor, check if cross-anchor matching is allowed
      if (sourceContext && !targetContext) {
        return sourceContext.canMatchWithOtherAnchors;
      }

      if (!sourceContext && targetContext) {
        return targetContext.canMatchWithOtherAnchors;
      }

      // Both users have anchors
      if (sourceContext!.anchorId === targetContext!.anchorId) {
        // Same anchor, always allow
        return true;
      }

      // Different anchors, check if cross-anchor matching is allowed
      return (
        sourceContext!.canMatchWithOtherAnchors &&
        targetContext!.canMatchWithOtherAnchors
      );
    } catch (error) {
      this.logger.error(
        `Error checking matching permission ${sourceUserId} -> ${targetUserId}:`,
        error,
      );
      return false;
    }
  }

  async getAnchorBranding(anchorId: string): Promise<any> {
    try {
      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        return null;
      }

      return anchor.config?.branding || {};
    } catch (error) {
      this.logger.error(`Error getting anchor branding ${anchorId}:`, error);
      return null;
    }
  }

  async isUserInAnchor(userId: string, anchorId: string): Promise<boolean> {
    try {
      const user = await this.userRepo.findOne({
        id: userId,
        anchor: { id: anchorId },
      });

      return !!user;
    } catch (error) {
      this.logger.error(
        `Error checking if user ${userId} is in anchor ${anchorId}:`,
        error,
      );
      return false;
    }
  }

  async getAnchorUserCount(anchorId: string): Promise<number> {
    try {
      return await this.userRepo.count({ anchor: { id: anchorId } });
    } catch (error) {
      this.logger.error(`Error getting anchor user count ${anchorId}:`, error);
      return 0;
    }
  }

  async getAnchorModerationLevel(anchorId: string): Promise<string> {
    try {
      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        return 'none';
      }

      return anchor.config?.moderation?.level || 'none';
    } catch (error) {
      this.logger.error(
        `Error getting anchor moderation level ${anchorId}:`,
        error,
      );
      return 'none';
    }
  }

  private buildHybridUserCondition(context: AnchorUserContext): any {
    // Custom logic for hybrid mode based on context
    // This can be extended based on specific requirements
    if (context.canMatchWithOtherAnchors) {
      return {}; // All users
    } else {
      return { anchor: { id: context.anchorId } }; // Only same anchor
    }
  }
}
