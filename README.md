<h1 align="center">WASM VPN Detector</h1>

<p align="center">
  <strong>Example implementation of a VPN Detector with WebAssembly</strong>
</p>

<p align="center">
  Client-side VPN/proxy checker with WASM IP lookup, DNS &amp; WebRTC leaks, fingerprint and 0–100 masking score.
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://www.assemblyscript.org/"><img src="https://img.shields.io/badge/AssemblyScript-007ACC?style=for-the-badge&logo=webassembly&logoColor=white" alt="AssemblyScript" /></a>
  <a href="https://webassembly.org/"><img src="https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=webassembly&logoColor=white" alt="WebAssembly" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
</p>

<p align="center">
  <a href="./LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Status-Demo-orange?style=for-the-badge" alt="Demo" />
  <img src="https://img.shields.io/badge/PWA-Installable-863bff?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  <a href="./README.md"><img src="https://img.shields.io/badge/English-0052CC?style=for-the-badge&logo=github&logoColor=white" alt="English" /></a>
  <a href="./README.RU.md"><img src="https://img.shields.io/badge/Русский-0052CC?style=for-the-badge&logo=github&logoColor=white" alt="Русский" /></a>
</p>

<p align="center">
  <a href="https://github.com/advayta108/wasm-vpn-detector/stargazers"><img src="https://img.shields.io/badge/dynamic/json?url=https://api.github.com/repos/advayta108/wasm-vpn-detector&amp;query=%24.stargazers_count&amp;label=stars&amp;style=for-the-badge&amp;logo=github&amp;logoColor=white&amp;color=007ec6" alt="GitHub stars" /></a>
  <a href="https://github.com/advayta108/wasm-vpn-detector/forks"><img src="https://img.shields.io/badge/dynamic/json?url=https://api.github.com/repos/advayta108/wasm-vpn-detector&amp;query=%24.forks_count&amp;label=forks&amp;style=for-the-badge&amp;logo=github&amp;logoColor=white&amp;color=007ec6" alt="GitHub forks" /></a>
  <a href="https://github.com/advayta108/wasm-vpn-detector/releases"><img src="https://img.shields.io/badge/downloads-no%20release-555?style=for-the-badge&amp;logo=github&amp;logoColor=white" alt="GitHub downloads" /></a>
</p>

## About

**WASM VPN Detector** is a reference browser app that shows how to build a client-side VPN/proxy leak checker without a backend. It combines several independent signals — IP geolocation, DNS resolver probe, WebRTC ICE candidates, browser fingerprint, timezone and language mismatches — and aggregates them into a single **0–100 masking score** with a whoer.net-style report.

The core idea is to offload the heaviest work to **WebAssembly**: at build time, ~16k VPN/hosting/datacenter CIDR ranges are packed into a compact binary (`ranges.bin`), and an AssemblyScript module performs **O(log n) binary search** over that table directly in the browser. Everything else runs in TypeScript on top of Vite.

### What you get

- **One-click audit** — press *Check* and see IP, ASN, DNS resolver, WebRTC leaks, client environment, and fingerprint hash in a single dashboard.
- **WASM IP lookup** — fast IPv4 range matching against RU VPS providers, EU cloud IP lists, and known VPN exit pools.
- **Leak detection** — DNS resolver country vs. exit IP, WebRTC public/private candidates, timezone and browser language vs. geo.
- **Browser fingerprint** — canvas, WebGL, audio, fonts, and a composite SHA-256 hash (for demo/education, not device tracking).
- **Installable PWA** — works offline after first load via service worker; add to home screen on mobile.

### How scoring works

Each signal contributes a weighted score in `src/score.ts`. Examples: IP in a known VPN/datacenter range (+weight from DB), WebRTC public IP differs from exit IP (+30), DNS resolver in another country (+25), timezone mismatch (+20). The final **masking %** is `100 − risk score` — higher is better (fewer leaks detected).

> ⚠️ **Not for production security decisions.** This is an architecture demo with a limited IP dataset. Real anti-fraud systems rely on server-side signals, paid GeoIP/ASN databases, TLS fingerprinting, and behavioral analysis.

> 📢 **Disclaimer.** This project is **not** a tool for bypassing Roskomnadzor (RKN) restrictions. It is intended solely to help you assess the security of your connection and VPN client configuration.

---

## 🔍 Detection signals

| Signal | Source | What it checks |
|--------|--------|----------------|
| 🧮 **WASM IP-range lookup** | `assembly/index.ts` | Binary search (O(log n)) over ~16k sorted VPN/hosting/datacenter CIDR ranges |
| 🌍 **Public IP & geo** | `src/ip.ts` | Exit IP, city, country, ASN/org via ipapi.co |
| 🔎 **DNS resolver probe** | `src/dns.ts` | Resolver IP/country via edns.ip-api.com; flags DNS leak if resolver ≠ exit geo |
| 📡 **WebRTC leak test** | `src/webrtc.ts` | ICE candidates via STUN — local or alternate public IP leaking through VPN |
| 🕐 **Timezone mismatch** | `src/main.ts` | Browser `Intl` timezone vs. timezone inferred from IP |
| 🗣️ **Language mismatch** | `src/main.ts` | Primary browser language vs. expected language for IP country |
| 🏢 **ASN / org heuristic** | `src/ip.ts` | Organization name keywords (`vpn`, `hosting`, `cloud`, `datacenter`) |
| 🖥️ **Client environment** | `src/client.ts` | OS, browser, screen, WebDriver flag, Do Not Track, cookies |
| 🔐 **Browser fingerprint** | `src/fingerprint.ts` | Canvas, WebGL, audio, fonts → composite hash |

