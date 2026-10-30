import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { SupportService } from './support.service';

describe('SupportService', () => {
  let service: SupportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportService],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create support message', () => {
    const dto = {
      senderType: 'user' as const,
      senderId: 'user-123',
      text: 'test message',
    };
    const result = service.create(dto);
    expect(result).toBe('This action adds a new support');
  });
});
