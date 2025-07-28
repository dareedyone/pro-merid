import { Test, TestingModule } from '@nestjs/testing';
import { DatingService } from './dating.service';

describe('DatingService', () => {
  let service: DatingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatingService],
    }).compile();

    service = module.get<DatingService>(DatingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
