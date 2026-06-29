import type { ClientInfo } from './client';
import type { DnsInfo } from './dns';
import type { FingerprintInfo } from './fingerprint';
import {
  countryFlagImg,
  detectDnsProvider,
  dnsProviderLogo,
} from './icons';
import type { PublicIpInfo } from './ip';
import type { Verdict, Signal } from './score';
import type { WebrtcResult } from './webrtc';
import { escapeHtml, yesNo } from './util';
import { scoreTone } from './ui';

export interface RenderContext {
  ipInfo: PublicIpInfo;
  client: ClientInfo;
  fingerprint: FingerprintInfo;
  dns: DnsInfo;
  webrtc: WebrtcResult;
  verdict: Verdict;
  rangeCount: number;
}

function metric(
  label: string,
  value: string,
  hint?: string,
  valueIsHtml = false,
  hintIsHtml = false
): string {
  const valueBlock = valueIsHtml
    ? `<div class="text-sm leading-snug font-semibold wrap-break-word">${value}</div>`
    : `<div class="text-sm leading-snug font-semibold wrap-break-word">${escapeHtml(value)}</div>`;
  const hintBlock = hint
    ? hintIsHtml
      ? `<div class="mt-1.5 text-xs leading-snug text-muted">${hint}</div>`
      : `<div class="mt-1.5 text-xs leading-snug text-muted">${escapeHtml(hint)}</div>`
    : '';

  return `
    <div class="min-h-[78px] rounded-xl border border-border bg-panel p-3">
      <div class="mb-1.5 text-[0.72rem] uppercase tracking-wide text-muted">${escapeHtml(label)}</div>
      ${valueBlock}
      ${hintBlock}
    </div>
  `;
}

function row(label: string, value: string): string {
  return `<tr class="border-b border-border last:border-0"><td class="w-[38%] px-3.5 py-2.5 text-muted align-top whitespace-nowrap sm:whitespace-normal">${escapeHtml(label)}</td><td class="px-3.5 py-2.5 align-top">${value}</td></tr>`;
}

function maskingLabel(masking: number): string {
  if (masking >= 80) return 'Хорошая маскировка, незначительные замечания';
  if (masking >= 50) return 'Средняя маскировка, есть отдельные утечки';
  return 'Слабая маскировка, вероятен VPN/proxy или утечки';
}

const ok = '<span class="font-semibold text-emerald-400">Нет</span>';
const warn = '<span class="font-semibold text-amber-400">Подозрение</span>';
const warnVpn = '<span class="font-semibold text-amber-400">Вероятно VPN</span>';

function hasSignal(signals: Signal[], pattern: RegExp): boolean {
  return signals.some((s) => s.weight > 0 && (pattern.test(s.name) || pattern.test(s.detail)));
}

function formatDnsMetric(
  dns: DnsInfo,
  ipInfo: PublicIpInfo
): { value: string; hint?: string; hintIsHtml?: boolean } {
  if (!dns.resolverIp) {
    return { value: '—', hint: dns.detail };
  }

  const provider = detectDnsProvider(dns.isp, dns.resolverIp);
  const providerLogo = dnsProviderLogo(provider, 18);
  const dnsFlag = countryFlagImg(dns.countryCode);
  const exitFlag = countryFlagImg(ipInfo.countryCode);
  const dnsPlace = [dns.countryName, dns.isp].filter(Boolean).join(' · ');
  const exitPlace = ipInfo.country ?? ipInfo.countryCode ?? ipInfo.ip;

  if (dns.leakSuspected) {
    const hint = `
      <div class="flex items-center gap-1.5">
        ${providerLogo}${dnsFlag}
        <span>${escapeHtml(dnsPlace || '—')}</span>
      </div>
      <div class="mt-1 flex flex-wrap items-center gap-1 text-amber-400">
        <span>Утечка:</span>
        ${dnsFlag}<span>DNS</span>
        <span>≠</span>
        ${exitFlag}<span>exit ${escapeHtml(exitPlace)}</span>
      </div>
    `;
    return {
      value: `${providerLogo}<span class="ml-1">${escapeHtml(dns.resolverIp)}</span>`,
      hint,
      hintIsHtml: true,
    };
  }

  const hint = dnsPlace
    ? `<span class="inline-flex items-center gap-1.5">${providerLogo}${dnsFlag}<span>${escapeHtml(dnsPlace)}</span></span>`
    : undefined;
  return {
    value: `${providerLogo}<span class="ml-1">${escapeHtml(dns.resolverIp)}</span>`,
    hint,
    hintIsHtml: Boolean(hint),
  };
}

function formatLocation(ipInfo: PublicIpInfo): string {
  const parts = [ipInfo.city, ipInfo.region, ipInfo.country].filter(Boolean);
  if (parts.length === 0) return '—';
  return escapeHtml(parts.join(' · '));
}

