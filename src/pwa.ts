import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function setupPwaInstall(installBtn: HTMLButtonElement): void {
  if (window.electronAPI?.isElectron) {
    installBtn.hidden = true;
    return;
  }

  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);

  if (isStandalone) {
    installBtn.hidden = true;
    return;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    installBtn.hidden = false;
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;

    if (outcome === 'accepted') {
      installBtn.hidden = true;
    }
  });

  window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
    deferredPrompt = null;
  });
}

export function registerServiceWorker(): void {
  if (window.electronAPI?.isElectron) {
    return;
  }

  if (import.meta.env.DEV) {
    void navigator.serviceWorker?.getRegistrations().then((regs) => {
      for (const reg of regs) void reg.unregister();
    });
    return;
  }

  registerSW({
    immediate: true,
    onNeedRefresh() {
      // Не перезагружаем страницу автоматически — результаты проверки остаются на экране
    },
  });
}
