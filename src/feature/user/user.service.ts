import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { User } from './entities/user/user.entity';
import { EmailQueueService } from 'src/system/queue/email/email.queue';
import { Auth } from '../auth/entities/auth.entity';
import { Anchor } from './entities/user/anchor.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Interest } from './entities/user/character/interest.entity';
import { Country } from '../location/entities/country.entity';
import { Profession } from './entities/user/character/profession.entity';
import { ReligionSect } from './entities/user/character/religion-sect.entity';
import { Ethnic } from '../location/entities/ethnic.entity';
import {
  CreateDateProfileDto,
  UpdateDateProfileDto,
} from './dto/profile/date-profile.dto';
import { UserBiol } from './entities/user/user-biol.entity';
import { Personality } from './entities/user/character/personality.entity';
import { Relationship } from './entities/user/relationship.entity';
import { DateLocationProfile } from './entities/profile/date-location.profile';
import { DateProfile } from './entities/profile/date.profile';
import {
  CreatePersonalityDto,
  UpdatePersonalityDto,
} from './dto/personality.dto';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
} from './dto/relationship.dto';
import { CreateUserBiolDto, UpdateUserBiolDto } from './dto/user-biol.dto';
import { CreateDateLocationProfileDto } from './dto/profile/date-location-profile.dto';
@Injectable()
export class UserService {
  constructor(
    private readonly em: EntityManager,
    private readonly emailQueueService: EmailQueueService,
    @InjectRepository(Auth) private authRepo: EntityRepository<Auth>,
    @InjectRepository(User) private userRepo: EntityRepository<User>,
    @InjectRepository(UserBiol)
    private userBiolRepo: EntityRepository<UserBiol>,
    @InjectRepository(Personality)
    private personalityRepo: EntityRepository<Personality>,
    @InjectRepository(Relationship)
    private relationshipRepo: EntityRepository<Relationship>,
    @InjectRepository(DateLocationProfile)
    private dateLocationProfileRepo: EntityRepository<DateLocationProfile>,
    @InjectRepository(DateProfile)
    private dateProfileRepo: EntityRepository<DateProfile>,
    @InjectRepository(Interest)
    private interestRepo: EntityRepository<Interest>,
    @InjectRepository(Country) private countryRepo: EntityRepository<Country>,
    @InjectRepository(Profession)
    private professionRepo: EntityRepository<Profession>,
    @InjectRepository(ReligionSect)
    private religionSectRepo: EntityRepository<ReligionSect>,
    @InjectRepository(Ethnic) private ethnicRepo: EntityRepository<Ethnic>,
    @InjectRepository(Anchor) private anchorRepo: EntityRepository<Anchor>,
  ) {}

  private async fetchAuthUser(
    authId: string,
    authWithUser = false,
  ): Promise<User> {
    if (authWithUser) {
      const auth = await this.authRepo.findOneOrFail(
        { id: authId },
        { populate: ['user'] },
      );
      if (!auth.user)
        throw new BadRequestException('This auth is not linked to a user yet.');

      return auth.user;
    }

    return await this.userRepo.findOneOrFail({ auth: authId });
  }

  private async handleUserRelations(
    payload: CreateUserDto | UpdateUserDto,
    user: User,
  ): Promise<void> {
    if (payload.professionId) {
      const profession = await this.professionRepo.findOneOrFail({
        id: payload.professionId,
      });
      user.profession = profession;
    }

    if (payload.religionSectId) {
      const religionSect = await this.religionSectRepo.findOneOrFail({
        id: payload.religionSectId,
      });
      user.religionSect = religionSect;
    }

    if (payload.ethnicId) {
      const ethnic = await this.ethnicRepo.findOneOrFail({
        id: payload.ethnicId,
      });
      user.ethnicity = ethnic;
    }

    if (payload.originCountryId) {
      const country = await this.countryRepo.findOneOrFail({
        id: payload.originCountryId,
      });
      user.originCountry = country;
    }

    if (payload.grewUpInId) {
      const country = await this.countryRepo.findOneOrFail({
        id: payload.grewUpInId,
      });
      user.grewUpIn = country;
    }

    for (const interestId of payload.interestIds || []) {
      const interest = await this.interestRepo.findOneOrFail({
        id: interestId,
      });
      user.interests.add(interest);
    }

    for (const nationalityId of payload.nationalityIds || []) {
      const country = await this.countryRepo.findOneOrFail({
        id: nationalityId,
      });
      user.nationalities.add(country);
    }
  }

