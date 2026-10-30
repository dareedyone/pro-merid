import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';

@Module({
  imports: [MikroOrmModule.forFeature([City, Country])],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}
