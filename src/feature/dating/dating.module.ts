import { Module } from '@nestjs/common';
import { DatingService } from './dating.service';
import { DatingController } from './dating.controller';

@Module({
  controllers: [DatingController],
  providers: [DatingService],
})
export class DatingModule {}
