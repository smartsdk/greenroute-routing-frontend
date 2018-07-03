export class AirControl {
  id: string;
  type: string;
  CO: string;
  NO2: string;
  O3: string;
  PM10: string;
  SO2: string;
  address: Address;
  dataSource: string;
  dateObserved: string;
  location: Location;
  measurand: [string,string,string,string,string];
  relativeHumidity: number;
  source: string;
  temperature: number;
}


export class Address{
  addressCountry: string;
  addressLocality: string;
  streetAddress: string;
}

export class Location {
  type: string;
  coordinates: [number,number];
}
