import { sha256Short } from './util';

export interface FingerprintInfo {
  canvasHash: string;
  webglVendor: string;
  webglRenderer: string;
  webglHash: string;
  audioHash: string;
  fontsProbe: string;
  compositeHash: string;
}

function canvasFingerprint(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(100, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.font = '16px Arial';
  ctx.fillText('VPN detector 🎭', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.font = '18px Times New Roman';
  ctx.fillText('fingerprint', 4, 45);

  return canvas.toDataURL();
}

function webglInfo(): { vendor: string; renderer: string; payload: string } {
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') ??
    (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
  if (!gl) return { vendor: '—', renderer: '—', payload: '' };

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
    : String(gl.getParameter(gl.VENDOR));
  const renderer = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : String(gl.getParameter(gl.RENDERER));

  const extensions = gl.getSupportedExtensions()?.join(',') ?? '';
  return { vendor, renderer, payload: `${vendor}~${renderer}~${extensions}` };
}

async function audioFingerprint(): Promise<string> {
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return '';

    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gain = context.createGain();
    const processor = context.createScriptProcessor(4096, 1, 1);

    gain.gain.value = 0;
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;

    oscillator.connect(analyser);
    analyser.connect(processor);
    processor.connect(gain);
    gain.connect(context.destination);
    oscillator.start(0);

    const sample = await new Promise<string>((resolve) => {
      processor.onaudioprocess = (event) => {
        const channel = event.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < channel.length; i += 64) sum += Math.abs(channel[i] ?? 0);
        processor.disconnect();
        oscillator.stop();
        void context.close();
        resolve(String(sum));
      };
    });

    return sample;
  } catch {
    return '';
  }
}

function fontsProbe(): string {
  const base = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial',
    'Verdana',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Segoe UI',
    'Roboto',
    'Helvetica',
  ];
  const body = document.body;
  const span = document.createElement('span');
  span.textContent = 'mmmmmmmmmmlli';
  span.style.fontSize = '72px';
  span.style.position = 'absolute';
  span.style.left = '-9999px';
  body.appendChild(span);

  const baseWidths: Record<string, number> = {};
  for (const font of base) {
    span.style.fontFamily = font;
    baseWidths[font] = span.offsetWidth;
  }

  const detected: string[] = [];
  for (const font of testFonts) {
    let match = false;
    for (const baseFont of base) {
      span.style.fontFamily = `"${font}", ${baseFont}`;
      if (span.offsetWidth !== baseWidths[baseFont]) {
        match = true;
        break;
      }
    }
    if (match) detected.push(font);
  }

  body.removeChild(span);
  return detected.join(', ') || '—';
}

export async function collectFingerprint(): Promise<FingerprintInfo> {
  const canvasPayload = canvasFingerprint();
  const webgl = webglInfo();
  const audioPayload = await audioFingerprint();
  const fonts = fontsProbe();

  const canvasHash = await sha256Short(canvasPayload || 'no-canvas');
  const webglHash = await sha256Short(webgl.payload || 'no-webgl');
  const audioHash = await sha256Short(audioPayload || 'no-audio');
  const compositeHash = await sha256Short(
    [canvasPayload, webgl.payload, audioPayload, fonts, navigator.userAgent, screen.width, screen.height].join(
      '|'
    ),
    20
  );

  return {
    canvasHash,
    webglVendor: webgl.vendor,
    webglRenderer: webgl.renderer,
    webglHash,
    audioHash,
    fontsProbe: fonts,
    compositeHash,
  };
}
