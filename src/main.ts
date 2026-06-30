import './style.css';
import { collectClientInfo } from './client';
import { probeDns } from './dns';
import { collectFingerprint } from './fingerprint';
import { fetchPublicIp } from './ip';
import { registerServiceWorker, setupPwaInstall } from './pwa';
import { bindResultActions, renderResults } from './render';
import { githubIcon } from './icons';
import { combineSignals, type Signal } from './score';
import { buildRangeIndex, ipToUint32 } from './wasm';
import { classifyWebrtcIps, getWebrtcCandidateIps } from './webrtc';

registerServiceWorker();

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="w-full max-w-[920px] rounded-2xl bg-surface p-7 shadow-2xl shadow-black/40">
    <h1 class="m-0 text-2xl font-semibold">VPN / Proxy Detector</h1>
    <p class="mt-1 mb-5 text-base leading-relaxed text-muted">
      Утечки DNS и WebRTC · геолокация и часовой пояс · отпечаток браузера · проверка IP по базе VPN/хостингов · оценка прокси и анонимайзера
    </p>
    <div class="mb-1 flex flex-wrap justify-center gap-2.5">
      <button id="run" type="button" class="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-base text-white transition hover:opacity-85 disabled:opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
        Проверить
      </button>
      <button id="install" type="button" hidden class="rounded-lg border border-[#3a3f4b] bg-transparent px-5 py-3 text-base transition hover:border-accent hover:text-accent disabled:opacity-50">Установить приложение</button>
    </div>
    <div id="status" class="mt-3 min-h-[1.4em] text-center text-base text-muted"></div>
    <div id="result" class="result"></div>
    <footer class="mt-8 border-t border-border pt-5 text-center text-xs text-muted">
      <a
        href="https://github.com/advayta108/wasm-vpn-detector"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 transition hover:text-accent"
      >
        ${githubIcon(16)}
        <span>advayta108/wasm-vpn-detector</span>
      </a>
      <p class="mt-2 m-0">Made with ❤️ for РКН</p>
    </footer>
  </main>
`;

const runBtn = document.querySelector<HTMLButtonElement>('#run')!;
const installBtn = document.querySelector<HTMLButtonElement>('#install')!;
setupPwaInstall(installBtn);
const statusEl = document.querySelector<HTMLDivElement>('#status')!;
const resultEl = document.querySelector<HTMLDivElement>('#result')!;

function setStatus(text: string) {
  statusEl.textContent = text;
}

async function run() {
  runBtn.disabled = true;
  resultEl.innerHTML = '';
  const signals: Signal[] = [];
  const client = collectClientInfo();

  try {
    setStatus('Загружаю таблицу диапазонов в WASM…');
    const rangesBuf = await fetch(`${import.meta.env.BASE_URL}ranges.bin`).then((r) => r.arrayBuffer());
    const wasmMod = await buildRangeIndex(rangesBuf);

    setStatus('Собираю отпечаток браузера…');
    const fingerprint = await collectFingerprint();

    setStatus('Определяю публичный IP и геолокацию…');
    const ipInfo = await fetchPublicIp();

    setStatus('Проверяю DNS-резолвер…');
    const dns = await probeDns(ipInfo.ip, ipInfo.countryCode, ipInfo.country);

    const ipInt = ipToUint32(ipInfo.ip);
    const matchWeight = wasmMod.lookup(ipInt);
    if (matchWeight >= 0) {
      signals.push({
        name: 'IP в базе VPN/хостинг-диапазонов',
        detail: `${ipInfo.ip} попадает в известный VPN/datacenter диапазон (вес ${matchWeight})`,
        weight: matchWeight,
      });
    } else {
      signals.push({
        name: 'IP не в базе диапазонов',
        detail: `${ipInfo.ip} не найден в локальной базе из ${wasmMod.rangeCount()} диапазонов`,
        weight: 0,
      });
    }

    if (ipInfo.org && /(vpn|hosting|cloud|datacenter|data center|colo)/i.test(ipInfo.org)) {
      signals.push({
        name: 'Подозрительное название организации (ASN)',
        detail: `Организация по IP: "${ipInfo.org}"`,
        weight: 25,
      });
    }

    if (dns.leakSuspected) {
      signals.push({
        name: 'Возможная DNS-утечка',
        detail: dns.detail,
        weight: 25,
      });
    }

    setStatus('Проверяю WebRTC…');
    const webrtcIps = await getWebrtcCandidateIps();
    const webrtc = classifyWebrtcIps(webrtcIps);

    if (webrtc.privateIps.length > 0) {
      signals.push({
        name: 'WebRTC видит приватный IP за NAT',
        detail: `Локальные адреса: ${webrtc.privateIps.join(', ')}`,
        weight: 10,
      });
    }
    if (webrtc.publicIps.length > 0 && !webrtc.publicIps.includes(ipInfo.ip)) {
      signals.push({
        name: 'WebRTC leak: публичный IP отличается от внешнего',
        detail: `WebRTC: ${webrtc.publicIps.join(', ')}, внешний IP: ${ipInfo.ip}`,
        weight: 30,
      });
    }

    if (ipInfo.timezone && client.timezone !== ipInfo.timezone) {
      signals.push({
        name: 'Часовой пояс браузера ≠ геолокация IP',
        detail: `Браузер: ${client.timezone}, по IP: ${ipInfo.timezone}`,
        weight: 20,
      });
    }

    const primaryLang = client.languages.split(',')[0]?.trim().slice(0, 2);
    const countryLang: Record<string, string> = {
      NL: 'nl',
      DE: 'de',
      US: 'en',
      GB: 'en',
      FR: 'fr',
      RU: 'ru',
    };
    if (
      ipInfo.countryCode &&
      primaryLang &&
      countryLang[ipInfo.countryCode] &&
      primaryLang !== countryLang[ipInfo.countryCode]
    ) {
      signals.push({
        name: 'Язык браузера не совпадает со страной IP',
        detail: `Язык: ${client.languages}, страна IP: ${ipInfo.country}`,
        weight: 10,
      });
    }

    if (client.webdriver) {
      signals.push({
        name: 'Обнаружен режим WebDriver',
        detail: 'Браузер управляется автоматизацией (Selenium/Puppeteer и т.п.)',
        weight: 15,
      });
    }

    const verdict = combineSignals(signals);
    setStatus('');
    resultEl.innerHTML = renderResults({
      ipInfo,
      client,
      fingerprint,
      dns,
      webrtc,
      verdict,
      rangeCount: wasmMod.rangeCount(),
    });
    bindResultActions(resultEl);
  } catch (err) {
    setStatus('');
    resultEl.innerHTML = `<p class="text-rose-400">Ошибка: ${(err as Error).message}</p>`;
  } finally {
    runBtn.disabled = false;
  }
}

runBtn.addEventListener('click', (e) => {
  e.preventDefault();
  void run();
});
