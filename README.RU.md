<h1 align="center">WASM VPN Detector</h1>

<p align="center">
  <strong>Пример реализации VPN Detector на WebAssembly</strong>
</p>

<p align="center">
  Клиентский чекер VPN/proxy: WASM-поиск IP, утечки DNS/WebRTC, отпечаток браузера, score маскировки 0–100.
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://www.assemblyscript.org/"><img src="https://img.shields.io/badge/AssemblyScript-007ACC?style=for-the-badge&logo=webassembly&logoColor=white" alt="AssemblyScript" /></a>
  <a href="https://webassembly.org/"><img src="https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=webassembly&logoColor=white" alt="WebAssembly" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
</p>

<p align="center">
  <a href="./LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Status-Demo-orange?style=for-the-badge" alt="Demo" />
  <img src="https://img.shields.io/badge/PWA-Установка-863bff?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  <a href="./README.md"><img src="https://img.shields.io/badge/English-0052CC?style=for-the-badge&logo=github&logoColor=white" alt="English" /></a>
  <a href="./README.RU.md"><img src="https://img.shields.io/badge/Русский-0052CC?style=for-the-badge&logo=github&logoColor=white" alt="Русский" /></a>
</p>

<p align="center">
  <a href="https://github.com/advayta108/wasm-vpn-detector/stargazers"><img src="https://img.shields.io/badge/dynamic/json?url=https://api.github.com/repos/advayta108/wasm-vpn-detector&amp;query=%24.stargazers_count&amp;label=stars&amp;style=for-the-badge&amp;logo=github&amp;logoColor=white&amp;color=007ec6" alt="GitHub stars" /></a>
  <a href="https://github.com/advayta108/wasm-vpn-detector/forks"><img src="https://img.shields.io/badge/dynamic/json?url=https://api.github.com/repos/advayta108/wasm-vpn-detector&amp;query=%24.forks_count&amp;label=forks&amp;style=for-the-badge&amp;logo=github&amp;logoColor=white&amp;color=007ec6" alt="GitHub forks" /></a>
  <a href="https://github.com/advayta108/wasm-vpn-detector/releases"><img src="https://img.shields.io/badge/downloads-no%20release-555?style=for-the-badge&amp;logo=github&amp;logoColor=white" alt="GitHub downloads" /></a>
</p>

## О проекте

**WASM VPN Detector** — эталонное браузерное приложение, показывающее, как собрать клиентский чекер утечек VPN/proxy **без бэкенда**. Оно комбинирует независимые сигналы — геолокацию IP, DNS-резолвер, WebRTC ICE-кандидаты, отпечаток браузера, несовпадение часового пояса и языка — и сводит их в единый **score маскировки 0–100** с отчётом в стиле whoer.net.

Ключевая идея — вынести тяжёлую работу в **WebAssembly**: при сборке ~16k CIDR VPN/хостингов/datacenter упаковываются в компактный бинарник (`ranges.bin`), а модуль на AssemblyScript выполняет **бинарный поиск O(log n)** прямо в браузере. Остальное — TypeScript поверх Vite.

### Что внутри

- **Проверка в один клик** — кнопка *Проверить* показывает IP, ASN, DNS-резолвер, утечки WebRTC, окружение клиента и хеш отпечатка на одном экране.
- **WASM-поиск по IP** — быстрое сопоставление IPv4 с базой RU VPS, EU cloud и известных VPN exit-пулов.
- **Детекция утечек** — страна DNS-резолвера vs. exit IP, публичные/приватные WebRTC-адреса, timezone и язык браузера vs. гео.
- **Отпечаток браузера** — canvas, WebGL, audio, шрифты и составной SHA-256 хеш (для демо/обучения, не для трекинга).
- **Устанавливаемое PWA** — после первой загрузки работает офлайн через service worker; можно добавить на домашний экран.

### Как считается оценка

Каждый сигнал добавляет вес в `src/score.ts`. Примеры: IP в известном VPN/datacenter диапазоне (+вес из БД), публичный WebRTC IP ≠ exit IP (+30), DNS-резолвер в другой стране (+25), несовпадение timezone (+20). Итоговый **% маскировки** = `100 − risk score` — чем выше, тем меньше обнаружено утечек.

> ⚠️ **Не для production security-решений.** Это демо архитектуры с ограниченной IP-базой. Реальный антифрод использует серверные сигналы, платные GeoIP/ASN базы, TLS fingerprinting и поведенческий анализ.

> 📢 **Дисклеймер.** Данный проект **не является** средством обхода блокировок РКН. Он предназначен исключительно для проверки уязвимости вашего соединения и настроек VPN-клиента.

---

## 🔍 Сигналы детекции

| Сигнал | Источник | Что проверяет |
|--------|----------|---------------|
| 🧮 **WASM-поиск по диапазонам** | `assembly/index.ts` | Бинарный поиск (O(log n)) по ~16k CIDR VPN/hosting/datacenter |
| 🌍 **Публичный IP и гео** | `src/ip.ts` | Exit IP, город, страна, ASN/org через ipapi.co |
| 🔎 **DNS-резолвер** | `src/dns.ts` | IP/страна резолвера через edns.ip-api.com; DNS leak, если резолвер ≠ гео exit |
| 📡 **WebRTC leak test** | `src/webrtc.ts` | ICE-кандидаты через STUN — утечка локального или альтернативного публичного IP |
| 🕐 **Несовпадение часового пояса** | `src/main.ts` | Timezone браузера (`Intl`) vs. timezone по IP |
| 🗣️ **Несовпадение языка** | `src/main.ts` | Основной язык браузера vs. ожидаемый для страны IP |
| 🏢 **Эвристика ASN/org** | `src/ip.ts` | Ключевые слова в организации (`vpn`, `hosting`, `cloud`, `datacenter`) |
| 🖥️ **Окружение клиента** | `src/client.ts` | ОС, браузер, экран, WebDriver, Do Not Track, cookies |
| 🔐 **Отпечаток браузера** | `src/fingerprint.ts` | Canvas, WebGL, audio, шрифты → составной хеш |

