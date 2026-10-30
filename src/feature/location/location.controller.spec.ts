import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { GeoFallbackService } from './geo-fallback.service';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';

describe('LocationController', () => {
  let controller: LocationController;

  beforeEach(async () => {
    const mockLocationService = {
      processLocation: jest.fn(),
      resolveAndSaveLocation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
