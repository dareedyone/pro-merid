import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { AnchorService } from './anchor.service';
import { Anchor } from 'src/feature/anchor/entities/anchor.entity';
import { User } from 'src/feature/user/entities/user/user.entity';
import { Auth } from 'src/feature/auth/entities/auth.entity';
import type { CreateAnchorDto, UpdateAnchorDto } from '../dtos/anchor.dto';
import { UserPoolMode, AnchorStatus } from '../types/anchor.enum';

describe('AnchorService', () => {
  let service: AnchorService;
  let mockAnchorRepo: any;
  let mockUserRepo: any;
  let mockAuthRepo: any;
  let mockEm: any;

  beforeEach(async () => {
    const mockRepository = () => ({
      create: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      persistAndFlush: jest.fn(),
      removeAndFlush: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnchorService,
        {
          provide: getRepositoryToken(Anchor),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Auth),
          useFactory: mockRepository,
        },
        {
          provide: EntityManager,
          useValue: {
            persistAndFlush: jest.fn(),
            removeAndFlush: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnchorService>(AnchorService);
    mockAnchorRepo = module.get(getRepositoryToken(Anchor));
    mockUserRepo = module.get(getRepositoryToken(User));
    mockAuthRepo = module.get(getRepositoryToken(Auth));
    mockEm = module.get(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAnchor', () => {
    it('should create an anchor successfully', async () => {
      const createDto: CreateAnchorDto = {
        name: 'Test Anchor',
        subdomain: 'test-anchor',
        config: {
          userPoolMode: UserPoolMode.ISOLATED,
          branding: { theme: 'light' as any },
          features: {
            allowMatching: true,
            allowChatModeration: false,
            allowUserManagement: true,
            allowCustomOnboarding: false,
            allowBulkOperations: false,
            allowAnalytics: true,
            allowExport: false,
          },
          matching: { algorithm: 'default' as any },
          moderation: { level: 'none' as any },
          settings: {
            allowSelfRegistration: true,
            requireEmailVerification: true,
            requirePhoneVerification: false,
            defaultLanguage: 'en',
            timezone: 'UTC',
          },
        },
      };

      const mockAnchor = {
        id: 'anchor-1',
        name: 'Test Anchor',
        subdomain: 'test-anchor',
        config: createDto.config,
        status: AnchorStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        users: { count: () => 0 },
        authAccounts: { count: () => 0 },
      };

      mockAnchorRepo.findOne.mockResolvedValue(null); // No existing subdomain
      mockAnchorRepo.create.mockReturnValue(mockAnchor);
      mockEm.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.createAnchor(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Anchor');
      expect(result.subdomain).toBe('test-anchor');
      expect(mockAnchorRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Anchor',
          subdomain: 'test-anchor',
          config: expect.any(Object),
          status: AnchorStatus.ACTIVE,
        }),
      );
    });

    it('should throw ConflictException if subdomain already exists', async () => {
      const createDto: CreateAnchorDto = {
        name: 'Test Anchor',
        subdomain: 'existing-subdomain',
        config: {} as any,
      };

      mockAnchorRepo.findOne.mockResolvedValue({ id: 'existing-anchor' });

      await expect(service.createAnchor(createDto)).rejects.toThrow(
        'Subdomain already exists',
      );
    });
  });

  describe('getAnchorById', () => {
    it('should return anchor by id', async () => {
      const mockAnchor = {
        id: 'anchor-1',
        name: 'Test Anchor',
        subdomain: 'test-anchor',
        config: {},
        status: AnchorStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        users: { count: () => 5 },
        authAccounts: { count: () => 2 },
      };

      mockAnchorRepo.findOne.mockResolvedValue(mockAnchor);

      const result = await service.getAnchorById('anchor-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('anchor-1');
      expect(result.name).toBe('Test Anchor');
      expect(result.userCount).toBe(5);
      expect(result.authAccountCount).toBe(2);
    });

    it('should throw NotFoundException if anchor not found', async () => {
      mockAnchorRepo.findOne.mockResolvedValue(null);

      await expect(service.getAnchorById('non-existent')).rejects.toThrow(
        'Anchor not found',
      );
    });
  });

  describe('updateAnchor', () => {
    it('should update anchor successfully', async () => {
      const updateDto: UpdateAnchorDto = {
        name: 'Updated Anchor',
        status: AnchorStatus.INACTIVE,
      };

      const mockAnchor = {
        id: 'anchor-1',
        name: 'Original Anchor',
        subdomain: 'test-anchor',
        config: {},
        status: AnchorStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        users: { count: () => 0 },
        authAccounts: { count: () => 0 },
      };

      mockAnchorRepo.findOne.mockResolvedValue(mockAnchor);
      mockEm.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.updateAnchor('anchor-1', updateDto);

      expect(result).toBeDefined();
      expect(mockAnchor.name).toBe('Updated Anchor');
      expect(mockAnchor.status).toBe(AnchorStatus.INACTIVE);
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(mockAnchor);
    });

    it('should throw NotFoundException if anchor not found', async () => {
      mockAnchorRepo.findOne.mockResolvedValue(null);

      await expect(service.updateAnchor('non-existent', {})).rejects.toThrow(
        'Anchor not found',
      );
    });
  });

  describe('deleteAnchor', () => {
    it('should delete anchor successfully', async () => {
      const mockAnchor = {
        id: 'anchor-1',
        name: 'Test Anchor',
      };

      mockAnchorRepo.findOne.mockResolvedValue(mockAnchor);
      mockUserRepo.count.mockResolvedValue(0);
      mockEm.removeAndFlush.mockResolvedValue(undefined);

      await service.deleteAnchor('anchor-1');

      expect(mockEm.removeAndFlush).toHaveBeenCalledWith(mockAnchor);
    });

    it('should throw BadRequestException if anchor has users', async () => {
      const mockAnchor = {
        id: 'anchor-1',
        name: 'Test Anchor',
      };

      mockAnchorRepo.findOne.mockResolvedValue(mockAnchor);
      mockUserRepo.count.mockResolvedValue(5);

      await expect(service.deleteAnchor('anchor-1')).rejects.toThrow(
        'Cannot delete anchor with existing users',
      );
    });
  });
});