  private sortUserDtoFields<T extends CreateUserDto | UpdateUserDto>(
    payload: T,
  ) {
    const {
      interestIds,
      nationalityIds,
      professionId,
      religionSectId,
      ethnicId,
      originCountryId,
      grewUpInId,
      ...data
    } = payload;

    return {
      data: data as Omit<
        T,
        | 'interestIds'
        | 'nationalityIds'
        | 'professionId'
        | 'religionSectId'
        | 'ethnicId'
        | 'originCountryId'
        | 'grewUpInId'
      >,
      relationFileds: {
        interestIds,
        nationalityIds,
        professionId,
        religionSectId,
        ethnicId,
        originCountryId,
        grewUpInId,
      },
    };
  }

  // base onboard
  async onboard(authId: string, payload: CreateUserDto): Promise<void> {
    const { relationFileds, data } = this.sortUserDtoFields(payload);
    const user = this.userRepo.create({
      ...data,
      auth: this.authRepo.getReference(authId),
    });

    await this.handleUserRelations(relationFileds, user);
    await this.em.persistAndFlush(user);
    await this.emailQueueService.sendWelcomeEmail({
      to: user.auth.email,
      subject: 'Welcome to Our Service',
    });
    // todo: updat welcome email template
  }

  async updateBase(authId: string, payload: UpdateUserDto): Promise<void> {
    const user = await this.fetchAuthUser(authId);
    const { relationFileds, data } = this.sortUserDtoFields(payload);

    await this.handleUserRelations(relationFileds, user);
    this.em.assign(user, { ...data });
    await this.em.flush();
  }

  async dateSignUp(
    authId: string,
    payload: CreateDateProfileDto,
  ): Promise<void> {
    const user = await this.fetchAuthUser(authId);
    // const dateLocationProfile = this.dateLocationProfileRepo.create({
    //   ...payload.locationProfiles,
    //   user,
    // });

    const dateProfile = this.dateProfileRepo.create({
      ...payload,
      user,
    });
    await this.em.persistAndFlush(dateProfile);
  }

  async dateProfileUpdate(
    authId: string,
    payload: UpdateDateProfileDto,
  ): Promise<void> {
    const user = await this.fetchAuthUser(authId);
    const dateProfile = await this.dateProfileRepo.findOneOrFail({
      user,
    });

    this.em.assign(dateProfile, payload);
    await this.em.persistAndFlush(dateProfile);
  }

  async addDatePersonality(
    authId: string,
    payload: CreatePersonalityDto,
  ): Promise<void> {
    const user = await this.fetchAuthUser(authId);
    const dateProfile = await this.dateProfileRepo.findOneOrFail({
      user,
    });

    if (dateProfile?.personality) {
      throw new BadRequestException(
        'Personality already exists for this user.',
      );
    }

    const datePersonality = this.personalityRepo.create({
      ...payload,
      dateProfile,
    });

    await this.em.persist(datePersonality);
    dateProfile.personality = datePersonality;
    await this.em.flush();
  }

  async updateDatePersonality(
    authId: string,
    payload: UpdatePersonalityDto,
  ): Promise<void> {
    const user = await this.fetchAuthUser(authId);

    const dateProfile = await this.dateProfileRepo.findOneOrFail(
      {
        user,
      },
      { populate: ['personality'] },
    );

    if (!dateProfile?.personality) {
      throw new BadRequestException(
        'Personality does not exist for this user.',
      );
    }

    this.em.assign(dateProfile.personality, payload);
    await this.em.persistAndFlush(dateProfile.personality);
  }

