import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data', 'ranges');
const outPath = path.join(dataDir, 'eu-cloud.generated.json');

const BASE =
  'https://raw.githubusercontent.com/disposable/cloud-ip-ranges/master/txt';

/** EU / global VPS & hosting used for VPN exit nodes. */
const EU_CLOUD_SOURCES = [
  { file: 'hetzner.txt', label: 'Hetzner', weight: 65 },
  { file: 'ovh.txt', label: 'OVH', weight: 65 },
  { file: 'digitalocean.txt', label: 'DigitalOcean', weight: 70 },
  { file: 'choopa.txt', label: 'Vultr/Choopa', weight: 75 },
  { file: 'vultr.txt', label: 'Vultr', weight: 75 },
  { file: 'linode.txt', label: 'Linode/Akamai', weight: 70 },
  { file: 'onlinesas.txt', label: 'Scaleway/Online SAS', weight: 60 },
  { file: 'scaleway.txt', label: 'Scaleway', weight: 60 },
  { file: 'nforce.txt', label: 'NForce/M247 hosting', weight: 80 },
  { file: 'softlayer-ibm.txt', label: 'IBM Cloud/SoftLayer', weight: 60 },
  { file: 'upcloud.txt', label: 'UpCloud', weight: 65 },
  { file: 'kamatera.txt', label: 'Kamatera', weight: 65 },
  { file: 'aruba-cloud.txt', label: 'Aruba Cloud', weight: 60 },
  { file: 'ionos-cloud.txt', label: 'IONOS', weight: 60 },
  { file: 'rackspace.txt', label: 'Rackspace', weight: 60 },
  { file: 'gridscale.txt', label: 'gridscale', weight: 60 },
  { file: 'open-telekom-cloud.txt', label: 'Open Telekom Cloud', weight: 60 },
  { file: 'exoscale.txt', label: 'Exoscale', weight: 65 },
  { file: 'seeweb.txt', label: 'Seeweb', weight: 60 },
  { file: 'flyio.txt', label: 'Fly.io', weight: 65 },
  { file: 'oracle-cloud.txt', label: 'Oracle Cloud', weight: 60 },
  { file: 'cyso-cloud.txt', label: 'Cyso Cloud', weight: 60 },
];

function parseTxt(body) {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith('#') &&
        line.includes('/') &&
        !line.includes(':')
    );
}

async function fetchProvider({ file, label, weight }) {
  const url = `${BASE}/${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const cidrs = parseTxt(await res.text());
  console.log(`[sync-ranges] ${label}: ${cidrs.length} CIDR`);
  return cidrs.map((cidr) => ({ cidr, weight, label }));
}

async function main() {
  mkdirSync(dataDir, { recursive: true });

  const entries = [];
  for (const source of EU_CLOUD_SOURCES) {
    try {
      entries.push(...(await fetchProvider(source)));
    } catch (err) {
      console.warn(`[sync-ranges] skip ${source.file}: ${err.message}`);
    }
  }

  writeFileSync(outPath, JSON.stringify(entries, null, 2));
  console.log(`[sync-ranges] wrote ${entries.length} EU/cloud CIDRs -> ${outPath}`);

  const localFiles = readdirSync(dataDir).filter(
    (name) => name.endsWith('.json') && !name.endsWith('.generated.json')
  );
  let localCount = 0;
  for (const name of localFiles) {
    const chunk = JSON.parse(readFileSync(path.join(dataDir, name), 'utf-8'));
    localCount += chunk.length;
  }
  console.log(`[sync-ranges] local files: ${localFiles.join(', ')} (${localCount} CIDR)`);
}

main();
