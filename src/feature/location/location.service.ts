import { Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { GeoFallbackService } from './geo-fallback.service';
import { ExpoLocationAddressDto } from './dto/expo.location';
import { ExpoLocationAddressType } from './types/index.type';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(City) private cityRepo: EntityRepository<City>,
    @InjectRepository(Country) private countryRepo: EntityRepository<Country>,
    private readonly geoFallback: GeoFallbackService,
  ) {}
  // create(createLocationDto: CreateLocationDto) {
  //   return 'This action adds a new location';
  // }
  async processLocation(
    location: ExpoLocationAddressDto,
  ): Promise<ExpoLocationAddressType> {
    const { latitude, longitude } = location;
    let { city, region, country, isoCountryCode } = location;

    if (!city || !country || !isoCountryCode) {
      const fallback = await this.geoFallback.reverseGeocode(
        latitude,
        longitude,
      );

      city ??= fallback.city;
      region ??= fallback.region;
      country ??= fallback.country;
      isoCountryCode ??= fallback.countryCode;
    }

    if (!city || !country || !isoCountryCode) {
      throw new Error('Unable to determine user location.');
    }

    // Now find or create entries in Country & City table
    // await this.countryRepo.findOrCreate({ name: country, isoCode: isoCountryCode });
    // await this.cityRepo.findOrCreate({ name: city, region, country });

    return { city, region, country, isoCountryCode, latitude, longitude };
  }

  async resolveAndSaveLocation(dto: ExpoLocationAddressDto) {
    // const { latitude, longitude, city, region, country, isoCountryCode } = dto;

    const { latitude, longitude, city, region, country, isoCountryCode } =
      await this.processLocation(dto);

    // if (!isoCountryCode) {
    //   throw new BadRequestException('ISO country code is required.');
    // }

    // Match or create country
    const countryEntity = await this.countryRepo.findOne({
      isoCode: isoCountryCode,
    });
    // todo: check isocode seeders if it's upper pr lowercase
    if (!countryEntity) {
      // countryEntity = this.countryRepo.create({
      //   name: country,
      //   isoCode: isoCountryCode,
      // });
      // await this.countryRepo.persistAndFlush(countryEntity);
      // log this to admin
    }

    // if (!countryEntity) {
    //   throw new BadRequestException('Could not resolve country.');
    // }

    // const cityName = city || null;
    // const regionName = region || null;

    // Match existing city
    let cityEntity = null;

    // if (cityName) {
    cityEntity = await this.cityRepo.findOne({
      name: city,
      country: countryEntity,
      // region: regionName,
    });
    // }

    if (!cityEntity) {
      cityEntity = this.cityRepo.create({
        name: city,
        country: countryEntity,
        region,
        centroidCoordinates: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      });
      await this.cityRepo.persistAndFlush(cityEntity);
    }

    return {
      country: countryEntity,
      city: cityEntity,
      coordinates: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    };
  }
}
