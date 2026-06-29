import { escapeHtml } from './util';

export function countryFlagImg(
  code: string | undefined,
  size: 'sm' | 'md' | 'lg' = 'sm'
): string {
  if (!code || code.length !== 2) {
    return '<span class="inline-block text-muted" aria-hidden="true">🌐</span>';
  }

  const lower = code.toLowerCase();
  const sizes = {
    sm: { w: 20, h: 15, class: 'h-[15px] w-5' },
    md: { w: 32, h: 24, class: 'h-6 w-8' },
    lg: { w: 56, h: 42, class: 'h-10 w-14' },
  };
  const { w, h, class: sizeClass } = sizes[size];

  return `<img src="https://flagcdn.com/${w}x${h}/${lower}.png" width="${w}" height="${h}" alt="${escapeHtml(code.toUpperCase())}" class="inline-block ${sizeClass} rounded-sm object-cover shadow-sm align-middle" loading="lazy" decoding="async" />`;
}

export type DnsProvider = 'google' | 'cloudflare';

export function detectDnsProvider(isp?: string, resolverIp?: string): DnsProvider | undefined {
  const hay = `${isp ?? ''} ${resolverIp ?? ''}`.toLowerCase();
  if (/google/.test(hay)) return 'google';
  if (/cloudflare/.test(hay)) return 'cloudflare';
  if (resolverIp?.startsWith('172.217.') || resolverIp === '8.8.8.8' || resolverIp === '8.8.4.4') {
    return 'google';
  }
  if (
    resolverIp === '1.1.1.1' ||
    resolverIp === '1.0.0.1' ||
    resolverIp?.startsWith('104.16.') ||
    resolverIp?.startsWith('172.64.')
  ) {
    return 'cloudflare';
  }
  return undefined;
}

export function dnsProviderLogo(provider: DnsProvider | undefined, size = 16): string {
  if (!provider) return '';

  if (provider === 'google') {
    return `<img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" width="${size}" height="${size}" alt="Google DNS" class="inline-block align-middle" loading="lazy" decoding="async" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" class="inline-block align-middle" aria-label="Cloudflare DNS" role="img"><path fill="#F38020" d="M13.3 8.4c-.2-1.1-1.2-2-2.4-2-1.1 0-2 .7-2.3 1.7-.2-.1-.4-.1-.6-.1-1.5 0-2.7 1.2-2.7 2.7 0 .2 0 .4.1.6C4.1 11.8 3 13.2 3 15c0 1.9 1.5 3.4 3.4 3.4h9.5c2 0 3.6-1.6 3.6-3.6 0-1.9-1.5-3.5-3.4-3.6-.1-1.5-1.4-2.6-2.8-2.8z"/></svg>`;
}

export function githubIcon(size = 16): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`;
}
