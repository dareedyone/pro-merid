import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MapboxGeocodingResponse } from './types/mapbox.types';
import { CoordinatesDto } from './dto/expo.location';

@Injectable()
export class GeoFallbackService {
  private readonly logger = new Logger(GeoFallbackService.name);
  private readonly mapboxApiKey: string;

  constructor(private readonly config: ConfigService) {
    this.mapboxApiKey = this.config.get<string>('MAPBOX_API_KEY', '');
  }

  async reverseGeocode(coords: CoordinatesDto): Promise<{
    city?: string;
    district?: string;
    region?: string;
    country?: string;
    countryCode?: string;
  }> {
    try {
      const url = `https://api.mapbox.com/search/geocode/v6/reverse?access_token=${this.mapboxApiKey}&longitude=${coords.longitude}&latitude=${coords.latitude}&limit=1`;

      // const laterUrl = `http://api.positionstack.com/v1/reverse?access_key=YOUR_KEY&query=${lat},${lng}&limit=1`;

      const { data } = await axios.get<MapboxGeocodingResponse>(url);
      const feature = data.features?.[0];
      const context = feature?.properties?.context;

      return {
        city: context?.place?.name,
        district: context?.district?.name,
        region: context?.region?.name,
        country: context?.country?.name,
        countryCode: context?.country?.country_code?.toUpperCase(),
      };
    } catch (error) {
      this.logger.error('Mapbox reverse geocoding failed', error);
      return {};
    }
  }
}
