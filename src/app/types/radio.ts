export type RadioMode = 'fullscreen' | 'minimal';

export interface RadioStation {
  changeuuid: string;
  name: string;
  url: string;
  favicon: string;
  tags: string;
  countrycode: string;
  homepage: string;
}
