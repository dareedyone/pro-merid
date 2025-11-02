import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Anchor } from 'src/feature/anchor/entities/anchor.entity';
import { User } from 'src/feature/user/entities/user/user.entity';
import { Auth } from 'src/feature/auth/entities/auth.entity';
import {
  CreateAnchorDto,
  UpdateAnchorDto,
  AnchorResponseDto,
  AnchorListResponseDto,
  AnchorConfigDto,
} from '../dtos/anchor.dto';
import { AnchorConfig } from '../types/anchor.types';
import { AnchorStatus, UserPoolMode } from '../types/anchor.enum';

@Injectable()
export class AnchorService {
  private readonly logger = new Logger(AnchorService.name);

  constructor(
    @InjectRepository(Anchor)
    private readonly anchorRepo: EntityRepository<Anchor>,
    private readonly em: EntityManager,
  ) {}

  async getAnchorById(id: string): Promise<AnchorResponseDto> {
    try {
      const anchor = await this.anchorRepo.findOneOrFail(
        { id },
        { populate: ['authAccounts'] },
      );

      return this.mapToResponseDto(anchor);
    } catch (error) {
      this.logger.error(`Error fetching anchor ${id}:`, error);
      throw error;
    }
  }

  async updateAnchor(
    id: string,
    dto: UpdateAnchorDto,
  ): Promise<AnchorResponseDto> {
    try {
      const anchor = await this.anchorRepo.findOneOrFail({ id });

      if (dto.name) anchor.name = dto.name;
      if (dto.subdomain) {
        const existingAnchor = await this.anchorRepo.findOne({
          subdomain: dto.subdomain,
          id: { $ne: id },
        });
        if (existingAnchor) {
          throw new ConflictException('Subdomain already exists');
        }
        anchor.subdomain = dto.subdomain;
      }
      if (dto.config) {
        anchor.config = this.mergeConfig(
          anchor.config as AnchorConfig,
          this.convertDtoToConfig(dto.config),
        );
      }
      //   if (dto.status) anchor.status = dto.status;

      await this.em.persistAndFlush(anchor);

      return this.mapToResponseDto(anchor);
    } catch (error) {
      this.logger.error(`Error updating anchor ${id}:`, error);
      throw error;
    }
  }
  // todo: use for admin

  async createAnchor(dto: CreateAnchorDto): Promise<AnchorResponseDto> {
    try {
      if (dto.subdomain) {
        const existingAnchor = await this.anchorRepo.findOne({
          subdomain: dto.subdomain,
        });
        if (existingAnchor) {
          throw new ConflictException('Subdomain already exists');
        }
      }

      const anchor = this.anchorRepo.create({
        name: dto.name,
        subdomain: dto.subdomain,
        poolMode: dto.config.userPoolMode || UserPoolMode.ISOLATED,
        config: this.convertDtoToConfig(dto.config) as any,
        status: AnchorStatus.ACTIVE,
      });

      await this.em.persistAndFlush(anchor);

      this.logger.log(`Created anchor: ${anchor.id} - ${anchor.name}`);

      return this.mapToResponseDto(anchor);
    } catch (error) {
      this.logger.error('Error creating anchor:', error);
      throw error;
    }
  }

  async deleteAnchor(id: string): Promise<void> {
    try {
      const anchor = await this.anchorRepo.findOne({ id });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      // Check if anchor has users
      //   const userCount = await this.userRepo.count({ anchor: { id } });
      //   if (userCount > 0) {
      //     throw new BadRequestException(
      //       'Cannot delete anchor with existing users',
      //     );
      //   }

      await this.em.removeAndFlush(anchor);

      this.logger.log(`Deleted anchor: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting anchor ${id}:`, error);
      throw error;
    }
  }

