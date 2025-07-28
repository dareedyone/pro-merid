export interface ExpoLocationType {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number;
    speed: number;
  };
  timestamp: number; // Unix timestamp in milliseconds
}

export interface ExpoAddressType {
  city: string;
  country: string;
  district: string | null;
  isoCountryCode: string;
  name: string | null; // Street number or house name
  postalCode: string | null;
  region?: string | null; // State or province
  street: string | null; // Street name
  subregion: string | null;
  timezone: string | null;
}

export interface ExpoLocationAddressType {
  latitude: ExpoLocationType['coords']['latitude'];
  longitude: ExpoLocationType['coords']['longitude'];
  city: ExpoAddressType['city'];
  country: ExpoAddressType['country'];
  region: ExpoAddressType['region'];
  isoCountryCode: ExpoAddressType['isoCountryCode'];
}
