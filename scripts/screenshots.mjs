// README ekran görüntülerini üretir (docs/screenshots/*.png).
//
// Kullanım:
//   npm run fixtures        # örnek zip'leri üret
//   npm run dev             # ayrı bir terminalde geliştirme sunucusunu başlat
//   npm run screenshots     # bu betik
//
// Chromium tabanlı bir tarayıcıyı (Edge/Chrome) başsız modda çalıştırır ve
// geliştirme sunucusundaki demo modunu (dev/demo.ts) kullanır. Tarayıcı yolu
// BROWSER ortam değişkeniyle değiştirilebilir.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CANDIDATES = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
].filter(Boolean);
const browser = CANDIDATES.find((p) => existsSync(p));
if (!browser) {
  console.error('Chromium tabanlı bir tarayıcı bulunamadı. BROWSER=/yol/tarayıcı ile belirt.');
  process.exit(1);
}

const BASE = process.env.DEV_URL ?? 'http://localhost:5173/';
const OUT = resolve('docs/screenshots');
mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'wa-shots-'));

const demo = `${BASE}?demo=${encodeURIComponent('Kamp Ekibi')}&me=Selin`;
const shots = [
  ['landing', '1280,800', `${BASE}?theme=light&landing=1&demo=x`],
  ['chat-light', '1280,800', `${demo}&theme=light&scroll=${encodeURIComponent('Herkes hazır')}`],
  ['chat-dark', '1280,800', `${demo}&theme=dark&scroll=${encodeURIComponent('Kamp listesi')}`],
  ['search', '1280,800', `${demo}&theme=light&search=kamp`],
  ['lightbox', '1280,800', `${demo}&theme=dark&lightbox=1`],
  // Başsız tarayıcı ~500 pikselden dar pencere açamadığı için mobil görünüm
  // iki telefon çerçevesi içeren dev/mobile.html sayfasından alınır.
  ['mobile', '1100,960', `${BASE}dev/mobile.html`],
];

for (const [name, size, url] of shots) {
  const file = join(OUT, `${name}.png`);
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
    `--user-data-dir=${profile}`, `--window-size=${size}`, '--virtual-time-budget=25000',
    `--screenshot=${file}`, url,
  ], { stdio: 'ignore' });
  console.log(`✓ ${name}.png`);
}
