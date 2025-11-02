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
import { AuthService } from '../auth/auth.service';
import { Media } from '../user/entities/media.entity';
import { ConfigService } from '@nestjs/config';
import { MAX_PROFILE_PICTURE } from 'src/common/contant';
import {
  CreateLocationProfileDto,
  UpdateProfileLocationDto,
} from 'src/common/dtos/base-location-profile.dto';
import { BaseProfileService } from 'src/common/services/base-profile.service';
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
import { User } from '../user/entities/user/user.entity';
import { AuthenticatedUser } from 'src/common/types/request.types';

interface CompatibilityScoreOptions {
  datingProfile: DatingProfile;
  condition: string;
  alias: string;
}

// Response type for findPotentialMatches - represents the complex compatibility analysis result
interface DatingMatchResponse {
  // Base entity fields from the query
  id: string;
  point: any;
  location?: string;
  country?: any;
  usePinLocation?: boolean;
  pinnedPoint?: any;
  createdAt?: Date;
  updatedAt?: Date;

  // DatingProfile fields (dp.*)
  datingProfile: {
    id: string;
    bio?: string;
    height?: number;
    lookingFor?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };

  // User fields (u.*)
  user: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    dob: Date;
    gender: string;
    maritalStatus: string;
    educationLevel: number;
    profession?: any;
    religionSect?: any;
    ethnicity?: any;
    originCountry?: any;
    grewUpIn?: any;
    nationalities?: any[];
    isFaceVerified?: boolean;
    ageVerified?: boolean;
    smokingStatus?: number;
    drinkingStatus?: number;
    drugUseStatus?: number;
    beliefAstronology?: boolean;
    isCeleb?: boolean;
    isActivated?: boolean;
    lastSeenAt?: Date;
    timezone?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };

  // Optional joined fields
  datingFilter?: any;
  personality?: any;
  biol?: any;
  relationship?: any;

  // Compatibility analysis (for TrueFynd users)
  compatibility_data?: {
    score: number;
    analysis: {
      gender: boolean;
      intention: boolean;
      age: boolean;
      education: boolean;
      maritalStatus: boolean;
      primaryGuidePhilosophy: boolean;
      diet: boolean;
      profession: boolean;
      professionExcluded: boolean;
      location: boolean;
      originCountry: boolean;
      grewUpIn: boolean;
      nationality: boolean;
      ethnicity: boolean;
      religion: boolean;
      religionSect: boolean;
      religiousLevel: boolean;
      interests: boolean;
      children: boolean;
      smoking: boolean;
      drinking: boolean;
      drug: boolean;
      faceVerified: boolean;
      idVerified: boolean;
      astrology: boolean;
      height: boolean;
      heightVerified: boolean;
      bodyType: boolean;
      rhesusFactor: boolean;
      sickleCellTrait: boolean;
      sickleCellDisease: boolean;
      thalassemiaTrait: boolean;
      taySachsTrait: boolean;
      cysticFibrosisTrait: boolean;
      g6pdDeficiency: boolean;
      financialAttitude: boolean;
      honesty: boolean;
      kindness: boolean;
      generosity: boolean;
      uprightness: boolean;
      politicalView: boolean;
      dressSense: boolean;
      relationshipBelief: boolean;
      intimacyBelief: boolean;
      parentingStyle: boolean;
      maritalTimeline: boolean;
      relocateForMarriage: boolean;
      wantChildren: boolean;
      spouseFriendship: boolean;
    };
  };

  // Simple compatibility score (for non-TrueFynd users)
  compatibility_score?: number;

  // Distance calculation (when location is available)
  distance?: number;
}

interface CompatibilityScoreWithAnalysisOptions
  extends CompatibilityScoreOptions {
  hasTrueFynd: boolean;
}