function formatRangeNote(rangeCount: number): string {
  const base = `⚠️ База диапазонов: <strong>${rangeCount}</strong> CIDR (RU VPS + EU cloud + VPN pools). Источник EU: <a class="text-accent underline" href="https://github.com/disposable/cloud-ip-ranges" target="_blank" rel="noopener noreferrer">disposable/cloud-ip-ranges</a>.`;
  if (import.meta.env.DEV) {
    return `${base} Обновление: <code class="rounded bg-panel px-1">npm run sync:ranges</code>.`;
  }
  return `${base}`;
}

export function renderResults(ctx: RenderContext): string {
  const { ipInfo, client, fingerprint, dns, webrtc, verdict, rangeCount } = ctx;
  const tone = scoreTone(verdict.score);
  const masking = Math.max(0, Math.min(100, 100 - verdict.score));
  const location = formatLocation(ipInfo);
  const hostLabel = ipInfo.org?.split(' ')[0] ?? '—';

  const vpnLikely = hasSignal(verdict.signals, /базе VPN|VPN\/хостинг|организации \(ASN\)/i);
  const proxyLikely = hasSignal(verdict.signals, /DNS|WebRTC/i) || verdict.score >= 35;

  const webrtcSummary =
    webrtc.publicIps.length > 0
      ? `Публичные: ${webrtc.publicIps.join(', ')}`
      : webrtc.privateIps.length > 0
        ? `Локальные: ${webrtc.privateIps.join(', ')}`
        : 'Кандидаты не получены';

  const dnsMetric = formatDnsMetric(dns, ipInfo);
  const dnsProvider = detectDnsProvider(dns.isp, dns.resolverIp);
  const dnsProviderLabel =
    dns.isp ??
    (dnsProvider === 'google' ? 'Google Public DNS' : dnsProvider === 'cloudflare' ? 'Cloudflare DNS' : undefined);
  const dnsProviderRow = dnsProviderLabel
    ? `<span class="inline-flex items-center gap-1.5">${dnsProviderLogo(dnsProvider, 18)}${escapeHtml(dnsProviderLabel)}</span>`
    : '—';
  const dnsCountryRow = dns.countryName
    ? `<span class="inline-flex items-center gap-1.5">${countryFlagImg(dns.countryCode)}<span>${escapeHtml(dns.countryName)}${dns.countryCode ? ` (${escapeHtml(dns.countryCode)})` : ''}</span></span>`
    : escapeHtml(dns.country ?? '—');

  return `
    <section class="mt-5 flex items-center gap-4 rounded-xl border border-border bg-panel p-4">
      <div class="shrink-0">${countryFlagImg(ipInfo.countryCode, 'lg')}</div>
      <div>
        <div class="flex flex-wrap items-center gap-2 text-lg">
          <span>Мой IP:</span>
          <strong class="text-xl tracking-wide" id="my-ip">${escapeHtml(ipInfo.ip)}</strong>
          <button type="button" class="rounded-md bg-accent px-2 py-0.5 text-sm text-white" data-copy="${escapeHtml(ipInfo.ip)}" title="Копировать">📋</button>
        </div>
        <div class="mt-1 text-sm text-muted">${location}</div>
      </div>
    </section>

    <div class="mt-4 flex items-center gap-4 rounded-xl border p-4 ${tone}">
      <div class="text-3xl font-bold">${verdict.score}/100</div>
      <div class="text-sm">${escapeHtml(verdict.label)}</div>
    </div>

    <div class="mt-3 flex items-center gap-3 rounded-xl border p-3.5 text-sm ${tone}">
      <span class="text-2xl">🛡️</span>
      <div>
        <strong>Ваша маскировка: ${masking}%</strong>
        <div class="mt-1 text-xs opacity-90">${maskingLabel(masking)}</div>
      </div>
    </div>

    <section class="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5">
      ${metric('Провайдер', escapeHtml(ipInfo.org ?? '—'), ipInfo.asn ? `ASN ${escapeHtml(ipInfo.asn)}` : undefined)}
      ${metric('DNS', dnsMetric.value, dnsMetric.hint, true, dnsMetric.hintIsHtml)}
      ${metric('Хост', escapeHtml(hostLabel))}
      ${metric('ОС', escapeHtml(client.os))}
      ${metric('Браузер', `${escapeHtml(client.browser)} ${escapeHtml(client.browserVersion)}`.trim())}
      ${metric('Прокси', proxyLikely ? warn : ok, undefined, true)}
      ${metric('Анонимайзер', vpnLikely ? warnVpn : ok, undefined, true)}
      ${metric('WebRTC', escapeHtml(webrtcSummary))}
    </section>

    <h2 class="mt-7 mb-2.5 text-base font-semibold">🌐 Сеть и геолокация</h2>
    <table class="w-full overflow-hidden rounded-xl border border-border bg-panel text-sm">
      <tbody>
        ${row('IP', `<span class="inline-flex items-center gap-1.5">${countryFlagImg(ipInfo.countryCode)}<code class="rounded bg-[#12151c] px-1.5 py-0.5 text-xs">${escapeHtml(ipInfo.ip)}</code></span>`)}
        ${row('Страна', `<span class="inline-flex items-center gap-1.5">${countryFlagImg(ipInfo.countryCode)}<span>${escapeHtml(ipInfo.country ?? '—')}${ipInfo.countryCode ? ` <span class="text-muted">(${escapeHtml(ipInfo.countryCode)})</span>` : ''}</span></span>`)}
        ${row('Город / регион', location)}
        ${row('Организация / ASN', escapeHtml([ipInfo.org, ipInfo.asn].filter(Boolean).join(' · ') || '—'))}
        ${row('Часовой пояс (IP)', escapeHtml(ipInfo.timezone ?? '—'))}
        ${row('Часовой пояс (браузер)', escapeHtml(client.timezone))}
        ${row('Смещение UTC', `${escapeHtml(String(client.timezoneOffset))} мин`)}
        ${row('DNS-резолвер', `<span class="inline-flex items-center gap-1.5">${dnsProviderLogo(dnsProvider, 18)}${countryFlagImg(dns.countryCode)}<code class="rounded bg-[#12151c] px-1.5 py-0.5 text-xs">${escapeHtml(dns.resolverIp ?? '—')}</code></span>`)}
        ${row('DNS страна', dnsCountryRow)}
        ${row('DNS провайдер', dnsProviderRow)}
        ${row('DNS статус', dns.leakSuspected ? '<span class="font-semibold text-amber-400">Утечка — страна DNS ≠ exit IP</span>' : ok)}
      </tbody>
    </table>

    <h2 class="mt-7 mb-2.5 text-base font-semibold">💻 Клиент и окружение</h2>
    <table class="w-full overflow-hidden rounded-xl border border-border bg-panel text-sm">
      <tbody>
        ${row('User-Agent', `<code class="block rounded bg-[#12151c] px-1.5 py-0.5 text-xs break-all">${escapeHtml(client.userAgent)}</code>`)}
        ${row('Платформа', escapeHtml(client.platform))}
        ${row('Языки', escapeHtml(client.languages))}
        ${row('Экран', escapeHtml(`${client.screen} (доступно ${client.availScreen})`))}
        ${row('Глубина цвета', escapeHtml(String(client.colorDepth)))}
        ${row('Pixel ratio', escapeHtml(String(client.pixelRatio)))}
        ${row('CPU ядра', escapeHtml(String(client.hardwareConcurrency)))}
        ${row('Память устройства', escapeHtml(client.deviceMemory != null ? `${client.deviceMemory} GB` : '—'))}
        ${row('Touch', yesNo(client.touchSupport))}
        ${row('Cookies', yesNo(client.cookieEnabled))}
        ${row('Do Not Track', escapeHtml(client.doNotTrack))}
        ${row('Webdriver', client.webdriver ? '<span class="font-semibold text-amber-400">Да (автоматизация)</span>' : ok)}
        ${row('Online', yesNo(client.online))}
        ${row('Сеть', escapeHtml(client.connectionType))}
        ${row('Хранилища', escapeHtml(client.storage))}
      </tbody>
    </table>

    <h2 class="mt-7 mb-2.5 text-base font-semibold">🎭 Отпечаток браузера (fingerprint)</h2>
    <table class="w-full overflow-hidden rounded-xl border border-border bg-panel text-sm">
      <tbody>
        ${row('Composite ID', `<code class="font-mono text-xs tracking-wide">${escapeHtml(fingerprint.compositeHash)}</code>`)}
        ${row('Canvas hash', `<code class="font-mono text-xs">${escapeHtml(fingerprint.canvasHash)}</code>`)}
        ${row('WebGL hash', `<code class="font-mono text-xs">${escapeHtml(fingerprint.webglHash)}</code>`)}
        ${row('Audio hash', `<code class="font-mono text-xs">${escapeHtml(fingerprint.audioHash)}</code>`)}
        ${row('WebGL vendor', escapeHtml(fingerprint.webglVendor))}
        ${row('WebGL renderer', escapeHtml(fingerprint.webglRenderer))}
        ${row('Шрифты (probe)', escapeHtml(fingerprint.fontsProbe))}
      </tbody>
    </table>

    <h2 class="mt-7 mb-2.5 text-base font-semibold">📡 Сигналы детекции</h2>
    <ul class="space-y-2 p-0 list-none">
      ${verdict.signals
        .map(
          (s: Signal) =>
            `<li class="relative rounded-lg border border-border bg-panel px-3.5 py-3"><span class="float-right rounded-md bg-accent px-2 py-0.5 text-xs text-white">+${s.weight}</span><b>${escapeHtml(s.name)}</b><br><small class="text-muted">${escapeHtml(s.detail)}</small></li>`
        )
        .join('')}
    </ul>

    <p class="mt-5 text-xs leading-relaxed text-muted">
      ${formatRangeNote(rangeCount)}
    </p>
  `;
}

export function bindResultActions(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        btn.textContent = '✓';
        setTimeout(() => {
          btn.textContent = '📋';
        }, 1200);
      } catch {
        /* clipboard blocked */
      }
    });
  });
}
