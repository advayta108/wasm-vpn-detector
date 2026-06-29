// Public-IP + geo lookup. Browsers can't learn their own public IP without
// asking an external service, so we hit a small CORS-enabled API.

export interface PublicIpInfo {
  ip: string;
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  timezone?: string;
  org?: string;
  asn?: string;
}

/**
 * Primary source: ipapi.co (CORS-enabled, free tier ~1000 req/day/IP).
 * Falls back to api.ipify.org (IP only, no geo) if ipapi.co fails or is rate-limited.
 */
export async function fetchPublicIp(): Promise<PublicIpInfo> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error(`ipapi.co responded ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.reason ?? 'ipapi.co error');
    return {
      ip: data.ip,
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      region: data.region,
      timezone: data.timezone,
      org: data.org,
      asn: data.asn,
    };
  } catch {
    const res = await fetch('https://api.ipify.org?format=json');
    if (!res.ok) throw new Error(`ipify responded ${res.status}`);
    const data = await res.json();
    return { ip: data.ip };
  }
}
