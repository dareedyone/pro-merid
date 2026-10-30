import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AuthService } from '../../auth/auth.service';
import { GeoFallbackService } from '../../location/geo-fallback.service';
import { User } from '../../user/entities/user/user.entity';
import { FriendProfile } from '../entities/friend.profile';
import { FriendFilter } from '../entities/friend.filter';
import { FocusedIntention } from '../entities/focused-intention.entity';
import { Media } from '../../user/entities/media.entity';
import { Country } from '../../location/entities/country.entity';
import { Region } from '../../location/entities/region.entity';
import type {
  CreateFriendProfileDto,
  UpdateFriendProfileDto,
} from '../dtos/friend-profile.dto';
import type { UpdateFriendFilterDto } from '../dtos/friend-filter.dto';
import type { AuthenticatedUser } from 'src/common/types/request.types';
import { UserType } from 'src/common/types/enums/user.enum';

describe('FriendsService', () => {
  let service: FriendsService;
  let module: TestingModule;
  let mockEntityManager: any;
  let userRepo: any;
  let friendProfileRepo: any;
  let friendFilterRepo: any;
  let focusedIntentionRepo: any;
  let authService: any;
  let geoFallbackService: any;

  const mockAuthUser: AuthenticatedUser = {
    userId: 'user-123',
    sub: 'auth-123',
    role: UserType.USER,
  };

  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    const mockUserRepo = {
      findOneOrFail: jest.fn(),
    };

    const mockFriendProfileRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };

    const mockFriendFilterRepo = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const mockFocusedIntentionRepo = {
      find: jest.fn(),
    };

    const mockMediaRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const mockCountryRepo = {
      findOneOrFail: jest.fn(),
    };

    const mockRegionRepo = {
      findOneOrFail: jest.fn(),
    };

    const mockAuthService = {
      fetchAuthUser: jest.fn(),
    };

    const mockGeoFallbackService = {
      getLocationData: jest.fn(),
    };

    // Create a mock EntityManager that properly implements all methods
    mockEntityManager = {
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      persist: jest.fn().mockImplementation((entity) => entity),
      flush: jest.fn().mockResolvedValue(undefined),
      assign: jest.fn().mockImplementation((target, updates) => {
        Object.assign(target, updates);
        return target;
      }),
      find: jest.fn(),
      getConnection: jest.fn(),
    };

    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(FriendProfile),
          useValue: mockFriendProfileRepo,
        },
        {
          provide: getRepositoryToken(FriendFilter),
          useValue: mockFriendFilterRepo,
        },
        {
          provide: getRepositoryToken(FocusedIntention),
          useValue: mockFocusedIntentionRepo,
        },
        {
          provide: getRepositoryToken(Media),
          useValue: mockMediaRepo,
        },
        {
          provide: getRepositoryToken(Country),
          useValue: mockCountryRepo,
        },
        {
          provide: getRepositoryToken(Region),
          useValue: mockRegionRepo,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: GeoFallbackService,
          useValue: mockGeoFallbackService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    module = testingModule;
    service = module.get<FriendsService>(FriendsService);

    // Manually ensure EntityManager is set (in case injection didn't work properly)
    (service as any).em = mockEntityManager;

    userRepo = module.get(getRepositoryToken(User));
    friendProfileRepo = module.get(getRepositoryToken(FriendProfile));
    friendFilterRepo = module.get(getRepositoryToken(FriendFilter));
    focusedIntentionRepo = module.get(getRepositoryToken(FocusedIntention));
    authService = module.get(AuthService);
    geoFallbackService = module.get(GeoFallbackService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addProfile', () => {
    const createProfileDto: CreateFriendProfileDto = {
      location: {
        coords: {
          latitude: 0,
          longitude: 0,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      },
      address: {
        country: 'Test Country',
        isoCountryCode: 'US',
      },
      bff: true,
      socialize: false,
    };

    it('should create a friend profile successfully', async () => {
      const mockCountry = { id: 'country-123', name: 'Test Country' };
      const mockRegion = { id: 'region-123', name: 'Test Region' };

      userRepo.findOneOrFail.mockResolvedValue(mockUser);
      friendProfileRepo.findOne.mockResolvedValue(null);
      friendProfileRepo.create.mockReturnValue({
        user: mockUser,
        bff: true,
        socialize: false,
      });

      // Mock the base class handleLocation method
      jest.spyOn(service as any, 'handleLocation').mockResolvedValue({
        country: mockCountry,
        point: { type: 'Point', coordinates: [0, 0] },
        location: 'Test Location',
      });

      await service.addProfile(mockAuthUser, createProfileDto);

      expect(userRepo.findOneOrFail).toHaveBeenCalledWith({
        id: mockAuthUser.userId,
      });
      expect(friendProfileRepo.findOne).toHaveBeenCalled();
      expect(friendProfileRepo.create).toHaveBeenCalled();

      // Verify EntityManager methods were called
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
    });

    it('should throw BadRequestException if profile already exists', async () => {
      userRepo.findOneOrFail.mockResolvedValue(mockUser);
      friendProfileRepo.findOne.mockResolvedValue({
        id: 'profile-123',
      });

      await expect(
        service.addProfile(mockAuthUser, createProfileDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto: UpdateFriendProfileDto = {
      bff: false,
      socialize: true,
    };

    it('should update friend profile successfully', async () => {
      const mockProfile: any = {
        id: 'profile-123',
        user: mockUser,
        bff: true,
        socialize: false,
        focusedIntentions: {
          set: jest.fn(),
        },
      };

      userRepo.findOneOrFail.mockResolvedValue(mockUser);
      friendProfileRepo.findOneOrFail.mockResolvedValue(mockProfile);

      await service.updateProfile(mockAuthUser, updateProfileDto);

      expect(mockProfile.bff).toBe(false);
      expect(mockProfile.socialize).toBe(true);
    });
  });

  describe('updateFilter', () => {
    const updateFilterDto: UpdateFriendFilterDto = {
      bff: true,
      socialize: true,
    };

    it('should create filter if it does not exist', async () => {
      const mockProfile: any = {
        id: 'profile-123',
        user: mockUser,
        friendFilter: null,
      };

      userRepo.findOneOrFail.mockResolvedValue(mockUser);
      friendProfileRepo.findOneOrFail.mockResolvedValue(mockProfile);
      friendFilterRepo.create.mockReturnValue({
        friendProfile: mockProfile,
        user: mockUser,
      });

      await service.updateFilter(mockAuthUser, updateFilterDto);

      expect(friendFilterRepo.create).toHaveBeenCalled();
    });

    it('should update existing filter', async () => {
      const mockFilter: any = {
        id: 'filter-123',
        bff: false,
        socialize: false,
      };

      const mockProfile: any = {
        id: 'profile-123',
        user: mockUser,
        friendFilter: mockFilter,
      };

      userRepo.findOneOrFail.mockResolvedValue(mockUser);
      friendProfileRepo.findOneOrFail.mockResolvedValue(mockProfile);

      // Get the EntityManager from module and ensure assign works
      const mockEm = module.get(EntityManager);

      await service.updateFilter(mockAuthUser, updateFilterDto);

      expect(mockEm.assign).toHaveBeenCalledWith(
        mockFilter,
        expect.objectContaining({
          bff: true,
          socialize: true,
        }),
      );
      // After assign is called with the updates, the filter should have new values
      expect(mockEm.flush).toHaveBeenCalled();
    });
  });

  describe('findPotentialMatches', () => {
    it('should throw BadRequestException if filter does not exist', async () => {
      const mockProfile: any = {
        id: 'profile-123',
        user: mockUser,
        friendFilter: null,
        controlEndsAt: null,
      };

      userRepo.findOneOrFail.mockResolvedValue(mockUser);
      friendProfileRepo.findOneOrFail.mockResolvedValue(mockProfile);

      await expect(service.findPotentialMatches(mockAuthUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should find potential matches successfully', async () => {
      const mockFilter: any = {
        id: 'filter-123',
        bff: true,
        socialize: true,
      };

      const mockProfile: any = {
        id: 'profile-123',
        user: mockUser,
        friendFilter: mockFilter,
        controlEndsAt: new Date(Date.now() + 86400000), // Has control
        focusedIntentions: {
          toArray: jest.fn().mockReturnValue([]),
        },
      };

      const mockMatches = [
        {
          id: 'match-profile-1',
          user: { id: 'user-456' },
        },
      ];

      userRepo.findOneOrFail.mockResolvedValue(mockUser);
      friendProfileRepo.findOneOrFail.mockResolvedValue(mockProfile);
      friendProfileRepo.find.mockResolvedValue(mockMatches);

      const result = await service.findPotentialMatches(mockAuthUser);

      expect(result).toHaveLength(1);
      expect(friendProfileRepo.find).toHaveBeenCalled();
    });
  });
});
