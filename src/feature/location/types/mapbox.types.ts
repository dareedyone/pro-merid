export interface MapboxContextFeature {
  mapbox_id: string;
  name: string;
  wikidata_id?: string;
  country_code?: string;
  country_code_alpha_3?: string;
  region_code?: string;
  region_code_full?: string;
  [key: string]: any;
}

export interface MapboxContext {
  address?: MapboxContextFeature & {
    address_number?: string;
    street_name?: string;
  };
  street?: MapboxContextFeature;
  neighborhood?: MapboxContextFeature;
  postcode?: MapboxContextFeature;
  place?: MapboxContextFeature;
  district?: MapboxContextFeature;
  region?: MapboxContextFeature;
  country?: MapboxContextFeature;
  [key: string]: MapboxContextFeature | undefined;
}

export interface MapboxFeatureProperties {
  mapbox_id: string;
  feature_type: string;
  name: string;
  name_preferred?: string;
  place_formatted?: string;
  full_address?: string;
  context?: MapboxContext;
}

export interface MapboxFeature {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: MapboxFeatureProperties;
  bbox?: [number, number, number, number];
}

export interface MapboxGeocodingResponse {
  type: 'FeatureCollection';
  features: MapboxFeature[];
  attribution: string;
}
