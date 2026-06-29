export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function countryFlag(code: string | undefined): string {
  if (!code || code.length !== 2) return '🌐';
  const upper = code.toUpperCase();
  const points = [...upper].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...points);
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  Germany: 'DE',
  Deutschland: 'DE',
  Netherlands: 'NL',
  'The Netherlands': 'NL',
  'United States': 'US',
  'United Kingdom': 'GB',
  Russia: 'RU',
  'Russian Federation': 'RU',
  France: 'FR',
  Italy: 'IT',
  Spain: 'ES',
  Poland: 'PL',
  Ukraine: 'UA',
  Sweden: 'SE',
  Norway: 'NO',
  Finland: 'FI',
  Switzerland: 'CH',
  Austria: 'AT',
  Belgium: 'BE',
  Czechia: 'CZ',
  'Czech Republic': 'CZ',
  Romania: 'RO',
  Bulgaria: 'BG',
  Turkey: 'TR',
  Canada: 'CA',
  Australia: 'AU',
  Japan: 'JP',
  China: 'CN',
  'Hong Kong': 'HK',
  Singapore: 'SG',
  India: 'IN',
  Brazil: 'BR',
  Ireland: 'IE',
  Denmark: 'DK',
  Portugal: 'PT',
  Greece: 'GR',
  Hungary: 'HU',
  Slovakia: 'SK',
  Lithuania: 'LT',
  Latvia: 'LV',
  Estonia: 'EE',
  Luxembourg: 'LU',
  Iceland: 'IS',
  Israel: 'IL',
  'South Korea': 'KR',
  Korea: 'KR',
  Mexico: 'MX',
  Argentina: 'AR',
  'New Zealand': 'NZ',
  'South Africa': 'ZA',
  Serbia: 'RS',
  Croatia: 'HR',
  Slovenia: 'SI',
  Moldova: 'MD',
  Belarus: 'BY',
  Kazakhstan: 'KZ',
};

/** Maps a country name or 2-letter code from DNS/geo APIs to ISO 3166-1 alpha-2. */
export function countryNameToCode(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const trimmed = name.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  return COUNTRY_NAME_TO_CODE[trimmed] ?? COUNTRY_NAME_TO_CODE[trimmed.replace(/^The\s+/i, '')];
}

export async function sha256Short(input: string, length = 16): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, length);
}

export function yesNo(value: boolean): string {
  return value ? 'Да' : 'Нет';
}