  async addDateRelationship(
    authId: string,
    payload: CreateRelationshipDto,
  ): Promise<void> {
    const user = await this.fetchAuthUser(authId);
    const dateProfile = await this.dateProfileRepo.findOneOrFail({
      user,
    });

    if (dateProfile?.relationship) {
      throw new BadRequestException(
        'Relationship already exists for this user.',
      );
    }

    const dateRelationship = this.relationshipRepo.create({
      ...payload,
      dateProfile,
    });

    await this.em.persist(dateRelationship);
    dateProfile.relationship = dateRelationship;
    await this.em.flush();
  }

  async updateDateRelationship(
    authId: string,
    payload: UpdateRelationshipDto,
  ): Promise<void> {
    const user = await this.fetchAuthUser(authId);

    const dateProfile = await this.dateProfileRepo.findOneOrFail(
      {
        user,
      },
      { populate: ['relationship'] },
    );

    if (!dateProfile?.relationship) {
      throw new BadRequestException(
        'Relationship does not exist for this user.',
      );
    }

    this.em.assign(dateProfile.relationship, payload);
    await this.em.persistAndFlush(dateProfile.relationship);
  }

  async addUserBiol(authId: string, payload: CreateUserBiolDto): Promise<void> {
    const user = await this.fetchAuthUser(authId);

    const dateProfile = await this.dateProfileRepo.findOneOrFail({
      user,
    });

    if (dateProfile?.biol) {
      throw new BadRequestException('Biol already exists for this user.');
    }

    const userBiol = this.userBiolRepo.create({
      ...payload,
      dateProfile,
    });

    await this.em.persist(userBiol);
    dateProfile.biol = userBiol;
    await this.em.flush();
  }

  async updateUserBiol(
    authId: string,
    payload: UpdateUserBiolDto,
  ): Promise<void> {
    const user = await this.fetchAuthUser(authId);

    const dateProfile = await this.dateProfileRepo.findOneOrFail(
      {
        user,
      },
      { populate: ['biol'] },
    );

    if (!dateProfile?.biol) {
      throw new BadRequestException(
        'Relationship does not exist for this user.',
      );
    }

    this.em.assign(dateProfile.biol, payload);
    await this.em.persistAndFlush(dateProfile.biol);
  }

  async addDateLocationProfile(
    authId: string,
    payload: CreateDateLocationProfileDto,
  ): Promise<void> {
    const user = await this.fetchAuthUser(authId);

    const dateProfile = await this.dateProfileRepo.findOneOrFail({
      user,
    });

    if (dateProfile?.biol) {
      throw new BadRequestException('Biol already exists for this user.');
    }

    const userBiol = this.userBiolRepo.create({
      ...payload,
      dateProfile,
    });

    await this.em.persist(userBiol);
    dateProfile.biol = userBiol;
    await this.em.flush();
  }

  async updateUserBiol(
    authId: string,
    payload: UpdateUserBiolDto,
  ): Promise<void> {
    const user = await this.fetchAuthUser(authId);

    const dateProfile = await this.dateProfileRepo.findOneOrFail(
      {
        user,
      },
      { populate: ['biol'] },
    );

    if (!dateProfile?.biol) {
      throw new BadRequestException(
        'Relationship does not exist for this user.',
      );
    }

    this.em.assign(dateProfile.biol, payload);
    await this.em.persistAndFlush(dateProfile.biol);
  }

  // friend or date onboard

  // should update handle files and id verification?

  // findLovers

  // subscribe

  // compatible match

  // deleteAcc
  // : anchor realm ?
  // like - one or many ?
  //  dont like
  // views
  // match
  // unmatch
  // chat
}
