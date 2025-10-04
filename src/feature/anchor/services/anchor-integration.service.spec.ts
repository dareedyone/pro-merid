import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { AnchorIntegrationService } from './anchor-integration.service';
import { User } from 'src/feature/user/entities/user/user.entity';
import { Anchor } from 'src/feature/anchor/entities/anchor.entity';
import { UserPoolMode } from '../types/anchor.enum';

describe('AnchorIntegrationService', () => {
  let service: AnchorIntegrationService;
  let mockUserRepo: any;
  let mockAnchorRepo: any;
  let mockEm: any;

  beforeEach(async () => {
    const mockRepository = () => ({
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnchorIntegrationService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Anchor),
          useFactory: mockRepository,
        },
        {
          provide: EntityManager,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AnchorIntegrationService>(AnchorIntegrationService);
    mockUserRepo = module.get(getRepositoryToken(User));
    mockAnchorRepo = module.get(getRepositoryToken(Anchor));
    mockEm = module.get(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserAnchorContext', () => {
    it('should return anchor context for user with anchor', async () => {
      const mockUser = {
        id: 'user-1',
        anchor: {
          id: 'anchor-1',
          config: {
            userPoolMode: UserPoolMode.ISOLATED,
            matching: { allowCrossAnchorMatching: false },
            moderation: { level: 'basic' },
            features: { allowMatching: true },
          },
        },
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserAnchorContext('user-1');

      expect(result).toBeDefined();
      expect(result.anchorId).toBe('anchor-1');
      expect(result.userPoolMode).toBe(UserPoolMode.ISOLATED);
      expect(result.canSeeOtherAnchors).toBe(false);
      expect(result.canMatchWithOtherAnchors).toBe(false);
    });

    it('should return null for user without anchor', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'user-1', anchor: null });

      const result = await service.getUserAnchorContext('user-1');

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.getUserAnchorContext('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUsersForMatching', () => {
    it('should return users for isolated mode', async () => {
      const mockUser = {
        id: 'user-1',
        anchor: {
          id: 'anchor-1',
          config: { userPoolMode: UserPoolMode.ISOLATED },
        },
      };

      const mockUsers = [
        { id: 'user-2', anchor: { id: 'anchor-1' } },
        { id: 'user-3', anchor: { id: 'anchor-1' } },
      ];

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.find.mockResolvedValue(mockUsers);

      const result = await service.getUsersForMatching('user-1');

      expect(result).toEqual(mockUsers);
      expect(mockUserRepo.find).toHaveBeenCalledWith(
        { anchor: { id: 'anchor-1' }, id: { $ne: 'user-1' } },
        expect.any(Object),
      );
    });

    it('should return all users for mixed mode', async () => {
      const mockUser = {
        id: 'user-1',
        anchor: {
          id: 'anchor-1',
          config: { userPoolMode: UserPoolMode.MIXED },
        },
      };

      const mockUsers = [
        { id: 'user-2', anchor: { id: 'anchor-1' } },
        { id: 'user-3', anchor: { id: 'anchor-2' } },
        { id: 'user-4', anchor: null },
      ];

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.find.mockResolvedValue(mockUsers);

      const result = await service.getUsersForMatching('user-1');

      expect(result).toEqual(mockUsers);
      expect(mockUserRepo.find).toHaveBeenCalledWith(
        { id: { $ne: 'user-1' } },
        expect.any(Object),
      );
    });

    it('should return empty array for non-existent user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.getUsersForMatching('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('shouldAllowMatching', () => {
    it('should allow matching between users in same anchor', async () => {
      const mockSourceUser = {
        id: 'user-1',
        anchor: {
          id: 'anchor-1',
          config: { userPoolMode: UserPoolMode.ISOLATED },
        },
      };

      const mockTargetUser = {
        id: 'user-2',
        anchor: {
          id: 'anchor-1',
          config: { userPoolMode: UserPoolMode.ISOLATED },
        },
      };

      mockUserRepo.findOne
        .mockResolvedValueOnce(mockSourceUser)
        .mockResolvedValueOnce(mockTargetUser);

      const result = await service.shouldAllowMatching('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('should allow matching between users with no anchors', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.shouldAllowMatching('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('should not allow matching between users in different anchors without cross-anchor permission', async () => {
      const mockSourceUser = {
        id: 'user-1',
        anchor: {
          id: 'anchor-1',
          config: {
            userPoolMode: UserPoolMode.ISOLATED,
            matching: { allowCrossAnchorMatching: false },
          },
        },
      };

      const mockTargetUser = {
        id: 'user-2',
        anchor: {
          id: 'anchor-2',
          config: {
            userPoolMode: UserPoolMode.ISOLATED,
            matching: { allowCrossAnchorMatching: false },
          },
        },
      };

      mockUserRepo.findOne
        .mockResolvedValueOnce(mockSourceUser)
        .mockResolvedValueOnce(mockTargetUser);

      const result = await service.shouldAllowMatching('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  describe('isUserInAnchor', () => {
    it('should return true if user is in anchor', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        anchor: { id: 'anchor-1' },
      });

      const result = await service.isUserInAnchor('user-1', 'anchor-1');

      expect(result).toBe(true);
    });

    it('should return false if user is not in anchor', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.isUserInAnchor('user-1', 'anchor-1');

      expect(result).toBe(false);
    });
  });

  describe('getAnchorUserCount', () => {
    it('should return user count for anchor', async () => {
      mockUserRepo.count.mockResolvedValue(5);

      const result = await service.getAnchorUserCount('anchor-1');

      expect(result).toBe(5);
      expect(mockUserRepo.count).toHaveBeenCalledWith({
        anchor: { id: 'anchor-1' },
      });
    });
  });
});
