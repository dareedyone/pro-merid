import { Module } from '@nestjs/common';
import { AnchorModule } from 'src/feature/anchor/anchor.module';
import { AdminAnchorController } from './controllers/admin-anchor.controller';

@Module({
  imports: [AnchorModule],
  controllers: [AdminAnchorController],
})
export class AdminModule {}
