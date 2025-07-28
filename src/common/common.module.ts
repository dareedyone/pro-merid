import { Module, Global } from '@nestjs/common';
import { OrmHelperService } from './services/orm-helper.service';

@Global()
@Module({
  providers: [OrmHelperService],
  exports: [OrmHelperService],
})
export class CommonModule {}
