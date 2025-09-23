import { Module, Global } from '@nestjs/common';
import { OrmHelperService } from './services/orm-helper.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Country } from '../feature/location/entities/country.entity';
import { Region } from '../feature/location/entities/region.entity';
import { Media } from '../feature/user/entities/media.entity';
import { GeoFallbackService } from '../feature/location/geo-fallback.service';

@Global()
@Module({
  imports: [MikroOrmModule.forFeature([Country, Region, Media])],
  providers: [OrmHelperService, GeoFallbackService],
  exports: [OrmHelperService, GeoFallbackService],
})
export class CommonModule {}
