import { countryNameToCode } from './util';

export interface DnsInfo {
  resolverIp?: string;
  country?: string;
  countryName?: string;
  countryCode?: string;
  isp?: string;
  leakSuspected: boolean;
  detail: string;
}

function parseDnsGeo(geo: string): { countryName: string; countryCode?: string } {
  const countryName = geo.split(' - ')[0]?.trim() || geo.trim();
  return {
    countryName,
    countryCode: countryNameToCode(countryName),
  };
}

function formatDnsDetail(
  resolverIp: string,
  countryName: string,
  countryCode: string | undefined,
  isp: string | undefined,
  leakSuspected: boolean,
  publicIp: string,
  publicCountryCode?: string,
  publicCountry?: string
): string {
  const dnsLabel = [countryName, isp].filter(Boolean).join(' · ');
  if (!leakSuspected) {
    return dnsLabel ? `${resolverIp} — ${dnsLabel}` : resolverIp;
  }

  const exitLabel = publicCountry ?? publicCountryCode ?? publicIp;
  const dnsCountry = countryCode ? `${countryCode} ${countryName}` : countryName;
  const exitCountry = publicCountryCode
    ? `${publicCountryCode} ${publicCountry ?? ''}`.trim()
    : exitLabel;
  return `Утечка DNS: резолвер в ${dnsCountry}, exit IP в ${exitCountry}`;
}

/**
 * Uses edns.ip-api.com — the resolver IP seen when the browser performs DNS
 * lookup (common client-side DNS leak probe, similar to whoer.net).
 */
export async function probeDns(
  publicIp: string,
  publicCountryCode?: string,
  publicCountry?: string
): Promise<DnsInfo> {
  try {
    const res = await fetch('https://edns.ip-api.com/json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`edns ${res.status}`);
    const data = (await res.json()) as {
      dns?: { ip?: string; geo?: string; isp?: string };
    };

    const resolverIp = data.dns?.ip;
    if (!resolverIp) {
      return {
        leakSuspected: false,
        detail: 'Резолвер DNS не определён (браузер/расширение могли скрыть запрос)',
      };
    }

    const geo = data.dns?.geo ?? '';
    const isp = data.dns?.isp;
    const { countryName, countryCode } = parseDnsGeo(geo);
    const leakSuspected = Boolean(
      publicCountryCode &&
        countryCode &&
        countryCode.toUpperCase() !== publicCountryCode.toUpperCase()
    );

    return {
      resolverIp,
      country: geo || countryName,
      countryName,
      countryCode,
      isp,
      leakSuspected,
      detail: formatDnsDetail(
        resolverIp,
        countryName,
        countryCode,
        isp,
        leakSuspected,
        publicIp,
        publicCountryCode,
        publicCountry
      ),
    };
  } catch {
    return {
      leakSuspected: false,
      detail: 'Проверка DNS недоступна (CORS, блокировка или offline)',
    };
  }
}