  async getAnchors(
    page: number = 1,
    limit: number = 10,
  ): Promise<AnchorListResponseDto> {
    try {
      const [anchors, total] = await this.anchorRepo.findAndCount(
        {},
        {
          populate: ['authAccounts'],
          limit,
          offset: (page - 1) * limit,
          orderBy: { createdAt: 'DESC' },
        },
      );

      return {
        anchors: anchors.map((anchor) => this.mapToResponseDto(anchor)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Error fetching anchors:', error);
      throw error;
    }
  }

  // end for admin

  private async getAnchorConfig(id: string): Promise<AnchorConfig> {
    try {
      const anchor = await this.anchorRepo.findOne({ id });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      return (anchor.config as AnchorConfig) || this.getDefaultConfig();
    } catch (error) {
      this.logger.error(`Error fetching anchor config ${id}:`, error);
      throw error;
    }
  }

  async updateAnchorConfig(
    id: string,
    config: Partial<AnchorConfig>,
  ): Promise<AnchorConfig> {
    try {
      const anchor = await this.anchorRepo.findOne({ id });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      const currentConfig =
        (anchor.config as AnchorConfig) || this.getDefaultConfig();
      const updatedConfig = this.mergeConfig(currentConfig, config);

      anchor.config = updatedConfig;
      await this.em.persistAndFlush(anchor);

      this.logger.log(`Updated anchor config: ${id}`);

      return updatedConfig;
    } catch (error) {
      this.logger.error(`Error updating anchor config ${id}:`, error);
      throw error;
    }
  }

  //   async getUserPoolMode(anchorId: string): Promise<UserPoolMode> {
  //     try {
  //       const config = await this.getAnchorConfig(anchorId);
  //       return config.userPoolMode;
  //     } catch (error) {
  //       this.logger.error(
  //         `Error getting user pool mode for anchor ${anchorId}:`,
  //         error,
  //       );
  //       return UserPoolMode.ISOLATED; // Default fallback
  //     }
  //   }

  private convertDtoToConfig(dtoConfig: AnchorConfigDto): AnchorConfig {
    return {
      branding: {
        logo: dtoConfig.branding.logo,
        primaryColor: dtoConfig.branding.primaryColor,
        secondaryColor: dtoConfig.branding.secondaryColor,
        theme: dtoConfig.branding.theme,
        customCss: dtoConfig.branding.customCss,
        favicon: dtoConfig.branding.favicon,
        appName: dtoConfig.branding.appName,
      },
      features: {
        allowMatching: dtoConfig.features.allowMatching,
        allowChatModeration: dtoConfig.features.allowChatModeration,
        allowUserManagement: dtoConfig.features.allowUserManagement,
        allowCustomOnboarding: dtoConfig.features.allowCustomOnboarding,
        allowBulkOperations: dtoConfig.features.allowBulkOperations,
        allowAnalytics: dtoConfig.features.allowAnalytics,
        allowExport: dtoConfig.features.allowExport,
      },
      matching: {
        algorithm: dtoConfig.matching.algorithm,
        customFilters: dtoConfig.matching.customFilters,
        maxDistance: dtoConfig.matching.maxDistance,
        ageRange: dtoConfig.matching.ageRange,
        allowCrossAnchorMatching: dtoConfig.matching.allowCrossAnchorMatching,
      },
      moderation: {
        level: dtoConfig.moderation.level,
        requireApproval: dtoConfig.moderation.requireApproval,
        allowCounselorAccess: dtoConfig.moderation.allowCounselorAccess,
        chatMonitoring: dtoConfig.moderation.chatMonitoring,
        autoModeration: dtoConfig.moderation.autoModeration,
        reportThreshold: dtoConfig.moderation.reportThreshold,
        allowedCounselorRoles: dtoConfig.moderation.allowedCounselorRoles,
      },
      settings: {
        maxUsers: dtoConfig.settings.maxUsers,
        allowSelfRegistration: dtoConfig.settings.allowSelfRegistration,
        requireEmailVerification: dtoConfig.settings.requireEmailVerification,
        requirePhoneVerification: dtoConfig.settings.requirePhoneVerification,
        defaultLanguage: dtoConfig.settings.defaultLanguage,
        timezone: dtoConfig.settings.timezone,
      },
      metadata: dtoConfig.metadata,
    };
  }

  private getDefaultConfig(
    overrideConfig?: Partial<AnchorConfig>,
  ): AnchorConfig {
    const defaultConfig: AnchorConfig = {
      branding: {
        theme: 'light' as any,
      },
      features: {
        allowMatching: true,
        allowChatModeration: false,
        allowUserManagement: true,
        allowCustomOnboarding: false,
        allowBulkOperations: false,
        allowAnalytics: true,
        allowExport: false,
      },
      matching: {
        algorithm: 'default' as any,
        allowCrossAnchorMatching: false,
      },
      moderation: {
        level: 'none' as any,
        requireApproval: false,
        allowCounselorAccess: false,
        chatMonitoring: false,
        autoModeration: false,
        reportThreshold: 3,
        allowedCounselorRoles: [],
      },
      settings: {
        allowSelfRegistration: true,
        requireEmailVerification: true,
        requirePhoneVerification: false,
        defaultLanguage: 'en',
        timezone: 'UTC',
      },
    };

    return this.mergeConfig(defaultConfig, overrideConfig || {});
  }

  private mergeConfig(
    current: AnchorConfig,
    update: Partial<AnchorConfig>,
  ): AnchorConfig {
    return {
      ...current,
      ...update,
      branding: { ...current.branding, ...update.branding },
      features: { ...current.features, ...update.features },
      matching: { ...current.matching, ...update.matching },
      moderation: { ...current.moderation, ...update.moderation },
      settings: { ...current.settings, ...update.settings },
    };
  }

  private mapToResponseDto(anchor: Anchor): AnchorResponseDto {
    return {
      id: anchor.id,
      name: anchor.name,
      subdomain: anchor.subdomain,
      poolMode: anchor.poolMode,
      config: anchor.config as AnchorConfigDto,
      status: anchor.status,
      createdAt: anchor.createdAt,
      updatedAt: anchor.updatedAt,
      userCount: anchor.users?.count() || 0,
      authAccountCount: anchor.authAccounts?.count() || 0,
    };
  }
}
