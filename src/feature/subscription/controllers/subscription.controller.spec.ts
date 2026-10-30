import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from '../services/subscription.service';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { SubscriptionType } from '../dtos/subscription.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let mockSubscriptionService: any;

  beforeEach(async () => {
    mockSubscriptionService = {
      getSubscriptionPlans: jest.fn(),
      getSubscriptionStatus: jest.fn(),
      purchaseSubscription: jest.fn(),
      renewSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSubscriptionPlans', () => {
    it('should return dating subscription plans', () => {
      const mockPlans = [
        {
          type: SubscriptionType.CONTROL,
          name: 'Control',
          description: 'Full access to all filters',
          price: 9.99,
          currency: 'USD',
          duration: 30,
          features: ['All filters', 'Unlimited matches'],
        },
        {
          type: SubscriptionType.TRUEFYND,
          name: 'TrueFynd',
          description: 'One-time premium access',
          price: 29.99,
          currency: 'USD',
          duration: 365,
          features: ['All filters', 'Unlimited matches', 'Priority support'],
        },
      ];

      mockSubscriptionService.getSubscriptionPlans.mockReturnValue(mockPlans);

      const result = controller.getSubscriptionPlans(ProfileType.DATE);

      expect(result).toEqual(mockPlans);
      expect(mockSubscriptionService.getSubscriptionPlans).toHaveBeenCalledWith(ProfileType.DATE);
    });

    it('should return friends subscription plans', () => {
      const mockPlans = [
        {
          type: SubscriptionType.CONTROL,
          name: 'Control',
          description: 'Full access to all filters',
          price: 9.99,
          currency: 'USD',
          duration: 30,
          features: ['All filters', 'Unlimited matches'],
        },
      ];

      mockSubscriptionService.getSubscriptionPlans.mockReturnValue(mockPlans);

      const result = controller.getSubscriptionPlans(ProfileType.FRIEND);

      expect(result).toEqual(mockPlans);
      expect(mockSubscriptionService.getSubscriptionPlans).toHaveBeenCalledWith(ProfileType.FRIEND);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription status', async () => {
      const mockStatus = {
        profileType: ProfileType.DATE,
        hasControl: true,
        hasTrueFynd: false,
        controlExpiresAt: new Date('2024-02-01'),
        trueFyndExpiresAt: null,
        isActive: true,
      };

      mockSubscriptionService.getSubscriptionStatus.mockResolvedValue(mockStatus);

      const mockRequest = {
        user: {
          userId: 'user-123',
          sub: 'auth-123',
          role: 'user' as any,
        },
      } as any;

      const result = await controller.getSubscriptionStatus(mockRequest, ProfileType.DATE);

      expect(result).toEqual(mockStatus);
      expect(mockSubscriptionService.getSubscriptionStatus).toHaveBeenCalledWith(mockRequest.user, ProfileType.DATE);
    });
  });

  describe('purchaseSubscription', () => {
    it('should purchase subscription', async () => {
      const dto = {
        profileType: ProfileType.DATE,
        subscriptionType: SubscriptionType.CONTROL,
        receiptData: 'mock-receipt-data',
        transactionId: 'txn-123',
        productId: 'com.spefynd.dating.control.monthly',
      };

      const mockStatus = {
        profileType: ProfileType.DATE,
        hasControl: true,
        hasTrueFynd: false,
        controlExpiresAt: new Date('2024-02-01'),
        trueFyndExpiresAt: null,
        isActive: true,
      };

      mockSubscriptionService.purchaseSubscription.mockResolvedValue(mockStatus);

      const mockRequest = {
        user: {
          userId: 'user-123',
          sub: 'auth-123',
          role: 'user' as any,
        },
      } as any;

      const result = await controller.purchaseSubscription(mockRequest, dto);

      expect(result).toEqual(mockStatus);
      expect(mockSubscriptionService.purchaseSubscription).toHaveBeenCalledWith(mockRequest.user, dto);
    });
  });

  describe('renewSubscription', () => {
    it('should renew subscription', async () => {
      const dto = {
        profileType: ProfileType.DATE,
        subscriptionType: SubscriptionType.CONTROL,
        receiptData: 'mock-receipt-data',
        transactionId: 'txn-123',
        productId: 'com.spefynd.dating.control.monthly',
      };

      const mockStatus = {
        profileType: ProfileType.DATE,
        hasControl: true,
        hasTrueFynd: false,
        controlExpiresAt: new Date('2024-03-01'),
        trueFyndExpiresAt: null,
        isActive: true,
      };

      mockSubscriptionService.renewSubscription.mockResolvedValue(mockStatus);

      const mockRequest = {
        user: {
          userId: 'user-123',
          sub: 'auth-123',
          role: 'user' as any,
        },
      } as any;

      const result = await controller.renewSubscription(mockRequest, dto);

      expect(result).toEqual(mockStatus);
      expect(mockSubscriptionService.renewSubscription).toHaveBeenCalledWith(mockRequest.user, dto);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription', async () => {
      const dto = {
        profileType: ProfileType.DATE,
        subscriptionType: SubscriptionType.CONTROL,
        reason: 'User requested cancellation',
      };

      const mockResult = {
        message: 'Subscription cancelled successfully',
      };

      mockSubscriptionService.cancelSubscription.mockResolvedValue(mockResult);

      const mockRequest = {
        user: {
          userId: 'user-123',
          sub: 'auth-123',
          role: 'user' as any,
        },
      } as any;

      const result = await controller.cancelSubscription(mockRequest, dto);

      expect(result).toEqual(mockResult);
      expect(mockSubscriptionService.cancelSubscription).toHaveBeenCalledWith(mockRequest.user, dto);
    });
  });
});
