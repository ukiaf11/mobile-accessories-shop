export type DeviceType = 'smartphone' | 'tablet';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  /** Short mark rendered in the brand chip when no logo file exists. */
  logo?: string;
  active: boolean;
}

export interface DeviceModel {
  id: string;
  type: DeviceType;
  brandId: string;
  series: string;
  name: string;
  /** Alternate spellings the search box should also match. */
  aliases?: string[];
  /** Release year, used only to sort newest-first in the model picker. */
  year?: number;
  active: boolean;
}

/** A model plus its resolved brand, which is what the UI almost always wants. */
export interface ResolvedDevice extends DeviceModel {
  brandName: string;
}