All signals are merged in `src/score.ts` into a single verdict.

---

## 🚀 Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # data + wasm + Vite bundle → dist/
npm run preview
```

`npm run dev` and `npm run build` automatically:

1. Rebuild `data/ranges/*.json` → `public/ranges.bin` (`scripts/build-ranges.mjs`)
2. Compile `assembly/index.ts` → `public/module.wasm` (`asc`)

---

## 🧱 Project structure

```text
wasm-vpn-detector/
├── 📂 assembly/                  # AssemblyScript → WebAssembly
│   ├── index.ts                  # IP-range table + binary search
│   └── tsconfig.json
│
├── 📂 data/ranges/               # CIDR database (merged at build time)
│   ├── eu-cloud.generated.json   # EU VPS/cloud (sync from disposable/cloud-ip-ranges)
│   ├── ru-vps.json               # Russian VPS/hosting providers
│   └── vpn-exit.json             # Known VPN/datacenter exit pools
│
├── 📂 scripts/
│   ├── build-ranges.mjs          # CIDR → binary ranges.bin
│   └── sync-ranges.mjs           # Fetch EU cloud CIDRs (npm run sync:ranges)
│
├── 📂 src/                       # TypeScript application (Vite)
│   ├── main.ts                   # UI & orchestration
│   ├── wasm.ts                   # WASM loader + ranges.bin parser
│   ├── ip.ts                     # Public IP + geo (ipapi.co / ipify.org)
│   ├── webrtc.ts                 # WebRTC leak test
│   ├── score.ts                  # Signal aggregation (0–100)
│   ├── pwa.ts                    # PWA install prompt + service worker
│   ├── style.css
│   └── assets/
│
├── 📂 public/                    # Static assets served by Vite
│   ├── module.wasm               # Compiled WASM (checked in for demo)
│   ├── ranges.bin                # Generated at build time (gitignored)
│   ├── pwa/                      # PWA icons (PNG, iOS + Android)
│   └── favicon.svg
│
├── vite.config.ts                # Vite + vite-plugin-pwa
│
├── 📂 build/                     # asc debug output (gitignored except .gitignore)
│   └── release.wat               # WAT disassembly — local only, not in repo
│
├── 📂 test/
│   └── index.js                  # Node test runner smoke tests
│
├── 📂 .github/                   # Community standards & Dependabot
├── asconfig.json                 # AssemblyScript compiler targets
├── index.html                    # Vite entry HTML
├── package.json
└── tsconfig.json
```

### 🔄 Build pipeline

```text
data/ranges.json  ──►  scripts/build-ranges.mjs  ──►  public/ranges.bin
assembly/index.ts ──►  asc (AssemblyScript)       ──►  public/module.wasm
src/*.ts          ──►  tsc + vite build           ──►  dist/
```

---

## 📱 PWA (install as app)

The app is a **Progressive Web App** — after `npm run build` you can install it from Chrome/Edge (desktop & Android) or **Add to Home Screen** on iOS Safari.

- `vite-plugin-pwa` — service worker + web manifest
- `public/pwa/` — PNG icons (192, 512, maskable, Apple touch 180×180)
- **Install app** button appears when the browser fires `beforeinstallprompt`

```bash
npm run build && npm run preview   # test install flow on https://localhost (or deploy)
```

> GitHub **stars / forks** badges use Shields.io `dynamic/json` (public GitHub API). The **downloads** badge is static until you publish a [GitHub Release](https://github.com/advayta108/wasm-vpn-detector/releases); then replace it with `github/downloads/.../total`.

---

## 📜 npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Full production build |
| `npm run sync:ranges` | Refresh EU cloud CIDRs from GitHub (disposable/cloud-ip-ranges) |
| `npm run build:data` | Regenerate `public/ranges.bin` only |
| `npm run asbuild` | Compile WASM (debug + release) |
| `npm run generate:pwa-icons` | Regenerate PWA icons from `favicon.svg` |
| `npm test` | Run Node smoke tests |

---

## ⚠️ Known limitations

- 📦 **~16k IPv4 ranges** after merge — RU VPS (Selectel, Timeweb, Aeza…), EU cloud (Hetzner, OVH, DO, Vultr…), VPN pools. Run `npm run sync:ranges` to refresh EU data.
- 🌍 **Free geo API** (`ipapi.co`) has daily rate limits; use a paid provider in production.
- 🔒 **WebRTC** may be blocked by privacy browsers/extensions — the signal is skipped silently.
- 🛡️ **Client-only heuristics** are bypassable by advanced VPN setups (custom DNS, WebRTC block, non-listed IPs).

---

## 📄 License

MIT — see [LICENSE.md](./LICENSE.md).
