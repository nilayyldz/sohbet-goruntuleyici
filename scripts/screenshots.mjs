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

// Her dil için ayrı görüntüler: Türkçe README *.png/webp, İngilizce README *-en.png/webp kullanır
const SETS = [
  { suffix: '', lang: 'tr', chat: 'Kamp Ekibi', first: 'Herkes hazır', doc: 'Kamp listesi', query: 'kamp' },
  { suffix: '-en', lang: 'en', chat: 'Camping Crew', first: 'Is everyone ready', doc: 'Camping list', query: 'camping' },
];
const shots = [];
for (const s of SETS) {
  const demo = `${BASE}?lang=${s.lang}&demo=${encodeURIComponent(s.chat)}&me=Selin`;
  shots.push(
    [`landing${s.suffix}`, '1280,800', `${BASE}?lang=${s.lang}&theme=light&landing=1&demo=x`],
    [`chat-light${s.suffix}`, '1280,800', `${demo}&theme=light&scroll=${encodeURIComponent(s.first)}`],
    [`chat-dark${s.suffix}`, '1280,800', `${demo}&theme=dark&scroll=${encodeURIComponent(s.doc)}`],
    [`search${s.suffix}`, '1280,800', `${demo}&theme=light&search=${s.query}`],
    [`lightbox${s.suffix}`, '1280,800', `${demo}&theme=dark&lightbox=1`],
    // Başsız tarayıcı ~500 pikselden dar pencere açamadığı için mobil görünüm
    // iki telefon çerçevesi içeren dev/mobile.html sayfasından alınır.
    [`mobile${s.suffix}`, '1100,960', `${BASE}dev/mobile.html?lang=${s.lang}&chat=${encodeURIComponent(s.chat)}&doc=${encodeURIComponent(s.doc)}`],
  );
}

for (const [name, size, url] of shots) {
  const file = join(OUT, `${name}.png`);
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
    `--user-data-dir=${profile}`, `--window-size=${size}`, '--virtual-time-budget=25000',
    `--screenshot=${file}`, url,
  ], { stdio: 'ignore' });
  console.log(`✓ ${name}.png`);
}
