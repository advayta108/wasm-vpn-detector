export interface ClientInfo {
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  platform: string;
  languages: string;
  screen: string;
  availScreen: string;
  colorDepth: number;
  pixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  maxTouchPoints: number;
  cookieEnabled: boolean;
  doNotTrack: string;
  timezone: string;
  timezoneOffset: number;
  storage: string;
  pdfViewerEnabled: boolean;
  webdriver: boolean;
  online: boolean;
  connectionType: string;
  touchSupport: boolean;
}

function parseUserAgent(ua: string): { browser: string; version: string; os: string } {
  let browser = 'Unknown';
  let version = '';
  let os = 'Unknown';

  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
    version = ua.match(/Edg\/([\d.]+)/i)?.[1] ?? '';
  } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    browser = 'Opera';
    version = ua.match(/(?:OPR|Opera)\/([\d.]+)/i)?.[1] ?? '';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/([\d.]+)/i)?.[1] ?? '';
  } else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/([\d.]+)/i)?.[1] ?? '';
  } else if (/Safari\//i.test(ua) && /Version\//i.test(ua)) {
    browser = 'Safari';
    version = ua.match(/Version\/([\d.]+)/i)?.[1] ?? '';
  }

  if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X ([\d_]+)/i.test(ua)) {
    os = `macOS ${ua.match(/Mac OS X ([\d_]+)/i)?.[1]?.replaceAll('_', '.') ?? ''}`.trim();
  } else if (/Android ([\d.]+)/i.test(ua)) {
    os = `Android ${ua.match(/Android ([\d.]+)/i)?.[1] ?? ''}`.trim();
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = ua.match(/iPhone|iPad|iPod/i)?.[0] ?? 'iOS';
  } else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  return { browser, version, os };
}

export function collectClientInfo(): ClientInfo {
  const ua = navigator.userAgent;
  const parsed = parseUserAgent(ua);
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    pdfViewerEnabled?: boolean;
    connection?: { effectiveType?: string };
  };

  const storageParts: string[] = [];
  try {
    localStorage.setItem('__probe', '1');
    localStorage.removeItem('__probe');
    storageParts.push('localStorage');
  } catch {
    /* unavailable */
  }
  try {
    sessionStorage.setItem('__probe', '1');
    sessionStorage.removeItem('__probe');
    storageParts.push('sessionStorage');
  } catch {
    /* unavailable */
  }

  return {
    userAgent: ua,
    browser: parsed.browser,
    browserVersion: parsed.version,
    os: parsed.os,
    platform: navigator.platform,
    languages: navigator.languages?.join(', ') ?? navigator.language,
    screen: `${screen.width}×${screen.height}`,
    availScreen: `${screen.availWidth}×${screen.availHeight}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack ?? 'unspecified',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    storage: storageParts.length > 0 ? storageParts.join(', ') : 'недоступно',
    pdfViewerEnabled: nav.pdfViewerEnabled ?? false,
    webdriver: navigator.webdriver === true,
    online: navigator.onLine,
    connectionType: nav.connection?.effectiveType ?? '—',
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
}
