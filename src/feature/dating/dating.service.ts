import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityManager,
  EntityRepository,
  QueryBuilder,
} from '@mikro-orm/postgresql';
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
import { downloadUrlAsMulterFile } from 'src/common/utils/file.util';
import { UpdateDateFilterDto } from './dto/dating-filter.dto';
import { DatingFilter } from './entities/dating.filter';
import { RangeEmbDto } from 'src/common/dtos/range-emb-.dto';
import { RangeEmb } from 'src/common/entities/range.emb';
import { GeoPoint } from 'src/common/entities/base-location-profile.entity';
import { RhFactor } from 'src/common/types/enums/other.enum';

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

  private extractUserProfileData(datingProfile: DatingProfile) {
    return {
      userGender: datingProfile.user.gender,
      userIntention: datingProfile.intention,
      userDob: datingProfile.user.dob,
      userEducation: datingProfile.user.educationLevel,
      userMaritalStatus: datingProfile.user.maritalStatus,
      userPrimaryGuidePhilosophy: datingProfile.user.primaryGuidePhilosophy,
      userDiet: datingProfile.user.diet,
      userReligiousLevel: datingProfile.user.religiousLevel,
      userProfession: datingProfile.user.profession?.id ?? 'NULL',
      userOriginCountry: datingProfile.user.originCountry?.id ?? 'NULL',
      userGrewUpIn: datingProfile.user.grewUpIn?.id ?? 'NULL',
      userEthnicity: datingProfile.user.ethnicity?.id ?? 'NULL',
      userReligion: datingProfile.user.religionSect?.religion?.id ?? 'NULL',
      userReligionSect: datingProfile.user.religionSect?.id ?? 'NULL',
      userHasChildren: datingProfile.user.children ?? 'NULL',
      userSmoking: datingProfile.user.smokingStatus ?? 'NULL',
      userDrinking: datingProfile.user.drinkingStatus ?? 'NULL',
      userDrug: datingProfile.user.drugUseStatus ?? 'NULL',
      userIsFaceVerified: datingProfile.user.isFaceVerified ?? false,
      userHeight:
        datingProfile.biol?.measuredHeightCm ??
        datingProfile.biol?.claimedHeightCm ??
        'NULL',
      userBodyType: datingProfile.biol?.bodyType ?? 'NULL',
      userRhesusFactor: datingProfile.biol?.rhesusFactor ?? 'NULL',
      userSickleCellTrait: datingProfile.biol?.sickleCellTrait ?? 'NULL',
      userSickleCellDisease: datingProfile.biol?.sickleCellDisease ?? 'NULL',
      userThalassemiaTrait: datingProfile.biol?.thalassemiaTrait ?? 'NULL',
      userTaySachsTrait: datingProfile.biol?.taySachsTrait ?? 'NULL',
      userCysticFibrosisTrait:
        datingProfile.biol?.cysticFibrosisTrait ?? 'NULL',
      userG6pdDeficiency: datingProfile.biol?.g6pdDeficiency ?? 'NULL',
      userFinancialAttitude:
        datingProfile.personality?.financialAttitude ?? 'NULL',
      userHonesty: datingProfile.personality?.honesty ?? 'NULL',
      userKindness: datingProfile.personality?.kindess ?? 'NULL',
      userGenerosity: datingProfile.personality?.generousity ?? 'NULL',
      userUprightness: datingProfile.personality?.uprightness ?? 'NULL',
      userPoliticalView: datingProfile.personality?.politicalView ?? 'NULL',
      userDressSense: datingProfile.personality?.dressSenseMen ?? 'NULL',
      userRelationshipBelief: datingProfile.relationship?.belief ?? 'NULL',
      userIntimacyBelief: datingProfile.relationship?.intimacyBelief ?? 'NULL',
      userParentingStyle: datingProfile.relationship?.parentingStyle ?? 'NULL',
      userMaritalTimeline:
        datingProfile.relationship?.maritalTimeline ?? 'NULL',
    };
  }

  private buildCompatibilityAnalysis(datingProfile: DatingProfile): string {
    return `(
      -- Only provide analysis for users WITH TrueFynd (for all candidates)
      CASE 
        WHEN dlp.trueFyndEndsAt IS NOT NULL AND dlp.trueFyndEndsAt > NOW() THEN 'TrueFynd candidate - compatibility score calculated'
        WHEN '${datingProfile.user.gender}' != ANY(df.gendersInterestedIn) THEN 'Gender mismatch: You are not the gender this candidate is interested in'
        WHEN '${datingProfile.intention}' != ANY(df.intentions) THEN 'Intention mismatch: Your relationship intentions do not match what this candidate wants'
        WHEN EXTRACT(YEAR FROM AGE('${datingProfile.user.dob}')) NOT BETWEEN df.age.min AND df.age.max AND df.age IS NOT NULL THEN 'Age mismatch: Your age does not match this candidate''s preference'
        WHEN ${datingProfile.user.educationLevel} NOT BETWEEN df.education.min AND df.education.max AND df.education IS NOT NULL THEN 'Education mismatch: Your education level does not match this candidate''s preference'
        WHEN '${datingProfile.user.maritalStatus}' != ANY(df.maritalStatus) AND df.maritalStatus?.length > 0 THEN 'Marital status mismatch: Your marital status does not match this candidate''s preference'
        WHEN '${datingProfile.user.primaryGuidePhilosophy}' != ANY(df.primaryGuidePhilosophy) AND df.primaryGuidePhilosophy?.length > 0 THEN 'Philosophy mismatch: Your guiding philosophy does not match this candidate''s preference'
        WHEN '${datingProfile.user.diet}' != ANY(df.diet) AND df.diet?.length > 0 THEN 'Diet mismatch: Your diet does not match this candidate''s preference'
        WHEN ${datingProfile.user.profession?.id ?? 'NULL'} != ANY(df.restrictToProfessions) AND df.restrictToProfessions?.length > 0 THEN 'Profession mismatch: Your profession is not in this candidate''s preferred list'
        WHEN ${datingProfile.user.profession?.id ?? 'NULL'} = ANY(df.excludeProfessions) AND df.excludeProfessions?.length > 0 THEN 'Profession exclusion: Your profession is excluded by this candidate'
        WHEN dlp.country_id != ANY(df.basedInCountries) AND df.basedInCountries?.length > 0 THEN 'Location mismatch: You are not based in this candidate''s preferred countries'
        WHEN ${datingProfile.user.originCountry?.id ?? 'NULL'} != ANY(df.originCountries) AND df.originCountries?.length > 0 THEN 'Origin country mismatch: Your origin country does not match this candidate''s preference'
        WHEN ${datingProfile.user.grewUpIn?.id ?? 'NULL'} != ANY(df.grewupCountries) AND df.grewupCountries?.length > 0 THEN 'Background mismatch: You did not grow up in this candidate''s preferred countries'
        WHEN NOT EXISTS(SELECT 1 FROM user_nationalities un WHERE un.user_id = u.id AND un.nationality_id = ANY(df.nationalitiesOf)) AND df.nationalitiesOf?.length > 0 THEN 'Nationality mismatch: Your nationality does not match this candidate''s preference'
        WHEN ${datingProfile.user.ethnicity?.id ?? 'NULL'} != ANY(df.ethniticities) AND df.ethniticities?.length > 0 THEN 'Ethnicity mismatch: Your ethnicity does not match this candidate''s preference'
        WHEN ${datingProfile.user.religionSect?.religion?.id ?? 'NULL'} NOT IN (SELECT id FROM religion_sects WHERE religion_id = ANY(df.religions)) AND df.religions?.length > 0 THEN 'Religion mismatch: Your religion does not match this candidate''s preference'
        WHEN ${datingProfile.user.religionSect?.id ?? 'NULL'} != ANY(df.religionsSects) AND df.religionsSects?.length > 0 THEN 'Religious sect mismatch: Your religious sect does not match this candidate''s preference'
        WHEN ${datingProfile.user.religiousLevel} NOT BETWEEN df.religiousLevel.min AND df.religiousLevel.max AND df.religiousLevel IS NOT NULL THEN 'Religious level mismatch: Your religious level does not match this candidate''s preference'
        WHEN NOT EXISTS(SELECT 1 FROM user_interests ui WHERE ui.user_id = u.id AND ui.interest_id = ANY(df.interests)) AND df.interests?.length > 0 THEN 'Interest mismatch: Your interests do not match this candidate''s preference'
        WHEN ${datingProfile.user.children} NOT BETWEEN df.hasChildren.min AND df.hasChildren.max AND df.hasChildren IS NOT NULL THEN 'Children mismatch: Your children status does not match this candidate''s preference'
        WHEN ${datingProfile.user.smokingStatus} NOT BETWEEN df.smoking.min AND df.smoking.max AND df.smoking IS NOT NULL THEN 'Smoking mismatch: Your smoking status does not match this candidate''s preference'
        WHEN ${datingProfile.user.drinkingStatus} NOT BETWEEN df.drinking.min AND df.drinking.max AND df.drinking IS NOT NULL THEN 'Drinking mismatch: Your drinking status does not match this candidate''s preference'
        WHEN ${datingProfile.user.drugUseStatus} NOT BETWEEN df.drug.min AND df.drug.max AND df.drug IS NOT NULL THEN 'Drug use mismatch: Your drug use status does not match this candidate''s preference'
        WHEN df.isFaceVerified = true AND ${datingProfile.user.isFaceVerified} = false THEN 'Verification mismatch: This candidate requires face verification but you are not verified'
        WHEN df.isIdVerified = true AND u.is_id_verified = false THEN 'Verification mismatch: This candidate requires ID verification but you are not verified'
        WHEN (${datingProfile.biol?.measuredHeightCm ?? datingProfile.biol?.claimedHeightCm ?? 'NULL'}) NOT BETWEEN df.heightCm.min AND df.heightCm.max AND df.heightCm IS NOT NULL THEN 'Height mismatch: Your height does not match this candidate''s preference'
        WHEN (${datingProfile.biol?.bodyType ?? 'NULL'}) NOT BETWEEN df.bodyType.min AND df.bodyType.max AND df.bodyType IS NOT NULL THEN 'Body type mismatch: Your body type does not match this candidate''s preference'
        WHEN '${datingProfile.biol?.rhesusFactor ?? 'NULL'}' != df.rhesusFactorIs AND df.rhesusFactorIs IS NOT NULL THEN 'Rhesus factor mismatch: Your rhesus factor does not match this candidate''s preference'
        WHEN df.excludeSickleCellTrait = true AND ${datingProfile.biol?.sickleCellTrait} = true THEN 'Health trait exclusion: You have sickle cell trait which this candidate wants to exclude'
        WHEN df.excludeSickleCellDisease = true AND ${datingProfile.biol?.sickleCellDisease} = true THEN 'Health trait exclusion: You have sickle cell disease which this candidate wants to exclude'
        WHEN df.excludeThalassemiaTrait = true AND ${datingProfile.biol?.thalassemiaTrait} = true THEN 'Health trait exclusion: You have thalassemia trait which this candidate wants to exclude'
        WHEN df.excludeTaySachsTrait = true AND ${datingProfile.biol?.taySachsTrait} = true THEN 'Health trait exclusion: You have Tay-Sachs trait which this candidate wants to exclude'
        WHEN df.excludeCysticFibrosisTrait = true AND ${datingProfile.biol?.cysticFibrosisTrait} = true THEN 'Health trait exclusion: You have cystic fibrosis trait which this candidate wants to exclude'
        WHEN df.excludeG6pdDeficiency = true AND ${datingProfile.biol?.g6pdDeficiency} = true THEN 'Health trait exclusion: You have G6PD deficiency which this candidate wants to exclude'
        WHEN (${datingProfile.personality?.financialAttitude ?? 'NULL'}) NOT BETWEEN df.financialAttitude.min AND df.financialAttitude.max AND df.financialAttitude IS NOT NULL THEN 'Financial attitude mismatch: Your financial attitude does not match this candidate''s preference'
        WHEN (${datingProfile.personality?.honesty ?? 'NULL'}) NOT BETWEEN df.honesty.min AND df.honesty.max AND df.honesty IS NOT NULL THEN 'Honesty mismatch: Your honesty level does not match this candidate''s preference'
        WHEN (${datingProfile.personality?.kindess ?? 'NULL'}) NOT BETWEEN df.kindness.min AND df.kindness.max AND df.kindness IS NOT NULL THEN 'Kindness mismatch: Your kindness level does not match this candidate''s preference'
        WHEN (${datingProfile.personality?.generousity ?? 'NULL'}) NOT BETWEEN df.generousity.min AND df.generousity.max AND df.generousity IS NOT NULL THEN 'Generosity mismatch: Your generosity level does not match this candidate''s preference'
        WHEN (${datingProfile.personality?.uprightness ?? 'NULL'}) NOT BETWEEN df.uprightness.min AND df.uprightness.max AND df.uprightness IS NOT NULL THEN 'Uprightness mismatch: Your uprightness level does not match this candidate''s preference'
        WHEN (${datingProfile.personality?.politicalView ?? 'NULL'}) NOT BETWEEN df.politicalView.min AND df.politicalView.max AND df.politicalView IS NOT NULL THEN 'Political view mismatch: Your political view does not match this candidate''s preference'
        WHEN (${datingProfile.personality?.dressSenseMen ?? 'NULL'}) NOT BETWEEN df.dressSense.min AND df.dressSense.max AND df.dressSense IS NOT NULL THEN 'Dress sense mismatch: Your dress sense does not match this candidate''s preference'
        WHEN (${datingProfile.relationship?.belief ?? 'NULL'}) NOT BETWEEN df.relationshipBelief.min AND df.relationshipBelief.max AND df.relationshipBelief IS NOT NULL THEN 'Relationship belief mismatch: Your relationship belief does not match this candidate''s preference'
        WHEN (${datingProfile.relationship?.intimacyBelief ?? 'NULL'}) NOT BETWEEN df.intimacyBelief.min AND df.intimacyBelief.max AND df.intimacyBelief IS NOT NULL THEN 'Intimacy belief mismatch: Your intimacy belief does not match this candidate''s preference'
        WHEN (${datingProfile.relationship?.parentingStyle ?? 'NULL'}) NOT BETWEEN df.parentingStyle.min AND df.parentingStyle.max AND df.parentingStyle IS NOT NULL THEN 'Parenting style mismatch: Your parenting style does not match this candidate''s preference'
        WHEN (${datingProfile.relationship?.maritalTimeline ?? 'NULL'}) NOT BETWEEN df.maritalTimeline.min AND df.maritalTimeline.max AND df.maritalTimeline IS NOT NULL THEN 'Marital timeline mismatch: Your marital timeline does not match this candidate''s preference'
        ELSE 'Good compatibility match'
      END
    ) as compatibility_analysis`;
  }

  private buildCompatibilityScore(
    datingProfile: DatingProfile,
    condition: string,
    alias: string,
  ): string {
    // Extract all current user's profile data for comprehensive checking
    const userData = this.extractUserProfileData(datingProfile);
    const {
      userGender,
      userIntention,
      userDob,
      userEducation,
      userMaritalStatus,
      userPrimaryGuidePhilosophy,
      userDiet,
      userReligiousLevel,
      userProfession,
      userOriginCountry,
      userGrewUpIn,
      userEthnicity,
      userReligion,
      userReligionSect,
      userHasChildren,
      userSmoking,
      userDrinking,
      userDrug,
      userIsFaceVerified,
      userHeight,
      userBodyType,
      userRhesusFactor,
      userSickleCellTrait,
      userSickleCellDisease,
      userThalassemiaTrait,
      userTaySachsTrait,
      userCysticFibrosisTrait,
      userG6pdDeficiency,
      userFinancialAttitude,
      userHonesty,
      userKindness,
      userGenerosity,
      userUprightness,
      userPoliticalView,
      userDressSense,
      userRelationshipBelief,
      userIntimacyBelief,
      userParentingStyle,
      userMaritalTimeline,
    } = userData;

    return `(
      CASE 
        WHEN ${condition} THEN
          -- Calculate comprehensive compatibility score: How well does current user match candidate's ALL criteria?
          (
            -- BASE PROFILE FILTERS (30% weight)
            (
              (CASE WHEN '${userGender}' = ANY(df.gendersInterestedIn) THEN 100 ELSE 0 END * 0.2) +
              (CASE WHEN '${userIntention}' = ANY(df.intentions) THEN 100 ELSE 0 END * 0.2) +
              (CASE 
                WHEN df.age IS NOT NULL THEN 
                  CASE WHEN EXTRACT(YEAR FROM AGE('${userDob}')) BETWEEN df.age.min AND df.age.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.15) +
              (CASE 
                WHEN df.education IS NOT NULL THEN 
                  CASE WHEN ${userEducation} BETWEEN df.education.min AND df.education.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1) +
              (CASE 
                WHEN df.maritalStatus?.length > 0 THEN 
                  CASE WHEN '${userMaritalStatus}' = ANY(df.maritalStatus) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1) +
              (CASE 
                WHEN df.primaryGuidePhilosophy?.length > 0 THEN 
                  CASE WHEN '${userPrimaryGuidePhilosophy}' = ANY(df.primaryGuidePhilosophy) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1) +
              (CASE 
                WHEN df.diet?.length > 0 THEN 
                  CASE WHEN '${userDiet}' = ANY(df.diet) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.05) +
              (CASE 
                WHEN df.restrictToProfessions?.length > 0 THEN 
                  CASE WHEN ${userProfession} = ANY(df.restrictToProfessions) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.05) +
              (CASE 
                WHEN df.excludeProfessions?.length > 0 THEN 
                  CASE WHEN ${userProfession} NOT IN (df.excludeProfessions) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.05)
            ) +
            -- LOCATION & BACKGROUND FILTERS (15% weight)
            (
              (CASE 
                WHEN df.basedInCountries?.length > 0 THEN 
                  CASE WHEN dlp.country_id = ANY(df.basedInCountries) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.3) +
              (CASE 
                WHEN df.originCountries?.length > 0 THEN 
                  CASE WHEN ${userOriginCountry} = ANY(df.originCountries) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.grewupCountries?.length > 0 THEN 
                  CASE WHEN ${userGrewUpIn} = ANY(df.grewupCountries) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.nationalitiesOf?.length > 0 THEN 
                  CASE WHEN EXISTS(SELECT 1 FROM user_nationalities un WHERE un.user_id = u.id AND un.nationality_id = ANY(df.nationalitiesOf)) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.15) +
              (CASE 
                WHEN df.ethniticities?.length > 0 THEN 
                  CASE WHEN ${userEthnicity} = ANY(df.ethniticities) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.15)
            ) +
            -- RELIGION & INTERESTS FILTERS (10% weight)
            (
              (CASE 
                WHEN df.religions?.length > 0 THEN 
                  CASE WHEN ${userReligion} IN (SELECT id FROM religion_sects WHERE religion_id = ANY(df.religions)) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.3) +
              (CASE 
                WHEN df.religionsSects?.length > 0 THEN 
                  CASE WHEN ${userReligionSect} = ANY(df.religionsSects) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.3) +
              (CASE 
                WHEN df.religiousLevel IS NOT NULL THEN 
                  CASE WHEN ${userReligiousLevel} BETWEEN df.religiousLevel.min AND df.religiousLevel.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.interests?.length > 0 THEN 
                  CASE WHEN EXISTS(SELECT 1 FROM user_interests ui WHERE ui.user_id = u.id AND ui.interest_id = ANY(df.interests)) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2)
            ) +
            -- LIFESTYLE & VERIFICATION FILTERS (5% weight)
            (
              (CASE 
                WHEN df.hasChildren IS NOT NULL THEN 
                  CASE WHEN ${userHasChildren} BETWEEN df.hasChildren.min AND df.hasChildren.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.smoking IS NOT NULL THEN 
                  CASE WHEN ${userSmoking} BETWEEN df.smoking.min AND df.smoking.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.drinking IS NOT NULL THEN 
                  CASE WHEN ${userDrinking} BETWEEN df.drinking.min AND df.drinking.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.drug IS NOT NULL THEN 
                  CASE WHEN ${userDrug} BETWEEN df.drug.min AND df.drug.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.isFaceVerified = true THEN 
                  CASE WHEN ${userIsFaceVerified} = true THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1) +
              (CASE 
                WHEN df.isIdVerified = true THEN 
                  CASE WHEN u.is_id_verified = true THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1)
            ) +
            -- BIOLOGICAL FILTERS (25% weight)
            (
              (CASE 
                WHEN df.heightCm IS NOT NULL AND ${userHeight} IS NOT NULL THEN 
                  CASE WHEN ${userHeight} BETWEEN df.heightCm.min AND df.heightCm.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.4) +
              (CASE 
                WHEN df.bodyType IS NOT NULL AND ${userBodyType} IS NOT NULL THEN 
                  CASE WHEN ${userBodyType} BETWEEN df.bodyType.min AND df.bodyType.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.3) +
              (CASE 
                WHEN df.rhesusFactorIs IS NOT NULL AND ${userRhesusFactor} IS NOT NULL THEN 
                  CASE WHEN '${userRhesusFactor}' = df.rhesusFactorIs THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.3)
            ) +
            -- HEALTH TRAIT EXCLUSIONS (8% weight)
            (
              (CASE 
                WHEN df.excludeSickleCellTrait = true AND ${userSickleCellTrait} = true THEN 0
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.excludeSickleCellDisease = true AND ${userSickleCellDisease} = true THEN 0
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.excludeThalassemiaTrait = true AND ${userThalassemiaTrait} = true THEN 0
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.excludeTaySachsTrait = true AND ${userTaySachsTrait} = true THEN 0
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.excludeCysticFibrosisTrait = true AND ${userCysticFibrosisTrait} = true THEN 0
                ELSE 100 
              END * 0.1) +
              (CASE 
                WHEN df.excludeG6pdDeficiency = true AND ${userG6pdDeficiency} = true THEN 0
                ELSE 100 
              END * 0.1)
            ) +
            -- PERSONALITY FILTERS (15% weight)
            (
              (CASE 
                WHEN df.financialAttitude IS NOT NULL AND ${userFinancialAttitude} IS NOT NULL THEN 
                  CASE WHEN ${userFinancialAttitude} BETWEEN df.financialAttitude.min AND df.financialAttitude.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.honesty IS NOT NULL AND ${userHonesty} IS NOT NULL THEN 
                  CASE WHEN ${userHonesty} BETWEEN df.honesty.min AND df.honesty.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.kindness IS NOT NULL AND ${userKindness} IS NOT NULL THEN 
                  CASE WHEN ${userKindness} BETWEEN df.kindness.min AND df.kindness.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.generousity IS NOT NULL AND ${userGenerosity} IS NOT NULL THEN 
                  CASE WHEN ${userGenerosity} BETWEEN df.generousity.min AND df.generousity.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.uprightness IS NOT NULL AND ${userUprightness} IS NOT NULL THEN 
                  CASE WHEN ${userUprightness} BETWEEN df.uprightness.min AND df.uprightness.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1) +
              (CASE 
                WHEN df.politicalView IS NOT NULL AND ${userPoliticalView} IS NOT NULL THEN 
                  CASE WHEN ${userPoliticalView} BETWEEN df.politicalView.min AND df.politicalView.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.05) +
              (CASE 
                WHEN df.dressSense IS NOT NULL AND ${userDressSense} IS NOT NULL THEN 
                  CASE WHEN ${userDressSense} BETWEEN df.dressSense.min AND df.dressSense.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.05)
            ) +
            -- RELATIONSHIP FILTERS (7% weight)
            (
              (CASE 
                WHEN df.relationshipBelief IS NOT NULL AND ${userRelationshipBelief} IS NOT NULL THEN 
                  CASE WHEN ${userRelationshipBelief} BETWEEN df.relationshipBelief.min AND df.relationshipBelief.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.4) +
              (CASE 
                WHEN df.intimacyBelief IS NOT NULL AND ${userIntimacyBelief} IS NOT NULL THEN 
                  CASE WHEN ${userIntimacyBelief} BETWEEN df.intimacyBelief.min AND df.intimacyBelief.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.3) +
              (CASE 
                WHEN df.parentingStyle IS NOT NULL AND ${userParentingStyle} IS NOT NULL THEN 
                  CASE WHEN ${userParentingStyle} BETWEEN df.parentingStyle.min AND df.parentingStyle.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.2) +
              (CASE 
                WHEN df.maritalTimeline IS NOT NULL AND ${userMaritalTimeline} IS NOT NULL THEN 
                  CASE WHEN ${userMaritalTimeline} BETWEEN df.maritalTimeline.min AND df.maritalTimeline.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1)
            )
          )
        ELSE NULL
      END
    )::int as ${alias}`;
  }

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
    payload: UpdateDateFilterDto | DatingFilter,
    isPremium = false,
  ): Omit<UpdateDateFilterDto, 'locationProfile'> {
    const {
      locationProfile: _,
      age,
      religions,
      intentions,
      maxDistanceMile,
      basedInCountries,
      gendersInterestedIn,
      ...rest
    } = payload;

    const basicFilters = {
      age,
      religions,
      intentions,
      maxDistanceMile,
      basedInCountries,
      gendersInterestedIn,
    };

    return isPremium ? { ...basicFilters, ...rest } : basicFilters;
  }

  private checkSubscriptions(datingProfile: DatingProfile) {
    const now = new Date();

    const hasControl = new Date(datingProfile?.controlEndsAt || now) > now;

    const hasTrueFynd = new Date(datingProfile?.trueFyndEndsAt || now) > now;

    const hasPremium = hasControl || hasTrueFynd;

    return { hasControl, hasTrueFynd, hasPremium };
  }

  async updateLocationFilter(
    authId: string,
    payload: UpdateDateFilterDto,
  ): Promise<void> {
    const { user } = await this.authService.fetchAuthUser(authId);
    const { locationProfile: locationProfileId } = payload;
    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail(
      {
        id: locationProfileId,
        user,
      },
      { populate: ['datingFilter', 'datingProfile'] },
    );

    const { hasPremium } = this.checkSubscriptions(
      locationProfile.datingProfile,
    );

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
  // based on each locationprofile
  // vanilla and trueFynd diff

  async findPotentialMatches(
    authId: string,
    locationProfileId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const { user } = await this.authService.fetchAuthUser(authId);

    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail(
      { id: locationProfileId, user },
      { populate: ['datingFilter', 'datingProfile', 'datingProfile.user'] },
    );

    const { datingProfile, datingFilter } = locationProfile;

    if (!datingProfile || !datingFilter) {
      throw new BadRequestException('Profile or filter not found.');
    }

    const usePinLocation =
      locationProfile?.usePinLocation && locationProfile?.pinnedPoint;

    const point = usePinLocation
      ? locationProfile?.pinnedPoint
      : locationProfile?.point;

    const longitude = point?.coordinates?.[0];
    const latitude = point?.coordinates?.[1];

    const { hasPremium, hasTrueFynd } = this.checkSubscriptions(datingProfile);

    const filters = this.reduceToAllowedFilters(datingFilter, hasPremium);

    const MAX_MILE = 500;

    const maxDistanceMile = filters?.maxDistanceMile ?? 0;

    // todo: remove profiles already interacted with or passed especially for true fynd

    const qb = this.datingLocationProfileRepo
      .createQueryBuilder('dlp')
      .select(['dlp.*', 'dp.*', 'u.*'])
      .join('dlp.datingProfile', 'dp')
      .join('dp.user', 'u')
      .leftJoin('df', 'df') // Always join datingFilter for compatibility scoring
      .leftJoin('dp.personality', 'pers') // Always join personality for compatibility scoring
      .leftJoin('dp.biol', 'biol') // Always join biol for compatibility scoring
      .leftJoin('dp.relationship', 'rel') // Always join relationship for compatibility scoring
      .where('dlp.id != ?', [locationProfile.id]);

    // todo: remove some options from each category of filter to maike it more specific e.g dress sense and diet should include only hijab etc and halal once you know they are muslim and primary guide philiposophy is religion
    // this is needed in onboarding and not in the filter section

    this.applyBaseProfileFilters(qb, filters);

    this.applyLocationFilters(
      qb,
      filters,
      point,
      longitude,
      latitude,
      maxDistanceMile,
      MAX_MILE,
    );

    this.applyDateProfileFilters(qb, filters);

    this.applyBiolFilters(qb, filters);

    this.applyPersonalityFilters(qb, filters);

    this.applyRelationshipFilters(qb, filters);

    // After line 717: All basic filters applied, we have a filtered candidate pool
    // Now we need to check candidates' filters against the current user

    // Calculate compatibility scores based on user's TrueFynd status
    if (hasTrueFynd) {
      // For users WITH TrueFynd: Calculate scores for ALL candidates
      const compatibilityScore = this.buildCompatibilityScore(
        datingProfile,
        '1=1', // Always true - calculate for all candidates
        'compatibility_score',
      );
      qb.addSelect(compatibilityScore);
    } else {
      // For users WITHOUT TrueFynd: Only calculate scores for TrueFynd candidates (these will be locked on client)
      const compatibilityScore = this.buildCompatibilityScore(
        datingProfile,
        'dlp.trueFyndEndsAt IS NOT NULL AND dlp.trueFyndEndsAt > NOW()',
        'compatibility_score',
      );
      qb.addSelect(compatibilityScore);
    }

    if (hasTrueFynd) {
      // Add detailed compatibility analysis for TrueFynd users
      const compatibilityAnalysis =
        this.buildCompatibilityAnalysis(datingProfile);
      qb.addSelect(compatibilityAnalysis);
    }

    // For TrueFynd users, handle everything at database level
    if (point && longitude && latitude) {
      qb.addSelect(
        `ST_Distance(
            CASE 
              WHEN dlp.usePinLocation = true AND dlp.pinnedPoint IS NOT NULL 
              THEN dlp.pinnedPoint 
              ELSE dlp.point 
            END, 
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
          ) as distance`,
      );
    }

    // Apply pagination at database level
    const offset = (page - 1) * limit;
    qb.offset(offset).limit(limit);

    // Order by compatibility scores first, then distance if available
    if (point && longitude && latitude) {
      if (hasTrueFynd) {
        // For TrueFynd users, order by user compatibility score, then candidate compatibility score, then distance
        qb.orderBy([
          { user_compatibility_score: 'desc' },
          { candidate_compatibility_score: 'desc' },
          { distance: 'asc' },
        ]);
      } else {
        // For non-TrueFynd users, order by candidate compatibility score, then distance
        qb.orderBy([
          { candidate_compatibility_score: 'desc' },
          { distance: 'asc' },
        ]);
      }
    } else {
      if (hasTrueFynd) {
        // For TrueFynd users, order by user compatibility score, then candidate compatibility score
        qb.orderBy([
          { user_compatibility_score: 'desc' },
          { candidate_compatibility_score: 'desc' },
        ]);
      } else {
        // For non-TrueFynd users, order by candidate compatibility score
        qb.orderBy({ candidate_compatibility_score: 'desc' });
      }
    }

    // Execute query and return results directly
    return await qb.getResultList();
  }

  /**
   * Analyzes compatibility between user and potential matches, providing detailed insights
   * for conversation starters, compromise areas, and relationship building guidance
   */
  // private enhanceMatchesWithCompatibilityAnalysis(
  //   matches: any[],
  //   userProfile: any,
  //   userFilters: any,
  // ) {
  //   return matches.map((match) => {
  //     const analysis = this.calculateDetailedCompatibility(
  //       match,
  //       userProfile,
  //       userFilters,
  //     );

  //     return {
  //       ...match,
  //       compatibilityAnalysis: analysis,
  //     };
  //   });
  // }

  /**
   * Calculates detailed compatibility breakdown with actionable insights
   */
  private calculateDetailedCompatibility(
    match: any,
    userProfile: any,
    userFilters: any,
  ) {
    const analysis = {
      overallScore: 0,
      strengths: [] as string[],
      areasForDiscussion: [] as string[],
      compromiseNeeded: [] as string[],
      conversationStarters: [] as string[],
      redFlags: [] as string[],
      greenFlags: [] as string[],
      categoryScores: {
        corePreferences: 0,
        personality: 0,
        lifestyle: 0,
        values: 0,
        future: 0,
      },
    };

    // Core Preferences Analysis (40% weight)
    const coreScore = this.analyzeCorePreferences(
      match,
      userProfile,
      userFilters,
    );
    analysis.categoryScores.corePreferences = coreScore.score;
    analysis.strengths.push(...coreScore.strengths);
    analysis.areasForDiscussion.push(...coreScore.discussionPoints);
    analysis.conversationStarters.push(...coreScore.conversationStarters);

    // Personality Compatibility (25% weight)
    const personalityScore = this.analyzePersonalityCompatibility(
      match,
      userFilters,
    );
    analysis.categoryScores.personality = personalityScore.score;
    analysis.strengths.push(...personalityScore.strengths);
    analysis.areasForDiscussion.push(...personalityScore.discussionPoints);

    // Lifestyle Compatibility (20% weight)
    const lifestyleScore = this.analyzeLifestyleCompatibility(
      match,
      userFilters,
    );
    analysis.categoryScores.lifestyle = lifestyleScore.score;
    analysis.strengths.push(...lifestyleScore.strengths);
    analysis.compromiseNeeded.push(...lifestyleScore.compromiseAreas);

    // Values & Beliefs (10% weight)
    const valuesScore = this.analyzeValuesCompatibility(match, userFilters);
    analysis.categoryScores.values = valuesScore.score;
    analysis.greenFlags.push(...valuesScore.greenFlags);
    analysis.redFlags.push(...valuesScore.redFlags);

    // Future Goals (5% weight)
    const futureScore = this.analyzeFutureCompatibility(match, userFilters);
    analysis.categoryScores.future = futureScore.score;
    analysis.areasForDiscussion.push(...futureScore.discussionPoints);

    // Calculate overall weighted score
    analysis.overallScore = Math.round(
      coreScore.score * 0.4 +
        personalityScore.score * 0.25 +
        lifestyleScore.score * 0.2 +
        valuesScore.score * 0.1 +
        futureScore.score * 0.05,
    );

    return analysis;
  }

  private analyzeCorePreferences(
    match: any,
    userProfile: any,
    userFilters: any,
  ) {
    const result = {
      score: 0,
      strengths: [] as string[],
      discussionPoints: [] as string[],
      conversationStarters: [] as string[],
    };

    // Gender compatibility
    if (match.mutual_gender_match === 100) {
      result.score += 25;
      result.strengths.push('Mutual gender attraction');
    } else {
      result.discussionPoints.push('Gender preferences may not align');
    }

    // Intention compatibility
    if (match.mutual_intention_match === 100) {
      result.score += 25;
      result.strengths.push('Shared relationship goals');
      result.conversationStarters.push(
        'What are you looking for in a relationship?',
      );
    } else {
      result.discussionPoints.push(
        'Different relationship intentions - discuss expectations',
      );
      result.conversationStarters.push(
        'How do you see this relationship developing?',
      );
    }

    // Age compatibility
    if (match.mutual_age_match === 100) {
      result.score += 25;
      result.strengths.push('Age preferences align');
    } else {
      result.discussionPoints.push('Age gap considerations');
      result.conversationStarters.push(
        'How do you feel about age differences in relationships?',
      );
    }

    // Distance compatibility
    if (match.distance && match.distance < 50) {
      result.score += 25;
      result.strengths.push('Convenient distance for meeting');
      result.conversationStarters.push(
        "What's your favorite spot in the area?",
      );
    } else {
      result.discussionPoints.push('Distance may require planning');
      result.conversationStarters.push(
        'How do you feel about long-distance relationships?',
      );
    }

    return result;
  }

  private analyzePersonalityCompatibility(match: any, userFilters: any) {
    const result = {
      score: 0,
      strengths: [] as string[],
      discussionPoints: [] as string[],
    };

    // Financial attitudes
    if (match.financial_compatibility === 100) {
      result.score += 20;
      result.strengths.push('Similar financial values');
    } else {
      result.discussionPoints.push(
        'Different financial approaches - discuss money management',
      );
    }

    // Communication style
    if (match.honesty_compatibility === 100) {
      result.score += 20;
      result.strengths.push('Shared commitment to honesty');
    } else {
      result.discussionPoints.push(
        'Different communication styles - discuss openness',
      );
    }

    // Kindness and generosity
    if (
      match.kindness_compatibility === 100 &&
      match.generosity_compatibility === 100
    ) {
      result.score += 30;
      result.strengths.push('Both value kindness and generosity');
    } else {
      result.discussionPoints.push(
        'Different approaches to giving and receiving',
      );
    }

    // Political views
    if (match.political_compatibility === 100) {
      result.score += 15;
      result.strengths.push('Similar political perspectives');
    } else {
      result.discussionPoints.push(
        'Different political views - discuss respectfully',
      );
    }

    // Dress sense
    if (match.dress_sense_compatibility === 100) {
      result.score += 15;
      result.strengths.push('Similar style preferences');
    } else {
      result.discussionPoints.push(
        'Different style preferences - discuss personal expression',
      );
    }

    return result;
  }

  private analyzeLifestyleCompatibility(match: any, userFilters: any) {
    const result = {
      score: 0,
      strengths: [] as string[],
      compromiseAreas: [] as string[],
    };

    // Smoking, drinking, drug use
    const lifestyleFactors = ['smoking', 'drinking', 'drug'];
    lifestyleFactors.forEach((factor) => {
      if (userFilters[factor] && match[`${factor}_compatibility`] === 100) {
        result.score += 33;
        result.strengths.push(`Similar ${factor} habits`);
      } else {
        result.compromiseAreas.push(
          `Different ${factor} preferences - discuss boundaries`,
        );
      }
    });

    return result;
  }

  private analyzeValuesCompatibility(match: any, userFilters: any) {
    const result = {
      score: 0,
      greenFlags: [] as string[],
      redFlags: [] as string[],
    };

    // Religion and values
    if (match.religious_compatibility === 100) {
      result.score += 50;
      result.greenFlags.push('Shared religious/spiritual values');
    } else if (match.religious_compatibility === 0) {
      result.redFlags.push(
        'Significant religious differences - may need compromise',
      );
    }

    // Relationship beliefs
    if (match.relationship_belief_compatibility === 100) {
      result.score += 50;
      result.greenFlags.push('Similar relationship philosophies');
    } else {
      result.redFlags.push(
        'Different relationship approaches - discuss expectations',
      );
    }

    return result;
  }

  private analyzeFutureCompatibility(match: any, userFilters: any) {
    const result = { score: 0, discussionPoints: [] as string[] };

    // Marriage timeline
    if (match.marital_timeline_compatibility === 100) {
      result.score += 50;
      result.discussionPoints.push('Similar marriage timeline');
    } else {
      result.discussionPoints.push(
        'Different marriage timelines - discuss future plans',
      );
    }

    // Children and family
    if (match.parenting_style_compatibility === 100) {
      result.score += 50;
      result.discussionPoints.push('Similar parenting approaches');
    } else {
      result.discussionPoints.push('Different views on children and family');
    }

    return result;
  }

  // next: handle filter .
  // math options - based on subscription, option for true fynd, that has not been passed
  // expose api for
  // likedYou, liked, view you, passed, complements ? block ?
  // s
  // sub
  // messages
  // anchor
  // events
  // friends

  /**
   * TrueFynd: Process matches with quality-first approach and smart caching
   */
  private async processTrueFyndMatches(
    matches: any[],
    userProfile: any,
    userFilters: any,
    page: number,
    limit: number,
  ) {
    // Calculate quality scores for all matches
    const qualityMatches = matches.map((match) => ({
      ...match,
      qualityAnalysis: this.calculateTrueFyndQualityScore(
        match,
        userProfile,
        userFilters,
      ),
    }));

    // Sort by quality score (highest first)
    qualityMatches.sort(
      (a, b) => b.qualityAnalysis.overallScore - a.qualityAnalysis.overallScore,
    );

    // Pagination
    const startIndex = (page - 1) * limit;
    const pageMatches = qualityMatches.slice(startIndex, startIndex + limit);

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(qualityMatches);

    return {
      matches: pageMatches,
      qualityMetrics,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(qualityMatches.length / limit),
        totalQualityMatches: qualityMatches.length,
        hasMore: startIndex + limit < qualityMatches.length,
      },
      userGuidance: {
        message:
          'TrueFynd found high-quality matches based on mutual compatibility',
        tip: 'Focus on profiles with 90%+ quality score for best results',
        nextAction: 'Review profiles and start meaningful conversations',
      },
    };
  }

  /**
   * Calculate TrueFynd quality score with detailed analysis
   */
  private calculateTrueFyndQualityScore(
    match: any,
    userProfile: any,
    userFilters: any,
  ) {
    const qualityFactors = {
      // Core Compatibility (50% weight)
      mutualAttraction: this.calculateMutualAttraction(match, userProfile),
      intentionAlignment: this.calculateIntentionAlignment(match, userProfile),

      // Profile Quality (30% weight)
      profileCompleteness: this.calculateProfileCompleteness(match),
      verificationStatus: this.calculateVerificationScore(match),

      // Compatibility Potential (20% weight)
      personalityMatch: this.calculatePersonalityMatch(match, userFilters),
      lifestyleCompatibility: this.calculateLifestyleCompatibility(
        match,
        userFilters,
      ),
    };

    // Weighted quality score
    const qualityScore = Math.round(
      qualityFactors.mutualAttraction * 0.25 +
        qualityFactors.intentionAlignment * 0.25 +
        qualityFactors.profileCompleteness * 0.2 +
        qualityFactors.verificationStatus * 0.1 +
        qualityFactors.personalityMatch * 0.1 +
        qualityFactors.lifestyleCompatibility * 0.1,
    );

    return {
      overallScore: qualityScore,
      qualityFactors,
      matchQuality: this.getMatchQualityLabel(qualityScore),
      whyThisMatch: this.getMatchInsights(qualityFactors),
      conversationStarters: this.getConversationStarters(qualityFactors),
    };
  }

  private calculateMutualAttraction(match: any, userProfile: any): number {
    // Check if both profiles are interested in each other
    if (
      match.gender_match_score === 100 &&
      match.reverse_gender_match_score === 100
    ) {
      return 100;
    }
    return 0;
  }

  private calculateIntentionAlignment(match: any, userProfile: any): number {
    if (
      match.intention_match_score === 100 &&
      match.reverse_intention_match_score === 100
    ) {
      return 100;
    }
    return 0;
  }

  private calculateProfileCompleteness(match: any): number {
    // Calculate profile completeness based on available data
    const fields = ['personality', 'biol', 'relationship'];
    const availableFields = fields.filter((field) => match[field]);
    return Math.round((availableFields.length / fields.length) * 100);
  }

  private calculateVerificationScore(match: any): number {
    return match.isFaceVerified ? 100 : 0;
  }

  private calculatePersonalityMatch(match: any, userFilters: any): number {
    // Basic personality compatibility check
    return 75; // Placeholder - can be enhanced with actual personality data
  }

  private calculateLifestyleCompatibility(
    match: any,
    userFilters: any,
  ): number {
    // Basic lifestyle compatibility check
    return 70; // Placeholder - can be enhanced with actual lifestyle data
  }

  private getMatchQualityLabel(score: number): string {
    if (score >= 95) return 'Perfect Match';
    if (score >= 90) return 'Excellent Match';
    if (score >= 85) return 'Great Match';
    if (score >= 80) return 'Good Match';
    return 'Potential Match';
  }

  private getMatchInsights(factors: any): string[] {
    const insights = [];

    if (factors.mutualAttraction === 100) {
      insights.push(
        'Mutual attraction confirmed - both profiles are interested in each other',
      );
    }

    if (factors.intentionAlignment === 100) {
      insights.push(
        "Shared relationship goals - you're looking for the same things",
      );
    }

    if (factors.profileCompleteness >= 90) {
      insights.push(
        'Complete profile - you have enough information to make a connection',
      );
    }

    return insights;
  }

  private getConversationStarters(factors: any): string[] {
    const starters = [];

    if (factors.mutualAttraction === 100) {
      starters.push(
        "I noticed we're both interested in each other - what caught your attention?",
      );
    }

    if (factors.intentionAlignment === 100) {
      starters.push(
        "We seem to be looking for the same things in a relationship. What's most important to you?",
      );
    }

    starters.push("What's your favorite way to spend a weekend?");

    return starters;
  }

  private calculateQualityMetrics(matches: any[]) {
    const scores = matches.map((m) => m.qualityAnalysis.overallScore);
    const averageScore = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );

    return {
      averageQualityScore: averageScore,
      perfectMatches: matches.filter(
        (m) => m.qualityAnalysis.overallScore >= 95,
      ).length,
      excellentMatches: matches.filter(
        (m) => m.qualityAnalysis.overallScore >= 90,
      ).length,
      goodMatches: matches.filter((m) => m.qualityAnalysis.overallScore >= 80)
        .length,
      qualityDistribution: {
        perfect: matches.filter((m) => m.qualityAnalysis.overallScore >= 95)
          .length,
        excellent: matches.filter((m) => m.qualityAnalysis.overallScore >= 90)
          .length,
        great: matches.filter((m) => m.qualityAnalysis.overallScore >= 85)
          .length,
        good: matches.filter((m) => m.qualityAnalysis.overallScore >= 80)
          .length,
      },
    };
  }

  private applyBaseProfileFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
  ): void {
    if (filters.age) {
      qb.andWhere('EXTRACT(YEAR FROM AGE(u.dob)) BETWEEN ? AND ?', [
        filters.age.min ?? 18,
        filters.age.max ?? 99,
      ]);
    }

    if (filters.primaryGuidePhilosophy?.length) {
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

    if (filters.religiousLevel) {
      qb.andWhere('u.religiousLevel BETWEEN ? AND ?', [
        filters.religiousLevel.min,
        filters.religiousLevel.max,
      ]);
    }

    if (filters.ethniticities?.length) {
      qb.andWhere('u.ethnicity.id IN (?)', [filters.ethniticities]);
    }

    if (filters.interests?.length) {
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
      qb.andWhere('u.isIdVerified = ?', [true]);
    }

    // note: if user believe in astronology we use that to show is users astrology sign only
    if (filters.excludeAstroBelievers) {
      qb.andWhere('u.beliefAstronology = ?', [false]);
    }

    if (filters.useAstronology) {
      // todo: check user dob and show only users that matches
    }
  }

  private applyDateProfileFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
  ): void {
    if (filters.intentions?.length) {
      qb.andWhere('dp.intention = ANY(?)', [filters.intentions]);
    }

    if (filters.diet?.length) {
      qb.andWhere('(u.diet IS NULL OR u.diet = ANY(?))', [filters.diet]);
    }
  }

  // todo: move to base profile filter
  private applyLocationFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
    point: GeoPoint | undefined,
    longitude: number | undefined,
    latitude: number | undefined,
    maxDistanceMile: number,
    maxMile: number,
  ): void {
    if (filters.basedInCountries?.length) {
      qb.join('dlp.country', 'c').andWhere('c.id IN (?)', [
        filters.basedInCountries,
      ]);
    } else if (
      point &&
      longitude &&
      latitude &&
      maxDistanceMile &&
      maxDistanceMile < maxMile
    ) {
      const maxDistanceMeters = maxDistanceMile * 1609.34;

      qb.andWhere(
        `ST_DWithin(
          CASE 
            WHEN dlp.usePinLocation = true AND dlp.pinnedPoint IS NOT NULL 
            THEN dlp.pinnedPoint 
            ELSE dlp.point 
          END, 
          ST_SetSRID(ST_MakePoint(?, ?), 4326), 
          ?
        )`,
        [longitude, latitude, maxDistanceMeters ?? 50000],
      );
    }
  }

  private applyBiolFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
  ): void {
    const needsBiolJoin =
      filters.heightCm ||
      filters.bodyType ||
      filters.isHeightVerified ||
      filters.excludeSickleCellTrait ||
      filters.excludeSickleCellDisease ||
      filters.excludeThalassemiaTrait ||
      filters.rhesusFactorIs ||
      filters.excludeTaySachsTrait ||
      filters.excludeCysticFibrosisTrait ||
      filters.excludeG6pdDeficiency;

    if (needsBiolJoin && !this.hasJoin(qb, 'biol')) {
      qb.leftJoin('dp.biol', 'biol');
    }

    // todo: review measure height when there is a client solution for measurement
    if (filters.heightCm) {
      qb.andWhere(
        '(biol.measuredHeightCm IS NULL AND biol.claimedHeightCm IS NULL) OR (COALESCE(biol.measuredHeightCm, biol.claimedHeightCm) BETWEEN ? AND ?)',
        [filters.heightCm.min, filters.heightCm.max],
      );
    }

    if (filters.isHeightVerified) {
      qb.andWhere('biol.measuredHeightCm IS NOT NULL');
    }

    if (filters.bodyType) {
      qb.andWhere('biol.bodyType BETWEEN ? AND ?', [
        filters.bodyType.min,
        filters.bodyType.max,
      ]);
    }

    if (filters.excludeSickleCellTrait) {
      qb.andWhere('biol.sickleCellTrait IS NULL OR biol.sickleCellTrait = ?', [
        false,
      ]);
    }

    if (filters.excludeSickleCellDisease) {
      qb.andWhere(
        'biol.sickleCellDisease IS NULL OR biol.sickleCellDisease = ?',
        [false],
      );
    }

    if (filters.excludeThalassemiaTrait) {
      qb.andWhere(
        'biol.thalassemiaTrait IS NULL OR biol.thalassemiaTrait = ?',
        [false],
      );
    }

    if (filters.rhesusFactorIs) {
      qb.andWhere(
        'biol.rhesusFactor IS NULL OR biol.rhesusFactor= ? OR biol.rhesusFactor = ?',
        [filters.rhesusFactorIs, RhFactor.UNSURE],
      );
    }

    if (filters.excludeTaySachsTrait) {
      qb.andWhere('biol.taySachsTrait IS NULL OR biol.taySachsTrait = ?', [
        false,
      ]);
    }

    if (filters.excludeCysticFibrosisTrait) {
      qb.andWhere(
        'biol.cysticFibrosisTrait IS NULL OR biol.cysticFibrosisTrait = ?',
        [false],
      );
    }

    if (filters.excludeG6pdDeficiency) {
      qb.andWhere('biol.g6pdDeficiency IS NULL OR biol.g6pdDeficiency = ?', [
        false,
      ]);
    }
  }

  private applyPersonalityFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
  ): void {
    const needsPersonalityJoin =
      filters.financialAttitude ||
      filters.honesty ||
      filters.kindness ||
      filters.generousity ||
      filters.uprightness ||
      filters.politicalView ||
      filters.dressSense;

    if (needsPersonalityJoin && !this.hasJoin(qb, 'pers')) {
      qb.leftJoin('dp.personality', 'pers');
    }

    if (filters.financialAttitude) {
      qb.andWhere('pers.financialAttitude BETWEEN ? AND ?', [
        filters.financialAttitude.min,
        filters.financialAttitude.max,
      ]);
    }

    if (filters.honesty) {
      qb.andWhere('pers.honesty BETWEEN ? AND ?', [
        filters.honesty.min,
        filters.honesty.max,
      ]);
    }

    if (filters.kindness) {
      qb.andWhere('pers.kindness BETWEEN ? AND ?', [
        filters.kindness.min,
        filters.kindness.max,
      ]);
    }

    if (filters.generousity) {
      qb.andWhere('pers.generousity BETWEEN ? AND ?', [
        filters.generousity.min,
        filters.generousity.max,
      ]);
    }

    if (filters.uprightness) {
      qb.andWhere('pers.uprightness BETWEEN ? AND ?', [
        filters.uprightness.min,
        filters.uprightness.max,
      ]);
    }

    if (filters.politicalView) {
      qb.andWhere('pers.politicalView BETWEEN ? AND ?', [
        filters.politicalView.min,
        filters.politicalView.max,
      ]);
    }

    // Dress sense filter (gender-aware)
    if (filters.dressSense) {
      qb.andWhere(
        `(
          CASE 
            WHEN u.gender = 'man' THEN 
              CASE 
                WHEN pers.dressSenseMen IS NOT NULL THEN pers.dressSenseMen BETWEEN ? AND ?
                ELSE true -- Return user if dressSenseMen doesn't exist
              END
            WHEN u.gender = 'woman' THEN 
              CASE 
                WHEN pers.dressSenseWomen IS NOT NULL THEN pers.dressSenseWomen BETWEEN ? AND ?
                ELSE true -- Return user if dressSenseWomen doesn't exist
              END
            ELSE true -- Return user for other genders
          END
        )`,
        [
          filters.dressSense.min,
          filters.dressSense.max, // For men
          filters.dressSense.min,
          filters.dressSense.max, // For women
        ],
      );
    }

    // Personality first filter
    // todo: this was moved to dating profile - handle it for blurring pictures
    // if (filters.personalityFirst) {
    //   qb.andWhere('pers.id IS NOT NULL');
    // }
  }

  private hasJoin(qb: QueryBuilder<any>, alias: string): boolean {
    const query = qb.getQuery();
    return query.includes(`JOIN ${alias}`) || query.includes(`join ${alias}`);
  }

  private applyRelationshipFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
  ): void {
    const needsRelationshipJoin =
      filters.relationshipBelief ||
      filters.intimacyBelief ||
      filters.parentingStyle ||
      filters.spouseFriendship ||
      filters.maritalTimeline ||
      filters.relocateForMarriage?.length ||
      filters.wantChildren;

    if (needsRelationshipJoin && !this.hasJoin(qb, 'rel')) {
      qb.leftJoin('dp.relationship', 'rel');
    }

    if (filters.relationshipBelief) {
      qb.andWhere('(rel.belief IS NULL OR rel.belief BETWEEN ? AND ?)', [
        filters.relationshipBelief.min,
        filters.relationshipBelief.max,
      ]);
    }

    if (filters.intimacyBelief) {
      qb.andWhere(
        'rel.intimacyBelief IS NULL OR rel.intimacyBelief BETWEEN ? AND ?',
        [filters.intimacyBelief.min, filters.intimacyBelief.max],
      );
    }

    if (filters.parentingStyle) {
      qb.andWhere(
        'rel.parentingStyle IS NULL OR rel.parentingStyle BETWEEN ? AND ?',
        [filters.parentingStyle.min, filters.parentingStyle.max],
      );
    }

    if (filters.spouseFriendship) {
      qb.andWhere(
        'rel.spouseFriendship IS NULL OR rel.spouseFriendship BETWEEN ? AND ?',
        [filters.spouseFriendship.min, filters.spouseFriendship.max],
      );
    }

    if (filters.maritalTimeline) {
      qb.andWhere(
        'rel.maritalTimeline IS NULL OR rel.maritalTimeline BETWEEN ? AND ?',
        [filters.maritalTimeline.min, filters.maritalTimeline.max],
      );
    }

    if (filters.relocateForMarriage?.length) {
      qb.andWhere(
        'rel.relocateForMarriage IS NULL OR rel.relocateForMarriage = ANY(?)',
        [filters.relocateForMarriage],
      );
    }

    if (filters.wantChildren) {
      qb.andWhere('rel.wantChildren BETWEEN ? AND ?', [
        filters.wantChildren.min,
        filters.wantChildren.max,
      ]);
    }
  }

  /**
   * Applies TrueFynd biological filters with conditional logic
   */
  private applyTrueFyndBiolFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
  ): void {
    // Sickle cell trait filter
    qb.andWhere(
      filters.excludeSickleCellTrait
        ? 'biol.sickleCellTrait IS NULL OR biol.sickleCellTrait = ?'
        : '1=1',
      filters.excludeSickleCellTrait ? [false] : [],
    );

    // Sickle cell disease filter
    qb.andWhere(
      filters.excludeSickleCellDisease
        ? 'biol.sickleCellDisease IS NULL OR biol.sickleCellDisease = ?'
        : '1=1',
      filters.excludeSickleCellDisease ? [false] : [],
    );

    // Thalassemia trait filter
    qb.andWhere(
      filters.excludeThalassemiaTrait
        ? 'biol.thalassemiaTrait IS NULL OR biol.thalassemiaTrait = ?'
        : '1=1',
      filters.excludeThalassemiaTrait ? [false] : [],
    );

    // Rhesus factor filter
    qb.andWhere(
      filters.rhesusFactorIs
        ? 'biol.rhesusFactor IS NULL OR biol.rhesusFactor = ? OR biol.rhesusFactor = ?'
        : '1=1',
      filters.rhesusFactorIs ? [filters.rhesusFactorIs, 'UNSURE'] : [],
    );

    // Tay-Sachs trait filter
    qb.andWhere(
      filters.excludeTaySachsTrait
        ? 'biol.taySachsTrait IS NULL OR biol.taySachsTrait = ?'
        : '1=1',
      filters.excludeTaySachsTrait ? [false] : [],
    );

    // Cystic fibrosis trait filter
    qb.andWhere(
      filters.excludeCysticFibrosisTrait
        ? 'biol.cysticFibrosisTrait IS NULL OR biol.cysticFibrosisTrait = ?'
        : '1=1',
      filters.excludeCysticFibrosisTrait ? [false] : [],
    );

    // G6PD deficiency filter
    qb.andWhere(
      filters.excludeG6pdDeficiency
        ? 'biol.g6pdDeficiency IS NULL OR biol.g6pdDeficiency = ?'
        : '1=1',
      filters.excludeG6pdDeficiency ? [false] : [],
    );

    // Height verification filter
    qb.andWhere(
      filters.isHeightVerified ? 'biol.measuredHeightCm IS NOT NULL' : '1=1',
    );
  }

  /**
   * Applies TrueFynd personality filters with conditional logic
   */
  private applyTrueFyndPersonalityFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
  ): void {
    // Financial attitude filter
    qb.andWhere(
      filters.financialAttitude
        ? 'pers.financialAttitude BETWEEN ? AND ?'
        : '1=1',
      filters.financialAttitude
        ? [filters.financialAttitude.min, filters.financialAttitude.max]
        : [],
    );

    // Honesty filter
    qb.andWhere(
      filters.honesty ? 'pers.honesty BETWEEN ? AND ?' : '1=1',
      filters.honesty ? [filters.honesty.min, filters.honesty.max] : [],
    );

    // Kindness filter
    qb.andWhere(
      filters.kindness ? 'pers.kindness BETWEEN ? AND ?' : '1=1',
      filters.kindness ? [filters.kindness.min, filters.kindness.max] : [],
    );

    // Generosity filter
    qb.andWhere(
      filters.generousity ? 'pers.generousity BETWEEN ? AND ?' : '1=1',
      filters.generousity
        ? [filters.generousity.min, filters.generousity.max]
        : [],
    );

    // Uprightness filter
    qb.andWhere(
      filters.uprightness ? 'pers.uprightness BETWEEN ? AND ?' : '1=1',
      filters.uprightness
        ? [filters.uprightness.min, filters.uprightness.max]
        : [],
    );

    // Political view filter
    qb.andWhere(
      filters.politicalView ? 'pers.politicalView BETWEEN ? AND ?' : '1=1',
      filters.politicalView
        ? [filters.politicalView.min, filters.politicalView.max]
        : [],
    );

    // Dress sense filter (gender-aware)
    qb.andWhere(
      filters.dressSense
        ? `(
            CASE 
              WHEN u.gender = 'man' THEN 
                CASE 
                  WHEN pers.dressSenseMen IS NOT NULL THEN pers.dressSenseMen BETWEEN ? AND ?
                  ELSE true
                END
              WHEN u.gender = 'woman' THEN 
                CASE 
                  WHEN pers.dressSenseWomen IS NOT NULL THEN pers.dressSenseWomen BETWEEN ? AND ?
                  ELSE true
                END
              ELSE true
            END
          )`
        : '1=1',
      filters.dressSense
        ? [
            filters.dressSense.min,
            filters.dressSense.max, // For men
            filters.dressSense.min,
            filters.dressSense.max, // For women
          ]
        : [],
    );
  }

  /**
   * Applies TrueFynd relationship filters with conditional logic
   */
  private applyTrueFyndRelationshipFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
  ): void {
    // Religious level filter
    qb.andWhere(
      filters.religiousLevel ? 'u.religiousLevel BETWEEN ? AND ?' : '1=1',
      filters.religiousLevel
        ? [filters.religiousLevel.min, filters.religiousLevel.max]
        : [],
    );

    // Want children filter
    qb.andWhere(
      filters.wantChildren ? 'rel.wantChildren BETWEEN ? AND ?' : '1=1',
      filters.wantChildren
        ? [filters.wantChildren.min, filters.wantChildren.max]
        : [],
    );

    // Relationship belief filter
    qb.andWhere(
      filters.relationshipBelief ? 'rel.belief BETWEEN ? AND ?' : '1=1',
      filters.relationshipBelief
        ? [filters.relationshipBelief.min, filters.relationshipBelief.max]
        : [],
    );

    // Intimacy belief filter
    qb.andWhere(
      filters.intimacyBelief ? 'rel.intimacyBelief BETWEEN ? AND ?' : '1=1',
      filters.intimacyBelief
        ? [filters.intimacyBelief.min, filters.intimacyBelief.max]
        : [],
    );

    // Parenting style filter
    qb.andWhere(
      filters.parentingStyle ? 'rel.parentingStyle BETWEEN ? AND ?' : '1=1',
      filters.parentingStyle
        ? [filters.parentingStyle.min, filters.parentingStyle.max]
        : [],
    );

    // Spouse friendship filter
    qb.andWhere(
      filters.spouseFriendship ? 'rel.spouseFriendship BETWEEN ? AND ?' : '1=1',
      filters.spouseFriendship
        ? [filters.spouseFriendship.min, filters.spouseFriendship.max]
        : [],
    );

    // Marital timeline filter
    qb.andWhere(
      filters.maritalTimeline ? 'rel.maritalTimeline = ?' : '1=1',
      filters.maritalTimeline ? [filters.maritalTimeline] : [],
    );

    // Relocate for marriage filter
    qb.andWhere(
      filters.relocateForMarriage?.length
        ? 'rel.relocateForMarriage = ANY(?)'
        : '1=1',
      filters.relocateForMarriage?.length ? [filters.relocateForMarriage] : [],
    );
  }
}
