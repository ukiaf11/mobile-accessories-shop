import type { DeviceModel, DeviceType } from '../types';
import { slugify } from '../lib/format';

/**
 * Device catalog.
 *
 * Models are authored as compact `[series, year, ...names]` groups and expanded into
 * `DeviceModel` records. Adding a phone means adding a string — no UI change, no id to
 * invent by hand. Ids are `${brandId}-${slugify(name)}`.
 */
type Group = [series: string, year: number, ...names: string[]];

function expand(brandId: string, type: DeviceType, groups: Group[]): DeviceModel[] {
  return groups.flatMap(([series, year, ...names]) =>
    names.map((name) => ({
      id: `${brandId}-${slugify(name)}`,
      type,
      brandId,
      series,
      name,
      year,
      active: true,
    })),
  );
}

const apple: DeviceModel[] = [
  ...expand('apple', 'smartphone', [
    ['iPhone SE', 2022, 'iPhone SE (2020)', 'iPhone SE (2022)'],
    ['iPhone 11', 2019, 'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max'],
    ['iPhone 12', 2020, 'iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max'],
    ['iPhone 13', 2021, 'iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max'],
    ['iPhone 14', 2022, 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max'],
    ['iPhone 15', 2023, 'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max'],
    ['iPhone 16', 2024, 'iPhone 16e', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max'],
  ]),
  ...expand('apple', 'tablet', [
    ['iPad', 2024, 'iPad (9th gen)', 'iPad (10th gen)', 'iPad (11th gen)'],
    ['iPad Air', 2024, 'iPad Air 11-inch (M2)', 'iPad Air 13-inch (M2)'],
    ['iPad mini', 2024, 'iPad mini (6th gen)', 'iPad mini (7th gen)'],
    ['iPad Pro', 2024, 'iPad Pro 11-inch (M4)', 'iPad Pro 13-inch (M4)'],
  ]),
];

const samsung: DeviceModel[] = [
  ...expand('samsung', 'smartphone', [
    ['Galaxy S', 2021, 'Galaxy S21', 'Galaxy S21 Plus', 'Galaxy S21 Ultra'],
    ['Galaxy S', 2022, 'Galaxy S22', 'Galaxy S22 Plus', 'Galaxy S22 Ultra'],
    ['Galaxy S', 2023, 'Galaxy S23', 'Galaxy S23 FE', 'Galaxy S23 Plus', 'Galaxy S23 Ultra'],
    ['Galaxy S', 2024, 'Galaxy S24', 'Galaxy S24 Plus', 'Galaxy S24 Ultra'],
    ['Galaxy S', 2025, 'Galaxy S25', 'Galaxy S25 Plus', 'Galaxy S25 Ultra'],
    ['Galaxy A', 2024, 'Galaxy A15 5G', 'Galaxy A25 5G', 'Galaxy A34 5G', 'Galaxy A35 5G', 'Galaxy A54 5G', 'Galaxy A55 5G'],
    ['Galaxy A', 2025, 'Galaxy A16 5G', 'Galaxy A56 5G'],
    ['Galaxy M', 2024, 'Galaxy M14 5G', 'Galaxy M34 5G', 'Galaxy M35 5G', 'Galaxy M55 5G'],
    ['Galaxy F', 2024, 'Galaxy F15 5G', 'Galaxy F55 5G'],
    ['Galaxy Note', 2020, 'Galaxy Note 20', 'Galaxy Note 20 Ultra'],
    ['Galaxy Z Fold', 2024, 'Galaxy Z Fold 4', 'Galaxy Z Fold 5', 'Galaxy Z Fold 6'],
    ['Galaxy Z Flip', 2024, 'Galaxy Z Flip 4', 'Galaxy Z Flip 5', 'Galaxy Z Flip 6'],
  ]),
  ...expand('samsung', 'tablet', [
    ['Galaxy Tab', 2024, 'Galaxy Tab A9', 'Galaxy Tab A9 Plus', 'Galaxy Tab S9', 'Galaxy Tab S9 FE', 'Galaxy Tab S9 Ultra', 'Galaxy Tab S10 Plus'],
  ]),
];

const google: DeviceModel[] = expand('google', 'smartphone', [
  ['Pixel 6', 2021, 'Pixel 6', 'Pixel 6a', 'Pixel 6 Pro'],
  ['Pixel 7', 2022, 'Pixel 7', 'Pixel 7a', 'Pixel 7 Pro'],
  ['Pixel 8', 2023, 'Pixel 8', 'Pixel 8a', 'Pixel 8 Pro'],
  ['Pixel 9', 2024, 'Pixel 9', 'Pixel 9a', 'Pixel 9 Pro', 'Pixel 9 Pro XL'],
]);

const others: DeviceModel[] = [
  ...expand('oneplus', 'smartphone', [
    ['OnePlus Flagship', 2024, 'OnePlus 11 5G', 'OnePlus 11R', 'OnePlus 12', 'OnePlus 12R', 'OnePlus 13', 'OnePlus 13R'],
    ['OnePlus Nord', 2024, 'OnePlus Nord 3', 'OnePlus Nord 4', 'OnePlus Nord CE 3', 'OnePlus Nord CE 4', 'OnePlus Nord CE 4 Lite'],
  ]),
  ...expand('xiaomi', 'smartphone', [
    ['Xiaomi Flagship', 2024, 'Xiaomi 13 Pro', 'Xiaomi 14', 'Xiaomi 14 Ultra', 'Xiaomi 15'],
    ['Mi', 2021, 'Mi 11X', 'Mi 11X Pro'],
  ]),
  ...expand('xiaomi', 'tablet', [['Xiaomi Pad', 2024, 'Xiaomi Pad 6', 'Xiaomi Pad 7']]),
  ...expand('redmi', 'smartphone', [
    ['Redmi Note', 2023, 'Redmi Note 12', 'Redmi Note 12 Pro', 'Redmi Note 13', 'Redmi Note 13 Pro', 'Redmi Note 13 Pro Plus'],
    ['Redmi Note', 2024, 'Redmi Note 14', 'Redmi Note 14 Pro', 'Redmi Note 14 Pro Plus'],
    ['Redmi', 2024, 'Redmi 13C', 'Redmi 14C', 'Redmi A3'],
  ]),
  ...expand('poco', 'smartphone', [
    ['POCO X', 2024, 'POCO X6', 'POCO X6 Pro', 'POCO X7', 'POCO X7 Pro'],
    ['POCO F', 2024, 'POCO F6', 'POCO F6 Pro'],
    ['POCO M', 2024, 'POCO M6 Pro', 'POCO M7 Pro'],
  ]),
  ...expand('realme', 'smartphone', [
    ['Realme Number', 2024, 'Realme 11 Pro', 'Realme 11 Pro Plus', 'Realme 12 Pro', 'Realme 12 Pro Plus', 'Realme 13 Pro', 'Realme 13 Pro Plus'],
    ['Realme GT', 2024, 'Realme GT 6', 'Realme GT 7 Pro'],
    ['Narzo', 2024, 'Realme Narzo 70', 'Realme Narzo 70 Pro', 'Realme C55'],
  ]),
  ...expand('oppo', 'smartphone', [
    ['Oppo Reno', 2024, 'Oppo Reno 10', 'Oppo Reno 11', 'Oppo Reno 12', 'Oppo Reno 12 Pro'],
    ['Oppo F', 2024, 'Oppo F25 Pro', 'Oppo F27 Pro Plus'],
    ['Oppo A', 2023, 'Oppo A78', 'Oppo A79'],
    ['Oppo Find', 2024, 'Oppo Find X7 Ultra'],
  ]),
  ...expand('vivo', 'smartphone', [
    ['Vivo V', 2024, 'Vivo V29', 'Vivo V30', 'Vivo V30 Pro', 'Vivo V40', 'Vivo V40 Pro'],
    ['Vivo Y', 2024, 'Vivo Y28', 'Vivo Y200', 'Vivo Y58'],
    ['Vivo X', 2024, 'Vivo X100', 'Vivo X100 Pro'],
  ]),
  ...expand('iqoo', 'smartphone', [
    ['iQOO Neo', 2024, 'iQOO Neo 9 Pro', 'iQOO Neo 10'],
    ['iQOO Z', 2024, 'iQOO Z9', 'iQOO Z9s'],
    ['iQOO Flagship', 2024, 'iQOO 12', 'iQOO 13'],
  ]),
  ...expand('motorola', 'smartphone', [
    ['Moto Edge', 2024, 'Moto Edge 40', 'Moto Edge 50 Fusion', 'Moto Edge 50 Pro'],
    ['Moto G', 2024, 'Moto G54', 'Moto G84', 'Moto G85'],
  ]),
  ...expand('nothing', 'smartphone', [
    ['Nothing Phone', 2024, 'Nothing Phone (1)', 'Nothing Phone (2)', 'Nothing Phone (2a)', 'Nothing Phone (3a)'],
    ['CMF', 2024, 'CMF Phone 1'],
  ]),
  ...expand('nokia', 'smartphone', [['Nokia', 2023, 'Nokia G42 5G', 'Nokia G21', 'Nokia X30', 'Nokia C32']]),
  ...expand('asus', 'smartphone', [['Asus', 2024, 'ROG Phone 7', 'ROG Phone 8', 'Zenfone 10']]),
  ...expand('honor', 'smartphone', [['Honor', 2024, 'Honor 90', 'Honor 200', 'Honor X9b']]),
  ...expand('huawei', 'smartphone', [['Huawei', 2023, 'Huawei P60 Pro', 'Huawei Nova 12']]),
  ...expand('infinix', 'smartphone', [['Infinix', 2024, 'Infinix Note 40', 'Infinix Note 40 Pro', 'Infinix Zero 30', 'Infinix Hot 40']]),
  ...expand('tecno', 'smartphone', [['Tecno', 2024, 'Tecno Camon 30', 'Tecno Spark 20', 'Tecno Pova 6 Pro']]),
  ...expand('lava', 'smartphone', [['Lava', 2024, 'Lava Agni 2', 'Lava Blaze Curve 5G']]),
  ...expand('itel', 'smartphone', [['itel', 2024, 'itel A70', 'itel P55']]),
];

export const devices: DeviceModel[] = [...apple, ...samsung, ...google, ...others];

export const deviceById = new Map(devices.map((device) => [device.id, device]));

export const activeDevices = devices.filter((device) => device.active);

export function devicesForBrand(brandId: string, type?: DeviceType): DeviceModel[] {
  return activeDevices
    .filter((device) => device.brandId === brandId && (!type || device.type === type))
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.name.localeCompare(b.name));
}

export function brandHasType(brandId: string, type: DeviceType): boolean {
  return activeDevices.some((device) => device.brandId === brandId && device.type === type);
}
