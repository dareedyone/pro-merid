import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { QueryBuilder } from '@mikro-orm/postgresql';
import { AuthService } from '../../feature/auth/auth.service';
import { Media } from '../../feature/user/entities/media.entity';
import { UploadPictureResponseObjType } from '../types/interface';
import {
  CreateProfileDto,
  UpdateProfileDto,
  UpdateFilterDto,
} from '../dtos/profile.dto';
import { GeoFallbackService } from '../../feature/location/geo-fallback.service';
import { Country } from '../../feature/location/entities/country.entity';
import { Region } from '../../feature/location/entities/region.entity';
import { UnknownCountry } from '../seeders/osm/country-meta';
import { CreateLocationProfileDto } from '../dtos/base-location-profile.dto';
import { GeoPoint } from '../entities/base-location-profile.entity';
import { BaseProfileFilter } from '../entities/base.profile-filter';
import { DatingLocationProfile } from '../../feature/dating/entities/dating-location.profile';
import { FriendProfile } from '../../feature/friends/entities/friend.profile';

type MediaProfileField = 'datingLocationProfile' | 'friendProfile';

type ProfileWithMedia = DatingLocationProfile | FriendProfile;

@Injectable()
export abstract class BaseProfileService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly em: EntityManager,
    protected readonly authService: AuthService,
    @InjectRepository(Media)
    protected readonly mediaRepo: EntityRepository<Media>,
    private readonly geoFallbackService: GeoFallbackService,
    @InjectRepository(Country)
    private readonly countryRepo: EntityRepository<Country>,
    @InjectRepository(Region)
    private readonly regionRepo: EntityRepository<Region>,
  ) {}

  abstract addProfile(authId: string, dto: CreateProfileDto): Promise<void>;
  abstract updateProfile(authId: string, dto: UpdateProfileDto): Promise<void>;
  abstract updateFilter(authId: string, dto: UpdateFilterDto): Promise<void>;
  abstract findPotentialMatches<T = unknown>(
    authId: string,
    profileId?: string,
  ): Promise<T[]>;

  protected async updateMediaForProfile(
    data: UploadPictureResponseObjType,
    profileEntity: ProfileWithMedia,
    profileField: MediaProfileField,
  ): Promise<void> {
    try {
      const { pictures, userId } = data;

      for (const media of pictures) {
        const existingMedia = profileEntity.media
          .getItems()
          .find((m: Media) => m.order === media.order);

        if (existingMedia) {
          existingMedia.url = media.url;
          existingMedia.fileType = media.fileType;
          existingMedia.isUser = media.isUser;
          existingMedia.order = media.order;
        } else {
          const newMedia = this.mediaRepo.create({
            user: userId,
            [profileField]: profileEntity,
            url: media.url,
            fileType: media.fileType,
            isUser: media.isUser,
            order: media.order,
          });

          this.em.persist(newMedia);
          profileEntity.media.add(newMedia);
        }
      }

      await this.em.flush();
    } catch (error) {
      this.logger.error(
        `Failed to handle media update for user: ${data.userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  protected async handleLocation(
    payload: Pick<CreateLocationProfileDto, 'location' | 'address'>,
  ): Promise<{
    country: Country;
    point: GeoPoint;
    location: string | undefined;
    isoCountryCode: string | undefined;
  }> {
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

    const point: GeoPoint = {
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
    }

    return {
      country,
      point,
      location: situated,
      isoCountryCode,
    };
  }

  protected applyBaseProfileFilters<T extends Record<string, any>>(
    qb: QueryBuilder<T>,
    filters: Partial<BaseProfileFilter>,
  ): void {
    if (filters.age) {
      qb.andWhere('EXTRACT(YEAR FROM AGE(u.dob)) BETWEEN ? AND ?', [
        filters.age.min ?? 18,
        filters.age.max ?? 99,
      ]);
    }

    if (
      filters.primaryGuidePhilosophy &&
      Array.isArray(filters.primaryGuidePhilosophy) &&
      filters.primaryGuidePhilosophy.length > 0
    ) {
      qb.andWhere('u.primaryGuidePhilosophy = ANY(?)', [
        filters.primaryGuidePhilosophy,
      ]);
    }

    if (filters.education) {
      qb.andWhere('u.educationLevel BETWEEN ? AND ?', [
        filters.education.min,
        filters.education.max,
      ]);
    }

    if (filters.maritalStatus?.length) {
      qb.andWhere('u.maritalStatus = ANY(?)', [filters.maritalStatus]);
    }

    if (filters.restrictToProfessions?.length) {
      qb.andWhere('u.profession.id IN (?)', [filters.restrictToProfessions]);
    }
    if (filters.excludeProfessions?.length) {
      qb.andWhere('u.profession.id NOT IN (?)', [filters.excludeProfessions]);
    }

    if (filters.nationalitiesOf?.length) {
      qb.join('u.nationalities', 'n').andWhere('n.id IN (?)', [
        filters.nationalitiesOf,
      ]);
    }

    if (filters.originCountries?.length) {
      qb.andWhere('u.originCountry.id IN (?)', [filters.originCountries]);
    }

    if (filters.grewupCountries?.length) {
      qb.andWhere('u.grewUpIn.id IN (?)', [filters.grewupCountries]);
    }

    if (filters.religions?.length) {
      qb.join('u.religionSect', 'rs')
        .join('rs.religion', 'r')
        .andWhere('r.id IN (?)', [filters.religions]);
    }

    if (filters.religionsSects?.length) {
      qb.join('u.religionSect', 'rs').andWhere('rs.id IN (?)', [
        filters.religionsSects,
      ]);
    }

    if (
      filters.religiousLevel &&
      typeof filters.religiousLevel === 'object' &&
      'min' in filters.religiousLevel &&
      'max' in filters.religiousLevel &&
      filters.religiousLevel.min !== undefined &&
      filters.religiousLevel.max !== undefined
    ) {
      qb.andWhere('u.religiousLevel BETWEEN ? AND ?', [
        filters.religiousLevel.min,
        filters.religiousLevel.max,
      ]);
    }

    if (
      filters.ethniticities &&
      Array.isArray(filters.ethniticities) &&
      filters.ethniticities.length > 0
    ) {
      qb.andWhere('u.ethnicity.id IN (?)', [filters.ethniticities]);
    }

    if (
      filters.interests &&
      Array.isArray(filters.interests) &&
      filters.interests.length > 0
    ) {
      qb.join('u.interests', 'i').andWhere('i.id IN (?)', [filters.interests]);
    }

    if (filters.hasChildren) {
      qb.andWhere('u.children BETWEEN ? AND ?', [
        filters.hasChildren.min,
        filters.hasChildren.max,
      ]);
    }

    if (filters.gendersInterestedIn?.length) {
      qb.andWhere('u.gender = ANY(?)', [filters.gendersInterestedIn]);
    }

    if (filters.smoking) {
      qb.andWhere('u.smokingStatus BETWEEN ? AND ?', [
        filters.smoking.min,
        filters.smoking.max,
      ]);
    }

    if (filters.drinking) {
      qb.andWhere('u.drinkingStatus BETWEEN ? AND ?', [
        filters.drinking.min,
        filters.drinking.max,
      ]);
    }

    if (filters.drug) {
      qb.andWhere('u.drugUseStatus BETWEEN ? AND ?', [
        filters.drug.min,
        filters.drug.max,
      ]);
    }

    if (filters.isFaceVerified) {
      qb.andWhere('u.isFaceVerified = ?', [true]);
    }

    if (filters.isIdVerified) {
      qb.andWhere('u.ageVerified = ?', [true]);
    }

    if (filters.excludeAstroBelievers) {
      qb.andWhere('u.beliefAstronology = ?', [false]);
    }

    if (filters.useAstronology) {
      // todo: check user dob and show only users that matches
    }
  }

  protected applyBaseLocationFilters<T extends Record<string, any>>(
    qb: QueryBuilder<T>,
    userPoint: GeoPoint,
    maxDistanceMile?: number,
  ): void {
    if (maxDistanceMile) {
      qb.andWhere(
        `ST_DWithin(
          ST_GeomFromText('POINT(${userPoint.coordinates[0]} ${userPoint.coordinates[1]})', 4326),
          ST_GeomFromText('POINT(' || lp.point.coordinates[0] || ' ' || lp.point.coordinates[1] || ')', 4326),
          ${maxDistanceMile * 1609.34}
        )`,
      );
    }
  }
}
