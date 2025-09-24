import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { AuthService } from 'src/feature/auth/auth.service';
import { User } from 'src/feature/user/entities/user/user.entity';
import { DatingProfile } from 'src/feature/dating/entities/dating.profile';
import { FriendProfile } from 'src/feature/friends/entities/friend.profile';
import { SubscriptionHistory } from '../entities/subscription-history.entity';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { SubscriptionType, SubscriptionStatus } from '../dtos/subscription.dto';
import { SubscriptionAction } from '../entities/subscription-history.entity';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let mockUserRepo: any;
  let mockDatingProfileRepo: any;
  let mockFriendProfileRepo: any;
  let mockSubscriptionHistoryRepo: any;
  let mockEntityManager: any;
  let mockAuthService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    // Add other user properties as needed
  };

  const mockDatingProfile = {
    id: 'dating-profile-1',
    user: mockUser,
    controlEndsAt: null,
    trueFyndEndsAt: null,
    // Add other dating profile properties as needed
  };

  const mockFriendProfile = {
    id: 'friend-profile-1',
    user: mockUser,
    controlEndsAt: null,
    // Add other friend profile properties as needed
  };

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    mockDatingProfileRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    mockFriendProfileRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    mockSubscriptionHistoryRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      count: jest.fn(),
    };

    mockEntityManager = {
      getConnection: jest.fn().mockReturnValue({
        execute: jest.fn(),
      }),
    };

    mockAuthService = {
      fetchAuthUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(DatingProfile),
          useValue: mockDatingProfileRepo,
        },
        {
          provide: getRepositoryToken(FriendProfile),
          useValue: mockFriendProfileRepo,
        },
        {
          provide: getRepositoryToken(SubscriptionHistory),
          useValue: mockSubscriptionHistoryRepo,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSubscriptionPlans', () => {
    it('should return dating subscription plans', () => {
      const plans = service.getSubscriptionPlans(ProfileType.DATE);
      expect(plans).toHaveLength(2);
      expect(plans[0].type).toBe(SubscriptionType.CONTROL);
      expect(plans[1].type).toBe(SubscriptionType.TRUEFYND);
    });

    it('should return friends subscription plans', () => {
      const plans = service.getSubscriptionPlans(ProfileType.FRIEND);
      expect(plans).toHaveLength(1);
      expect(plans[0].type).toBe(SubscriptionType.CONTROL);
    });
  });

  describe('getSubscriptionStatus', () => {
    beforeEach(() => {
      mockAuthService.fetchAuthUser.mockResolvedValue({ user: mockUser });
    });

    it('should return dating subscription status', async () => {
      mockDatingProfileRepo.findOne.mockResolvedValue(mockDatingProfile);

      const status = await service.getSubscriptionStatus(
        'user-1',
        ProfileType.DATE,
      );

      expect(status).toBeDefined();
      expect(status.profileType).toBe(ProfileType.DATE);
      expect(mockDatingProfileRepo.findOne).toHaveBeenCalledWith({
        user: mockUser,
      });
    });

    it('should return friends subscription status', async () => {
      mockFriendProfileRepo.findOne.mockResolvedValue(mockFriendProfile);

      const status = await service.getSubscriptionStatus(
        'user-1',
        ProfileType.FRIEND,
      );

      expect(status).toBeDefined();
      expect(status.profileType).toBe(ProfileType.FRIEND);
      expect(mockFriendProfileRepo.findOne).toHaveBeenCalledWith({
        user: mockUser,
      });
    });
  });

  describe('purchaseSubscription', () => {
    beforeEach(() => {
      mockAuthService.fetchAuthUser.mockResolvedValue({ user: mockUser });
      // Mock validateReceipt to return true
      jest.spyOn(service as any, 'validateReceipt').mockResolvedValue(true);
    });

    it('should purchase dating control subscription', async () => {
      const dto = {
        profileType: ProfileType.DATE,
        subscriptionType: SubscriptionType.CONTROL,
        receiptData: 'mock-receipt-data',
        transactionId: 'txn-123',
        productId: 'com.spefynd.dating.control.monthly',
      };

      mockDatingProfileRepo.findOne.mockResolvedValue(mockDatingProfile);
      mockSubscriptionHistoryRepo.create.mockReturnValue({});

      const result = await service.purchaseSubscription('user-1', dto);

      expect(result).toBeDefined();
      expect(mockDatingProfileRepo.findOne).toHaveBeenCalledWith({
        user: mockUser,
      });
    });

    it('should throw error for TrueFynd on friends', async () => {
      const dto = {
        profileType: ProfileType.FRIEND,
        subscriptionType: SubscriptionType.TRUEFYND,
        receiptData: 'mock-receipt-data',
        transactionId: 'txn-123',
        productId: 'com.spefynd.friends.truefynd.onetime',
      };

      await expect(service.purchaseSubscription('user-1', dto)).rejects.toThrow(
        'TrueFynd is not available for friends',
      );
    });
  });

  describe('renewSubscription', () => {
    beforeEach(() => {
      mockAuthService.fetchAuthUser.mockResolvedValue({ user: mockUser });
      jest.spyOn(service as any, 'validateReceipt').mockResolvedValue(true);
    });

    it('should renew subscription', async () => {
      const dto = {
        profileType: ProfileType.DATE,
        subscriptionType: SubscriptionType.CONTROL,
        receiptData: 'mock-receipt-data',
        transactionId: 'txn-123',
        productId: 'com.spefynd.dating.control.monthly',
      };

      mockDatingProfileRepo.findOne.mockResolvedValue(mockDatingProfile);
      mockSubscriptionHistoryRepo.create.mockReturnValue({});

      const result = await service.renewSubscription('user-1', dto);

      expect(result).toBeDefined();
    });
  });

  describe('cancelSubscription', () => {
    beforeEach(() => {
      mockAuthService.fetchAuthUser.mockResolvedValue({ user: mockUser });
    });

    it('should cancel dating subscription', async () => {
      const dto = {
        profileType: ProfileType.DATE,
        subscriptionType: SubscriptionType.CONTROL,
        reason: 'User requested cancellation',
      };

      mockDatingProfileRepo.findOne.mockResolvedValue(mockDatingProfile);
      mockSubscriptionHistoryRepo.create.mockReturnValue({});

      const result = await service.cancelSubscription('user-1', dto);

      expect(result.message).toBe('Subscription cancelled successfully');
    });
  });

  describe('validateReceipt', () => {
    it('should validate App Store receipt', async () => {
      const receiptData = Buffer.from(
        JSON.stringify({
          receipt: 'mock-receipt',
        }),
      ).toString('base64');

      const result = await (service as any).validateReceipt(
        receiptData,
        SubscriptionType.CONTROL,
      );

      // This will return true in the mock implementation
      expect(result).toBe(true);
    });

    it('should validate Play Store receipt', async () => {
      const receiptData = JSON.stringify({
        purchaseToken: 'mock-token',
        orderId: 'mock-order',
      });

      const result = await (service as any).validateReceipt(
        receiptData,
        SubscriptionType.CONTROL,
      );

      // This will return true in the mock implementation
      expect(result).toBe(true);
    });
  });

  describe('calculateExpirationDate', () => {
    it('should calculate control subscription expiration (30 days)', () => {
      const result = (service as any).calculateExpirationDate(
        SubscriptionType.CONTROL,
      );
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeCloseTo(expectedDate.getTime(), -2); // Within 1 second
    });

    it('should calculate TrueFynd subscription expiration (365 days)', () => {
      const result = (service as any).calculateExpirationDate(
        SubscriptionType.TRUEFYND,
      );
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 365);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeCloseTo(expectedDate.getTime(), -2); // Within 1 second
    });
  });

  describe('processSubscription', () => {
    beforeEach(() => {
      mockAuthService.fetchAuthUser.mockResolvedValue({ user: mockUser });
      jest.spyOn(service as any, 'validateReceipt').mockResolvedValue(true);
    });

    it('should process subscription with duplicate check', async () => {
      const dto = {
        profileType: ProfileType.DATE,
        subscriptionType: SubscriptionType.CONTROL,
        receiptData: 'mock-receipt-data',
        transactionId: 'txn-123',
        productId: 'com.spefynd.dating.control.monthly',
      };

      // Mock no existing transaction
      mockSubscriptionHistoryRepo.findOne.mockResolvedValue(null);
      mockDatingProfileRepo.findOne.mockResolvedValue(mockDatingProfile);
      mockSubscriptionHistoryRepo.create.mockReturnValue({});

      const result = await service.processSubscription(
        'user-1',
        dto,
        SubscriptionAction.PURCHASED,
      );

      expect(result).toBeDefined();
      expect(mockSubscriptionHistoryRepo.findOne).toHaveBeenCalledWith({
        transactionId: 'txn-123',
      });
    });

    it('should handle duplicate transaction', async () => {
      const dto = {
        profileType: ProfileType.DATE,
        subscriptionType: SubscriptionType.CONTROL,
        receiptData: 'mock-receipt-data',
        transactionId: 'txn-123',
        productId: 'com.spefynd.dating.control.monthly',
      };

      // Mock existing transaction
      mockSubscriptionHistoryRepo.findOne.mockResolvedValue({
        id: 'existing-txn',
      });
      mockDatingProfileRepo.findOne.mockResolvedValue(mockDatingProfile);

      const result = await service.processSubscription(
        'user-1',
        dto,
        SubscriptionAction.PURCHASED,
      );

      expect(result).toBeDefined();
      // Should not create new subscription history
      expect(mockSubscriptionHistoryRepo.create).not.toHaveBeenCalled();
    });
  });
});