@Injectable()
export class DatingService extends BaseProfileService {
  constructor(
    private readonly mediaQueueService: MediaQueueService,
    private readonly configService: ConfigService,
    protected readonly em: EntityManager,
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
    @InjectRepository(Media) protected mediaRepo: EntityRepository<Media>,
    @InjectRepository(User) private userRepo: EntityRepository<User>,
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
      userIsIdVerified: datingProfile.user.ageVerified ?? false,
      userBeliefAstronology: datingProfile.user.beliefAstronology ?? false,
      userHeight:
        datingProfile.biol?.measuredHeightCm ??
        datingProfile.biol?.claimedHeightCm ??
        'NULL',
      userMeasuredHeight: datingProfile.biol?.measuredHeightCm ?? 'NULL',
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
      userDressSenseMen: datingProfile.personality?.dressSenseMen ?? 'NULL',
      userDressSenseWomen: datingProfile.personality?.dressSenseWomen ?? 'NULL',
      userRelationshipBelief: datingProfile.relationship?.belief ?? 'NULL',
      userIntimacyBelief: datingProfile.relationship?.intimacyBelief ?? 'NULL',
      userParentingStyle: datingProfile.relationship?.parentingStyle ?? 'NULL',
      userMaritalTimeline:
        datingProfile.relationship?.maritalTimeline ?? 'NULL',
      userRelocateForMarriage:
        datingProfile.relationship?.relocateForMarriage ?? 'NULL',
      userWantChildren: datingProfile.relationship?.wantChildren ?? 'NULL',
      userSpouseFriendship:
        datingProfile.relationship?.spouseFriendship ?? 'NULL',
    };
  }

  private _dep_buildCompatibilityAnalysis(
    datingProfile: DatingProfile,
  ): string {
    // Return structured data instead of descriptive messages
    return `(
      json_build_object(
        'gender', CASE WHEN '${datingProfile.user.gender}' = ANY(df.gendersInterestedIn) THEN true ELSE false END,
        'intention', CASE WHEN '${datingProfile.intention}' = ANY(df.intentions) THEN true ELSE false END,
        'age', CASE WHEN df.age IS NULL OR EXTRACT(YEAR FROM AGE('${datingProfile.user.dob}')) BETWEEN df.age.min AND df.age.max THEN true ELSE false END,
        'education', CASE WHEN df.education IS NULL OR ${datingProfile.user.educationLevel} BETWEEN df.education.min AND df.education.max THEN true ELSE false END,
        'maritalStatus', CASE WHEN df.maritalStatus IS NULL OR df.maritalStatus?.length = 0 OR '${datingProfile.user.maritalStatus}' = ANY(df.maritalStatus) THEN true ELSE false END,
        'primaryGuidePhilosophy', CASE WHEN df.primaryGuidePhilosophy IS NULL OR df.primaryGuidePhilosophy?.length = 0 OR '${datingProfile.user.primaryGuidePhilosophy}' = ANY(df.primaryGuidePhilosophy) THEN true ELSE false END,
        'diet', CASE WHEN df.diet IS NULL OR df.diet?.length = 0 OR '${datingProfile.user.diet}' = ANY(df.diet) THEN true ELSE false END,
        'profession', CASE WHEN df.restrictToProfessions IS NULL OR df.restrictToProfessions?.length = 0 OR ${datingProfile.user.profession?.id ?? 'NULL'} = ANY(df.restrictToProfessions) THEN true ELSE false END,
        'professionExcluded', CASE WHEN df.excludeProfessions IS NULL OR df.excludeProfessions?.length = 0 OR ${datingProfile.user.profession?.id ?? 'NULL'} != ALL(df.excludeProfessions) THEN true ELSE false END,
        'location', CASE WHEN df.basedInCountries IS NULL OR df.basedInCountries?.length = 0 OR dlp.country_id = ANY(df.basedInCountries) THEN true ELSE false END,
        'originCountry', CASE WHEN df.originCountries IS NULL OR df.originCountries?.length = 0 OR ${datingProfile.user.originCountry?.id ?? 'NULL'} = ANY(df.originCountries) THEN true ELSE false END,
        'grewUpIn', CASE WHEN df.grewupCountries IS NULL OR df.grewupCountries?.length = 0 OR ${datingProfile.user.grewUpIn?.id ?? 'NULL'} = ANY(df.grewupCountries) THEN true ELSE false END,
        'nationality', CASE WHEN df.nationalitiesOf IS NULL OR df.nationalitiesOf?.length = 0 OR EXISTS(SELECT 1 FROM user_nationalities un WHERE un.user_id = u.id AND un.nationality_id = ANY(df.nationalitiesOf)) THEN true ELSE false END,
        'ethnicity', CASE WHEN df.ethniticities IS NULL OR df.ethniticities?.length = 0 OR ${datingProfile.user.ethnicity?.id ?? 'NULL'} = ANY(df.ethniticities) THEN true ELSE false END,
        'religion', CASE WHEN df.religions IS NULL OR df.religions?.length = 0 OR ${datingProfile.user.religionSect?.religion?.id ?? 'NULL'} IN (SELECT id FROM religion_sects WHERE religion_id = ANY(df.religions)) THEN true ELSE false END,
        'religionSect', CASE WHEN df.religionsSects IS NULL OR df.religionsSects?.length = 0 OR ${datingProfile.user.religionSect?.id ?? 'NULL'} = ANY(df.religionsSects) THEN true ELSE false END,
        'religiousLevel', CASE WHEN df.religiousLevel IS NULL OR ${datingProfile.user.religiousLevel} BETWEEN df.religiousLevel.min AND df.religiousLevel.max THEN true ELSE false END,
        'interests', CASE WHEN df.interests IS NULL OR df.interests?.length = 0 OR EXISTS(SELECT 1 FROM user_interests ui WHERE ui.user_id = u.id AND ui.interest_id = ANY(df.interests)) THEN true ELSE false END,
        'children', CASE WHEN df.hasChildren IS NULL OR ${datingProfile.user.children} BETWEEN df.hasChildren.min AND df.hasChildren.max THEN true ELSE false END,
        'smoking', CASE WHEN df.smoking IS NULL OR ${datingProfile.user.smokingStatus} BETWEEN df.smoking.min AND df.smoking.max THEN true ELSE false END,
        'drinking', CASE WHEN df.drinking IS NULL OR ${datingProfile.user.drinkingStatus} BETWEEN df.drinking.min AND df.drinking.max THEN true ELSE false END,
        'drug', CASE WHEN df.drug IS NULL OR ${datingProfile.user.drugUseStatus} BETWEEN df.drug.min AND df.drug.max THEN true ELSE false END,
        'faceVerified', CASE WHEN df.isFaceVerified = false OR ${datingProfile.user.isFaceVerified} = true THEN true ELSE false END,
        'idVerified', CASE WHEN df.isIdVerified = false OR ${datingProfile.user.ageVerified} = true THEN true ELSE false END,
        'astrology', CASE WHEN df.excludeAstroBelievers = false OR ${datingProfile.user.beliefAstronology} = false THEN true ELSE false END,
        'height', CASE WHEN df.heightCm IS NULL OR (${datingProfile.biol?.measuredHeightCm ?? datingProfile.biol?.claimedHeightCm ?? 'NULL'}) BETWEEN df.heightCm.min AND df.heightCm.max THEN true ELSE false END,
        'heightVerified', CASE WHEN df.isHeightVerified = false OR ${datingProfile.biol?.measuredHeightCm} IS NOT NULL THEN true ELSE false END,
        'bodyType', CASE WHEN df.bodyType IS NULL OR (${datingProfile.biol?.bodyType ?? 'NULL'}) BETWEEN df.bodyType.min AND df.bodyType.max THEN true ELSE false END,
        'rhesusFactor', CASE WHEN df.rhesusFactorIs IS NULL OR '${datingProfile.biol?.rhesusFactor ?? 'NULL'}' = df.rhesusFactorIs THEN true ELSE false END,
        'sickleCellTrait', CASE WHEN df.excludeSickleCellTrait = false OR ${datingProfile.biol?.sickleCellTrait} = false THEN true ELSE false END,
        'sickleCellDisease', CASE WHEN df.excludeSickleCellDisease = false OR ${datingProfile.biol?.sickleCellDisease} = false THEN true ELSE false END,
        'thalassemiaTrait', CASE WHEN df.excludeThalassemiaTrait = false OR ${datingProfile.biol?.thalassemiaTrait} = false THEN true ELSE false END,
        'taySachsTrait', CASE WHEN df.excludeTaySachsTrait = false OR ${datingProfile.biol?.taySachsTrait} = false THEN true ELSE false END,
        'cysticFibrosisTrait', CASE WHEN df.excludeCysticFibrosisTrait = false OR ${datingProfile.biol?.cysticFibrosisTrait} = false THEN true ELSE false END,
        'g6pdDeficiency', CASE WHEN df.excludeG6pdDeficiency = false OR ${datingProfile.biol?.g6pdDeficiency} = false THEN true ELSE false END,
        'financialAttitude', CASE WHEN df.financialAttitude IS NULL OR (${datingProfile.personality?.financialAttitude ?? 'NULL'}) BETWEEN df.financialAttitude.min AND df.financialAttitude.max THEN true ELSE false END,
        'honesty', CASE WHEN df.honesty IS NULL OR (${datingProfile.personality?.honesty ?? 'NULL'}) BETWEEN df.honesty.min AND df.honesty.max THEN true ELSE false END,
        'kindness', CASE WHEN df.kindness IS NULL OR (${datingProfile.personality?.kindess ?? 'NULL'}) BETWEEN df.kindness.min AND df.kindness.max THEN true ELSE false END,
        'generosity', CASE WHEN df.generousity IS NULL OR (${datingProfile.personality?.generousity ?? 'NULL'}) BETWEEN df.generousity.min AND df.generousity.max THEN true ELSE false END,
        'uprightness', CASE WHEN df.uprightness IS NULL OR (${datingProfile.personality?.uprightness ?? 'NULL'}) BETWEEN df.uprightness.min AND df.uprightness.max THEN true ELSE false END,
        'politicalView', CASE WHEN df.politicalView IS NULL OR (${datingProfile.personality?.politicalView ?? 'NULL'}) BETWEEN df.politicalView.min AND df.politicalView.max THEN true ELSE false END,
        'dressSense', CASE WHEN df.dressSense IS NULL OR (
          (u.gender = 'man' AND (pers.dressSenseMen IS NULL OR (${datingProfile.personality?.dressSenseMen ?? 'NULL'}) BETWEEN pers.dressSenseMen.min AND pers.dressSenseMen.max)) OR
          (u.gender = 'woman' AND (pers.dressSenseWomen IS NULL OR (${datingProfile.personality?.dressSenseWomen ?? 'NULL'}) BETWEEN pers.dressSenseWomen.min AND pers.dressSenseWomen.max))
        ) THEN true ELSE false END,
        'relationshipBelief', CASE WHEN df.relationshipBelief IS NULL OR (${datingProfile.relationship?.belief ?? 'NULL'}) BETWEEN df.relationshipBelief.min AND df.relationshipBelief.max THEN true ELSE false END,
        'intimacyBelief', CASE WHEN df.intimacyBelief IS NULL OR (${datingProfile.relationship?.intimacyBelief ?? 'NULL'}) BETWEEN df.intimacyBelief.min AND df.intimacyBelief.max THEN true ELSE false END,
        'parentingStyle', CASE WHEN df.parentingStyle IS NULL OR (${datingProfile.relationship?.parentingStyle ?? 'NULL'}) BETWEEN df.parentingStyle.min AND df.parentingStyle.max THEN true ELSE false END,
        'maritalTimeline', CASE WHEN df.maritalTimeline IS NULL OR (${datingProfile.relationship?.maritalTimeline ?? 'NULL'}) BETWEEN df.maritalTimeline.min AND df.maritalTimeline.max THEN true ELSE false END,
        'relocateForMarriage', CASE WHEN df.relocateForMarriage IS NULL OR df.relocateForMarriage?.length = 0 OR '${datingProfile.relationship?.relocateForMarriage ?? 'NULL'}' = ANY(df.relocateForMarriage) THEN true ELSE false END,
        'wantChildren', CASE WHEN df.wantChildren IS NULL OR (${datingProfile.relationship?.wantChildren ?? 'NULL'}) BETWEEN df.wantChildren.min AND df.wantChildren.max THEN true ELSE false END,
        'spouseFriendship', CASE WHEN df.spouseFriendship IS NULL OR (${datingProfile.relationship?.spouseFriendship ?? 'NULL'}) BETWEEN df.spouseFriendship.min AND df.spouseFriendship.max THEN true ELSE false END
      )
    ) as compatibility_analysis`;
  }

  private buildCompatibilityScoreWithAnalysis(
    options: CompatibilityScoreWithAnalysisOptions,
  ): string {
    const { datingProfile, condition, alias, hasTrueFynd } = options;

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
      userIsIdVerified,
      userBeliefAstronology,
      userHeight,
      userMeasuredHeight,
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
      userDressSenseMen,
      userDressSenseWomen,
      userRelationshipBelief,
      userIntimacyBelief,
      userParentingStyle,
      userMaritalTimeline,
      userRelocateForMarriage,
      userWantChildren,
      userSpouseFriendship,
    } = userData;

    if (hasTrueFynd) {
      // Return both score and analysis for TrueFynd users
      return `(
      CASE 
          WHEN ${condition} AND df.id IS NOT NULL THEN
            json_build_object(
              'score', (
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
                        CASE WHEN ${userIsIdVerified} = true THEN 100 ELSE 0 END
                      ELSE 100 
                    END * 0.1) +
                    (CASE 
                      WHEN df.excludeAstroBelievers = true AND ${userBeliefAstronology} = true THEN 0
                      ELSE 100 
                    END * 0.05)
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
                    END * 0.2) +
                    (CASE 
                      WHEN df.isHeightVerified = true AND ${userMeasuredHeight} IS NULL THEN 0
                ELSE 100 
              END * 0.1)
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
                      WHEN df.dressSense IS NOT NULL THEN 
                        CASE 
                          WHEN u.gender = 'man' AND pers.dressSenseMen IS NOT NULL AND ${userDressSenseMen} IS NOT NULL THEN 
                            CASE WHEN ${userDressSenseMen} BETWEEN pers.dressSenseMen.min AND pers.dressSenseMen.max THEN 100 ELSE 0 END
                          WHEN u.gender = 'woman' AND pers.dressSenseWomen IS NOT NULL AND ${userDressSenseWomen} IS NOT NULL THEN 
                            CASE WHEN ${userDressSenseWomen} BETWEEN pers.dressSenseWomen.min AND pers.dressSenseWomen.max THEN 100 ELSE 0 END
                          ELSE 100
                        END
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
                    END * 0.1) +
                    (CASE 
                      WHEN df.relocateForMarriage?.length > 0 THEN 
                        CASE WHEN '${userRelocateForMarriage}' = ANY(df.relocateForMarriage) THEN 100 ELSE 0 END
                      ELSE 100 
                    END * 0.1) +
                    (CASE 
                      WHEN df.wantChildren IS NOT NULL AND ${userWantChildren} IS NOT NULL THEN 
                        CASE WHEN ${userWantChildren} BETWEEN df.wantChildren.min AND df.wantChildren.max THEN 100 ELSE 0 END
                      ELSE 100 
                    END * 0.1) +
                    (CASE 
                      WHEN df.spouseFriendship IS NOT NULL AND ${userSpouseFriendship} IS NOT NULL THEN 
                        CASE WHEN ${userSpouseFriendship} BETWEEN df.spouseFriendship.min AND df.spouseFriendship.max THEN 100 ELSE 0 END
                      ELSE 100 
                    END * 0.1)
                  )
                )::int
              ),
              'analysis', json_build_object(
                'gender', CASE WHEN '${userGender}' = ANY(df.gendersInterestedIn) THEN true ELSE false END,
                'intention', CASE WHEN '${userIntention}' = ANY(df.intentions) THEN true ELSE false END,
                'age', CASE WHEN df.age IS NULL OR EXTRACT(YEAR FROM AGE('${userDob}')) BETWEEN df.age.min AND df.age.max THEN true ELSE false END,
                'education', CASE WHEN df.education IS NULL OR ${userEducation} BETWEEN df.education.min AND df.education.max THEN true ELSE false END,
                'maritalStatus', CASE WHEN df.maritalStatus IS NULL OR df.maritalStatus?.length = 0 OR '${userMaritalStatus}' = ANY(df.maritalStatus) THEN true ELSE false END,
                'primaryGuidePhilosophy', CASE WHEN df.primaryGuidePhilosophy IS NULL OR df.primaryGuidePhilosophy?.length = 0 OR '${userPrimaryGuidePhilosophy}' = ANY(df.primaryGuidePhilosophy) THEN true ELSE false END,
                'diet', CASE WHEN df.diet IS NULL OR df.diet?.length = 0 OR '${userDiet}' = ANY(df.diet) THEN true ELSE false END,
                'profession', CASE WHEN df.restrictToProfessions IS NULL OR df.restrictToProfessions?.length = 0 OR ${userProfession} = ANY(df.restrictToProfessions) THEN true ELSE false END,
                'professionExcluded', CASE WHEN df.excludeProfessions IS NULL OR df.excludeProfessions?.length = 0 OR ${userProfession} != ALL(df.excludeProfessions) THEN true ELSE false END,
                'location', CASE WHEN df.basedInCountries IS NULL OR df.basedInCountries?.length = 0 OR dlp.country_id = ANY(df.basedInCountries) THEN true ELSE false END,
                'originCountry', CASE WHEN df.originCountries IS NULL OR df.originCountries?.length = 0 OR ${userOriginCountry} = ANY(df.originCountries) THEN true ELSE false END,
                'grewUpIn', CASE WHEN df.grewupCountries IS NULL OR df.grewupCountries?.length = 0 OR ${userGrewUpIn} = ANY(df.grewupCountries) THEN true ELSE false END,
                'nationality', CASE WHEN df.nationalitiesOf IS NULL OR df.nationalitiesOf?.length = 0 OR EXISTS(SELECT 1 FROM user_nationalities un WHERE un.user_id = u.id AND un.nationality_id = ANY(df.nationalitiesOf)) THEN true ELSE false END,
                'ethnicity', CASE WHEN df.ethniticities IS NULL OR df.ethniticities?.length = 0 OR ${userEthnicity} = ANY(df.ethniticities) THEN true ELSE false END,
                'religion', CASE WHEN df.religions IS NULL OR df.religions?.length = 0 OR ${userReligion} IN (SELECT id FROM religion_sects WHERE religion_id = ANY(df.religions)) THEN true ELSE false END,
                'religionSect', CASE WHEN df.religionsSects IS NULL OR df.religionsSects?.length = 0 OR ${userReligionSect} = ANY(df.religionsSects) THEN true ELSE false END,
                'religiousLevel', CASE WHEN df.religiousLevel IS NULL OR ${userReligiousLevel} BETWEEN df.religiousLevel.min AND df.religiousLevel.max THEN true ELSE false END,
                'interests', CASE WHEN df.interests IS NULL OR df.interests?.length = 0 OR EXISTS(SELECT 1 FROM user_interests ui WHERE ui.user_id = u.id AND ui.interest_id = ANY(df.interests)) THEN true ELSE false END,
                'children', CASE WHEN df.hasChildren IS NULL OR ${userHasChildren} BETWEEN df.hasChildren.min AND df.hasChildren.max THEN true ELSE false END,
                'smoking', CASE WHEN df.smoking IS NULL OR ${userSmoking} BETWEEN df.smoking.min AND df.smoking.max THEN true ELSE false END,
                'drinking', CASE WHEN df.drinking IS NULL OR ${userDrinking} BETWEEN df.drinking.min AND df.drinking.max THEN true ELSE false END,
                'drug', CASE WHEN df.drug IS NULL OR ${userDrug} BETWEEN df.drug.min AND df.drug.max THEN true ELSE false END,
                'faceVerified', CASE WHEN df.isFaceVerified = false OR ${userIsFaceVerified} = true THEN true ELSE false END,
                'idVerified', CASE WHEN df.isIdVerified = false OR ${userIsIdVerified} = true THEN true ELSE false END,
                'astrology', CASE WHEN df.excludeAstroBelievers = false OR ${userBeliefAstronology} = false THEN true ELSE false END,
                'height', CASE WHEN df.heightCm IS NULL OR ${userHeight} BETWEEN df.heightCm.min AND df.heightCm.max THEN true ELSE false END,
                'heightVerified', CASE WHEN df.isHeightVerified = false OR ${userMeasuredHeight} IS NOT NULL THEN true ELSE false END,
                'bodyType', CASE WHEN df.bodyType IS NULL OR ${userBodyType} BETWEEN df.bodyType.min AND df.bodyType.max THEN true ELSE false END,
                'rhesusFactor', CASE WHEN df.rhesusFactorIs IS NULL OR '${userRhesusFactor}' = df.rhesusFactorIs THEN true ELSE false END,
                'sickleCellTrait', CASE WHEN df.excludeSickleCellTrait = false OR ${userSickleCellTrait} = false THEN true ELSE false END,
                'sickleCellDisease', CASE WHEN df.excludeSickleCellDisease = false OR ${userSickleCellDisease} = false THEN true ELSE false END,
                'thalassemiaTrait', CASE WHEN df.excludeThalassemiaTrait = false OR ${userThalassemiaTrait} = false THEN true ELSE false END,
                'taySachsTrait', CASE WHEN df.excludeTaySachsTrait = false OR ${userTaySachsTrait} = false THEN true ELSE false END,
                'cysticFibrosisTrait', CASE WHEN df.excludeCysticFibrosisTrait = false OR ${userCysticFibrosisTrait} = false THEN true ELSE false END,
                'g6pdDeficiency', CASE WHEN df.excludeG6pdDeficiency = false OR ${userG6pdDeficiency} = false THEN true ELSE false END,
                'financialAttitude', CASE WHEN df.financialAttitude IS NULL OR ${userFinancialAttitude} BETWEEN df.financialAttitude.min AND df.financialAttitude.max THEN true ELSE false END,
                'honesty', CASE WHEN df.honesty IS NULL OR ${userHonesty} BETWEEN df.honesty.min AND df.honesty.max THEN true ELSE false END,
                'kindness', CASE WHEN df.kindness IS NULL OR ${userKindness} BETWEEN df.kindness.min AND df.kindness.max THEN true ELSE false END,
                'generosity', CASE WHEN df.generousity IS NULL OR ${userGenerosity} BETWEEN df.generousity.min AND df.generousity.max THEN true ELSE false END,
                'uprightness', CASE WHEN df.uprightness IS NULL OR ${userUprightness} BETWEEN df.uprightness.min AND df.uprightness.max THEN true ELSE false END,
                'politicalView', CASE WHEN df.politicalView IS NULL OR ${userPoliticalView} BETWEEN df.politicalView.min AND df.politicalView.max THEN true ELSE false END,
                'dressSense', CASE WHEN df.dressSense IS NULL OR (
                  (u.gender = 'man' AND (pers.dressSenseMen IS NULL OR ${userDressSenseMen} BETWEEN pers.dressSenseMen.min AND pers.dressSenseMen.max)) OR
                  (u.gender = 'woman' AND (pers.dressSenseWomen IS NULL OR ${userDressSenseWomen} BETWEEN pers.dressSenseWomen.min AND pers.dressSenseWomen.max))
                ) THEN true ELSE false END,
                'relationshipBelief', CASE WHEN df.relationshipBelief IS NULL OR ${userRelationshipBelief} BETWEEN df.relationshipBelief.min AND df.relationshipBelief.max THEN true ELSE false END,
                'intimacyBelief', CASE WHEN df.intimacyBelief IS NULL OR ${userIntimacyBelief} BETWEEN df.intimacyBelief.min AND df.intimacyBelief.max THEN true ELSE false END,
                'parentingStyle', CASE WHEN df.parentingStyle IS NULL OR ${userParentingStyle} BETWEEN df.parentingStyle.min AND df.parentingStyle.max THEN true ELSE false END,
                'maritalTimeline', CASE WHEN df.maritalTimeline IS NULL OR ${userMaritalTimeline} BETWEEN df.maritalTimeline.min AND df.maritalTimeline.max THEN true ELSE false END,
                'relocateForMarriage', CASE WHEN df.relocateForMarriage IS NULL OR df.relocateForMarriage?.length = 0 OR '${userRelocateForMarriage}' = ANY(df.relocateForMarriage) THEN true ELSE false END,
                'wantChildren', CASE WHEN df.wantChildren IS NULL OR ${userWantChildren} BETWEEN df.wantChildren.min AND df.wantChildren.max THEN true ELSE false END,
                'spouseFriendship', CASE WHEN df.spouseFriendship IS NULL OR ${userSpouseFriendship} BETWEEN df.spouseFriendship.min AND df.spouseFriendship.max THEN true ELSE false END
              )
            )
          ELSE NULL
        END
      ) as ${alias}`;
    } else {
      // Return only score for non-TrueFynd users
      return this.buildCompatibilityScore({ datingProfile, condition, alias });
    }
  }

  private buildCompatibilityScore(options: CompatibilityScoreOptions): string {
    const { datingProfile, condition, alias } = options;

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
      userIsIdVerified,
      userBeliefAstronology,
      userHeight,
      userMeasuredHeight,
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
      userDressSenseMen,
      userDressSenseWomen,
      userRelationshipBelief,
      userIntimacyBelief,
      userParentingStyle,
      userMaritalTimeline,
      userRelocateForMarriage,
      userWantChildren,
      userSpouseFriendship,
    } = userData;

    return `(
      CASE 
        WHEN ${condition} AND df.id IS NOT NULL THEN
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
                  CASE WHEN ${userIsIdVerified} = true THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1) +
              (CASE 
                WHEN df.excludeAstroBelievers = true AND ${userBeliefAstronology} = true THEN 0
                ELSE 100 
              END * 0.05)
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
              END * 0.2) +
              (CASE 
                WHEN df.isHeightVerified = true AND ${userMeasuredHeight} IS NULL THEN 0
                ELSE 100 
              END * 0.1)
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
                WHEN df.dressSense IS NOT NULL THEN 
                  CASE 
                    WHEN u.gender = 'man' AND pers.dressSenseMen IS NOT NULL AND ${userDressSenseMen} IS NOT NULL THEN 
                      CASE WHEN ${userDressSenseMen} BETWEEN pers.dressSenseMen.min AND pers.dressSenseMen.max THEN 100 ELSE 0 END
                    WHEN u.gender = 'woman' AND pers.dressSenseWomen IS NOT NULL AND ${userDressSenseWomen} IS NOT NULL THEN 
                      CASE WHEN ${userDressSenseWomen} BETWEEN pers.dressSenseWomen.min AND pers.dressSenseWomen.max THEN 100 ELSE 0 END
                    ELSE 100
                  END
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
              END * 0.1) +
              (CASE 
                WHEN df.relocateForMarriage?.length > 0 THEN 
                  CASE WHEN '${userRelocateForMarriage}' = ANY(df.relocateForMarriage) THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1) +
              (CASE 
                WHEN df.wantChildren IS NOT NULL AND ${userWantChildren} IS NOT NULL THEN 
                  CASE WHEN ${userWantChildren} BETWEEN df.wantChildren.min AND df.wantChildren.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1) +
              (CASE 
                WHEN df.spouseFriendship IS NOT NULL AND ${userSpouseFriendship} IS NOT NULL THEN 
                  CASE WHEN ${userSpouseFriendship} BETWEEN df.spouseFriendship.min AND df.spouseFriendship.max THEN 100 ELSE 0 END
                ELSE 100 
              END * 0.1)
            )
          )
        ELSE NULL
      END
    )::int as ${alias}`;
  }

  async addProfile(
    authUser: AuthenticatedUser,
    payload: CreateDatingProfileDto,
  ): Promise<void> {
    const user = await this.userRepo.findOneOrFail({
      id: authUser.userId!,
    });

    const datingProfile = this.datingProfileRepo.create({
      ...payload,
      user,
    });
    await this.em.persistAndFlush(datingProfile);
  }

  async updateProfile(
    authUser: AuthenticatedUser,
    payload: UpdateDatingProfileDto,
  ): Promise<void> {
    const datingProfile = await this.datingProfileRepo.findOneOrFail({
      user: this.userRepo.getReference(authUser.userId!),
    });

    this.em.assign(datingProfile, payload);
    await this.em.persistAndFlush(datingProfile);
  }

  async addPersonality(
    authUser: AuthenticatedUser,
    payload: CreateDatingPersonalityDto,
  ): Promise<void> {
    const datingProfile = await this.datingProfileRepo.findOneOrFail({
      user: this.userRepo.getReference(authUser.userId!),
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
    authUser: AuthenticatedUser,
    payload: UpdateDatingPersonalityDto,
  ): Promise<void> {
    const datingProfile = await this.datingProfileRepo.findOneOrFail(
      {
        user: this.userRepo.getReference(authUser.userId!),
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
    authUser: AuthenticatedUser,
    payload: CreateDatingRelationshipDto,
  ): Promise<void> {
    const datingProfile = await this.datingProfileRepo.findOneOrFail({
      user: this.userRepo.getReference(authUser.userId!),
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
    authUser: AuthenticatedUser,
    payload: UpdateDatingRelationshipDto,
  ): Promise<void> {
    const datingProfile = await this.datingProfileRepo.findOneOrFail(
      {
        user: this.userRepo.getReference(authUser.userId!),
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

  async addLocationProfile(
    authUser: AuthenticatedUser,
    payload: CreateLocationProfileDto,
  ): Promise<void> {
    const userId = authUser.userId!;
    const datingProfile = await this.datingProfileRepo.findOneOrFail(
      {
        user: this.userRepo.getReference(userId),
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
      user: this.userRepo.getReference(userId),
      country,
      datingProfile,
      point,
      location,
      type: payload.type,
      bio: payload.bio,
    });

    await this.em.persistAndFlush(dateLocationProfile);
  }

  async updateProfileLocation(
    authUser: AuthenticatedUser,
    payload: UpdateProfileLocationDto,
  ) {
    const { address, location, pinLocation, locationProfileId } = payload;
    const datingProfile = await this.datingProfileRepo.findOneOrFail(
      {
        user: this.userRepo.getReference(authUser.userId!),
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
    authUser: AuthenticatedUser,
    payload: CreateLocationProfileMediaDto,
  ): Promise<void> {
    const { user, pushToken } = await this.authService.fetchAuthUser(
      authUser.sub,
    );

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
  }

  async handleMediaUpdate(
    payload: UploadPictureResponseObjType,
  ): Promise<void> {
    const { profileId } = payload;
    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail(
      {
        id: profileId,
      },
      { populate: ['media'] },
    );

    await this.updateMediaForProfile(
      payload,
      locationProfile,
      'datingLocationProfile',
    );
  }

  async updateLocationProfileMedia(
    authUser: AuthenticatedUser,
    payload: UpdateMediaDto,
  ): Promise<void> {
    const auth = await this.authService.fetchAuthUser(authUser.sub);
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
    authUser: AuthenticatedUser,
    payload: RemoveMediaDto,
  ): Promise<void> {
    const { mediaId, locationProfileId } = payload;

    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail(
      {
        id: locationProfileId,
        user: this.userRepo.getReference(authUser.userId!),
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

    const isFree = !hasControl && !hasTrueFynd;

    return { hasControl, hasTrueFynd, hasPremium, isFree };
  }

  async updateFilter(
    authUser: AuthenticatedUser,
    payload: UpdateDateFilterDto,
  ): Promise<void> {
    const { locationProfile: locationProfileId } = payload;
    const userId = authUser.userId!;
    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail(
      {
        id: locationProfileId,
        user: this.userRepo.getReference(userId),
      },
      { populate: ['datingFilter', 'datingProfile'] },
    );

    const { hasPremium } = this.checkSubscriptions(
      locationProfile.datingProfile,
    );

    const allowedFilters = this.reduceToAllowedFilters(payload, hasPremium);

    if (!locationProfile.datingFilter) {
      const datingFilter = this.datingFilterRepo.create({
        user: this.userRepo.getReference(userId),
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

  async findPotentialMatches<T = DatingMatchResponse>(
    authUser: AuthenticatedUser,
    profileId?: string,
  ): Promise<T[]> {
    const locationProfile = await this.datingLocationProfileRepo.findOneOrFail(
      { id: profileId, user: this.userRepo.getReference(authUser.userId!) },
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

    const coordinates = point?.coordinates;
    const longitude: number | undefined =
      coordinates && Array.isArray(coordinates) && coordinates.length >= 2
        ? coordinates[0]
        : undefined;
    const latitude: number | undefined =
      coordinates && Array.isArray(coordinates) && coordinates.length >= 2
        ? coordinates[1]
        : undefined;

    const { hasPremium, hasTrueFynd } = this.checkSubscriptions(datingProfile);

    const filters = this.reduceToAllowedFilters(datingFilter, hasPremium);

    const MAX_MILE = 500;

    const maxDistanceMile = filters?.maxDistanceMile ?? 0;

    const interactedUserIds: string[] = [];

    const qb = this.datingLocationProfileRepo
      .createQueryBuilder('dlp')
      .select(['dlp.*', 'dp.*', 'u.*'])
      .join('dlp.datingProfile', 'dp')
      .join('dp.user', 'u')
      .leftJoin('dp.datingFilter', 'df')
      .leftJoin('dp.personality', 'pers')
      .leftJoin('dp.biol', 'biol')
      .leftJoin('dp.relationship', 'rel')
      .where('dlp.id != ?', [locationProfile.id]);

    if (interactedUserIds.length > 0) {
      qb.andWhere('u.id NOT IN (?)', [interactedUserIds]);
    }

    // todo: remove some options from each category of filter to maike it more specific e.g dress sense and diet should include only hijab etc and halal once you know they are muslim and primary guide philiposophy is religion
    // this is needed in onboarding and not in the filter section

    this.applyDatingBaseProfileFilters(qb, filters);

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

    if (hasTrueFynd) {
      const compatibilityData = this.buildCompatibilityScoreWithAnalysis({
        datingProfile,
        condition: '1=1',
        alias: 'compatibility_data',
        hasTrueFynd: true,
      });
      qb.addSelect(compatibilityData);
    } else {
      const compatibilityScore = this.buildCompatibilityScore({
        datingProfile,
        condition:
          'dlp.trueFyndEndsAt IS NOT NULL AND dlp.trueFyndEndsAt > NOW()',
        alias: 'compatibility_score',
      });
      qb.addSelect(compatibilityScore);
    }

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

    if (hasTrueFynd) {
      qb.orderBy({ 'compatibility_data->score': 'desc' });
    } else {
      if (point && longitude && latitude) {
        qb.orderBy({ distance: 'asc' });
      } else {
        qb.orderBy({ 'u.createdAt': 'desc' });
      }
    }

    qb.limit(50);
    return (await qb.getResultList()) as T[];
  }
  // note: profile completion monitor should be handled on client - just warn them
  // note: screenshot not allowed on client is important - especially for health and safety reasons
  // next:
  // anchor
  // call audio and video calls
  // events - leave out of mvp - can use event brite -- use notification center
  // how to handle measured fields e.g height, body type.
  // todo next: preference and security features - hide from contact, select trusted contacts for date security
  // testing
  // handle potential matches response to only return usable fields

  applyDatingBaseProfileFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
  ): void {
    super.applyBaseProfileFilters(qb, filters);
  }

  applyDateProfileFilters(
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

  /**
   * Creates a QueryBuilder for users with dating profiles and anchor relationships
   * Used by anchor services for matching operations
   */
  public createUserWithDatingProfileQueryBuilder(anchorId: string) {
    return this.datingLocationProfileRepo
      .createQueryBuilder('dlp')
      .select(['u.*', 'dp.*', 'pers.*'])
      .join('dlp.datingProfile', 'dp')
      .join('dp.user', 'u')
      .leftJoinAndSelect('u.anchor', 'anchor')
      .leftJoinAndSelect('dp.personality', 'pers')
      .where('u.anchor.id = ?', [anchorId]);
  }

  // todo: move to base profile filter
  // note: consider app spotlighting and how that affects various subscriptions especially TF
  applyLocationFilters(
    qb: QueryBuilder<any>,
    filters: Omit<UpdateDateFilterDto, 'locationProfile'>,
    point: GeoPoint | undefined,
    longitude: number | undefined,
    latitude: number | undefined,
    maxDistanceMile: number,
    maxMile: number,
  ): void {
    if (
      filters.basedInCountries &&
      Array.isArray(filters.basedInCountries) &&
      filters.basedInCountries.length > 0
    ) {
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

  public applyPersonalityFilters(
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

    if (
      filters.uprightness &&
      typeof filters.uprightness === 'object' &&
      'min' in filters.uprightness &&
      'max' in filters.uprightness &&
      filters.uprightness.min !== undefined &&
      filters.uprightness.max !== undefined
    ) {
      qb.andWhere('pers.uprightness BETWEEN ? AND ?', [
        filters.uprightness.min,

        filters.uprightness.max,
      ]);
    }

    if (
      filters.politicalView &&
      typeof filters.politicalView === 'object' &&
      'min' in filters.politicalView &&
      'max' in filters.politicalView &&
      filters.politicalView.min !== undefined &&
      filters.politicalView.max !== undefined
    ) {
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
}