Все сигналы объединяются в `src/score.ts` в единый вердикт.

---

## 🚀 Быстрый старт

```bash
npm install
npm run dev        # http://localhost:5173
```

Продакшен-сборка:

```bash
npm run build      # data + wasm + Vite bundle → dist/
npm run preview
```

`npm run dev` и `npm run build` автоматически:

1. Пересобирают `data/ranges/*.json` → `public/ranges.bin` (`scripts/build-ranges.mjs`)
2. Компилируют `assembly/index.ts` → `public/module.wasm` (`asc`)

---

## 🧱 Структура проекта

```text
wasm-vpn-detector/
├── 📂 assembly/                  # AssemblyScript → WebAssembly
│   ├── index.ts                  # Таблица диапазонов + бинарный поиск
│   └── tsconfig.json
│
├── 📂 data/ranges/               # База CIDR (мержится при сборке)
│   ├── eu-cloud.generated.json   # EU VPS/cloud (sync из disposable/cloud-ip-ranges)
│   ├── ru-vps.json               # Российские VPS/хостинги
│   └── vpn-exit.json             # Известные VPN/datacenter пулы
│
├── 📂 scripts/
│   ├── build-ranges.mjs          # CIDR → бинарный ranges.bin
│   └── sync-ranges.mjs           # Загрузка EU cloud CIDR (npm run sync:ranges)
│
├── 📂 src/                       # TypeScript-приложение (Vite)
│   ├── main.ts                   # UI и оркестрация
│   ├── wasm.ts                   # Загрузка WASM + парсер ranges.bin
│   ├── ip.ts                     # Публичный IP + geo (ipapi.co / ipify.org)
│   ├── webrtc.ts                 # WebRTC leak test
│   ├── score.ts                  # Агрегация сигналов (0–100)
│   ├── pwa.ts                    # Установка PWA + service worker
│   ├── style.css
│   └── assets/
│
├── 📂 public/                    # Статика для Vite
│   ├── module.wasm               # Скомпилированный WASM (в репо для демо)
│   ├── ranges.bin                # Генерируется при сборке (в .gitignore)
│   ├── pwa/                      # PWA-иконки (PNG, iOS + Android)
│   └── favicon.svg
│
├── vite.config.ts                # Vite + vite-plugin-pwa
│
├── 📂 build/                     # Вывод asc для отладки (в .gitignore, кроме .gitignore)
│   └── release.wat               # WAT-дизассемблирование — только локально, не в репо
│
├── 📂 test/
│   └── index.js                  # Smoke-тесты на Node test runner
│
├── 📂 .github/                   # Community standards и Dependabot
├── asconfig.json                 # Таргеты компилятора AssemblyScript
├── index.html                    # Точка входа Vite
├── package.json
└── tsconfig.json
```

### 🔄 Пайплайн сборки

```text
data/ranges.json  ──►  scripts/build-ranges.mjs  ──►  public/ranges.bin
assembly/index.ts ──►  asc (AssemblyScript)       ──►  public/module.wasm
src/*.ts          ──►  tsc + vite build           ──►  dist/
```

---

## 📱 PWA (установка как приложение)

Приложение — **Progressive Web App**: после `npm run build` его можно установить в Chrome/Edge (ПК и Android) или добавить на **экран «Домой»** в Safari на iOS.

- `vite-plugin-pwa` — service worker и web manifest
- `public/pwa/` — PNG-иконки (192, 512, maskable, Apple touch 180×180)
- Кнопка **«Установить приложение»** появляется при событии `beforeinstallprompt`

```bash
npm run build && npm run preview   # проверка установки (или задеплойте на HTTPS)
```

> Бейджи **stars / forks** используют Shields.io `dynamic/json` (публичный GitHub API). Бейдж **downloads** статичный, пока нет [GitHub Release](https://github.com/advayta108/wasm-vpn-detector/releases); после публикации замените на `github/downloads/.../total`.

---

## 📜 npm-скрипты

| Скрипт | Описание |
|--------|----------|
| `npm run dev` | Dev-сервер с hot reload |
| `npm run build` | Полная продакшен-сборка |
| `npm run sync:ranges` | Обновить EU cloud CIDR из GitHub (disposable/cloud-ip-ranges) |
| `npm run build:data` | Только пересборка `public/ranges.bin` |
| `npm run asbuild` | Компиляция WASM (debug + release) |
| `npm run generate:pwa-icons` | Пересборка PWA-иконок из `favicon.svg` |
| `npm test` | Smoke-тесты Node |

---

## ⚠️ Известные ограничения

- 📦 **~16k IPv4-диапазонов** после merge — RU VPS (Selectel, Timeweb, Aeza…), EU cloud (Hetzner, OVH, DO, Vultr…), VPN-пулы. `npm run sync:ranges` обновляет EU-данные.
- 🌍 **Бесплатный geo API** (`ipapi.co`) с дневными лимитами; для прода нужен платный провайдер.
- 🔒 **WebRTC** может блокироваться приватными браузерами/расширениями — сигнал тихо пропускается.
- 🛡️ **Только клиентские эвристики** обходятся продвинутым VPN (свой DNS, блок WebRTC, IP вне списков).

---

## 📄 Лицензия

MIT — см. [LICENSE.md](./LICENSE.md).
