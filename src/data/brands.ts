import type { Brand } from '../types';

/**
 * Adding a brand is a data edit only. No component reads a brand id directly —
 * blueprint 00_PROJECT_OVERVIEW.md section 3.
 */
export const brands: Brand[] = [
  { id: 'apple', name: 'Apple', slug: 'apple', logo: '', active: true },
  { id: 'samsung', name: 'Samsung', slug: 'samsung', logo: 'S', active: true },
  { id: 'google', name: 'Google', slug: 'google', logo: 'G', active: true },
  { id: 'oneplus', name: 'OnePlus', slug: 'oneplus', logo: '1+', active: true },
  { id: 'xiaomi', name: 'Xiaomi', slug: 'xiaomi', logo: 'MI', active: true },
  { id: 'redmi', name: 'Redmi', slug: 'redmi', logo: 'R', active: true },
  { id: 'poco', name: 'POCO', slug: 'poco', logo: 'PO', active: true },
  { id: 'realme', name: 'Realme', slug: 'realme', logo: 'rm', active: true },
  { id: 'oppo', name: 'Oppo', slug: 'oppo', logo: 'O', active: true },
  { id: 'vivo', name: 'Vivo', slug: 'vivo', logo: 'V', active: true },
  { id: 'iqoo', name: 'iQOO', slug: 'iqoo', logo: 'iQ', active: true },
  { id: 'motorola', name: 'Motorola', slug: 'motorola', logo: 'M', active: true },
  { id: 'nothing', name: 'Nothing', slug: 'nothing', logo: '( )', active: true },
  { id: 'nokia', name: 'Nokia', slug: 'nokia', logo: 'N', active: true },
  { id: 'asus', name: 'Asus', slug: 'asus', logo: 'AS', active: true },
  { id: 'honor', name: 'Honor', slug: 'honor', logo: 'H', active: true },
  { id: 'huawei', name: 'Huawei', slug: 'huawei', logo: 'HW', active: true },
  { id: 'infinix', name: 'Infinix', slug: 'infinix', logo: 'IX', active: true },
  { id: 'tecno', name: 'Tecno', slug: 'tecno', logo: 'T', active: true },
  { id: 'lava', name: 'Lava', slug: 'lava', logo: 'L', active: true },
  { id: 'itel', name: 'itel', slug: 'itel', logo: 'it', active: true },
];

export const brandById = new Map(brands.map((brand) => [brand.id, brand]));

export function brandName(id: string | undefined): string {
  return (id && brandById.get(id)?.name) || 'Other';
}
