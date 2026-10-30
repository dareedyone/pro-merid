import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { LocationService } from './location.service';
import { GeoFallbackService } from './geo-fallback.service';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(async () => {
    const mockGeoFallbackService = {
      reverseGeocode: jest.fn(),
    };

    const mockRepositories = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const mockEntityManager = {
      persistAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: GeoFallbackService,
          useValue: mockGeoFallbackService,
        },
        {
          provide: getRepositoryToken(City),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Country),
          useValue: mockRepositories,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
