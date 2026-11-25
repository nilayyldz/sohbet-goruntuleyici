// @vitest-environment happy-dom
/**
 * Güvenlik testleri: XSS, ReDoS, kaynak kod denetimi, CSP ve zip kaynaklı saldırılar.
 * Uygulama güvenilmeyen girdiyle (başkasının dışa aktardığı zip) çalıştığından
 * sohbet içeriği, yazar adları ve dosya adları saldırgan kontrolünde sayılır.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cspPlugin } from '../vite.config';
import { resolveAttachments } from '../src/media/resolve';
import { parseChat } from '../src/parser/parse';
import { ChatView } from '../src/ui/chat-view';
import { renderRich, setMentionNames } from '../src/ui/format';
import { displayName, OPENABLE } from '../src/ui/media';
import { loadFile, MAX_CHAT_BYTES, mediaKey } from '../src/zip/loader';

const PAYLOADS = [
  '<script>window.__pwned=1</script>',
  '<img src=x onerror="window.__pwned=1">',
  '<svg onload="window.__pwned=1"></svg>',
  '"><iframe src="javascript:window.__pwned=1"></iframe>',
  'javascript:window.__pwned=1',
  '<a href="javascript:alert(1)">tıkla</a>',
  '*<b onmouseover=alert(1)>kalın</b>*',
  '_<img src=x onerror=alert(1)>_',
  '```<script>alert(1)</script>```',
  'https://example.com/"><script>alert(1)</script>',
  'www.example.com/<img/src/onerror=alert(1)>',
  '@<img src=x onerror=alert(1)>',
  '&lt;script&gt;alert(1)&lt;/script&gt;',
];

/** Yalnızca uygulamanın kendi ürettiği güvenli öğelere izin verilir. */
const ALLOWED_TAGS = new Set(['STRONG', 'EM', 'S', 'CODE', 'A', 'SPAN', 'MARK']);

function assertSafeTree(root: Element) {
  for (const el of root.querySelectorAll('*')) {
    for (const attr of el.getAttributeNames()) {
      expect(attr.startsWith('on'), `${el.tagName} üzerinde ${attr} özniteliği`).toBe(false);
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') ?? '';
      expect(/^https?:\/\//i.test(href), `güvensiz bağlantı: ${href}`).toBe(true);
      expect(el.getAttribute('rel')).toContain('noopener');
    }
  }
  expect(root.querySelectorAll('script, iframe, object, embed, base, form, meta, link').length).toBe(0);
}

describe('XSS: metin biçimlendirme', () => {
  it.each(PAYLOADS)('%s düz metin olarak kalır', (payload) => {
    setMentionNames(['<img src=x onerror=alert(1)>']);
    const div = document.createElement('div');
    renderRich(payload, div);
    assertSafeTree(div);
    for (const el of div.querySelectorAll('*')) expect(ALLOWED_TAGS.has(el.tagName)).toBe(true);
    // Görünen metin, girdiyle aynı karakterleri içerir (yalnızca biçim işaretleri düşebilir)
    expect(div.textContent!.replace(/[*_~`]/g, '')).toBe(payload.replace(/[*_~`]/g, ''));
  });
});

describe('XSS: tüm sohbet görünümü', () => {
  class FakeIO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  beforeAll(() => {
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIO;
  });
  afterAll(() => {
    document.body.replaceChildren();
  });

  it('kötü niyetli yazar, metin, dosya adı ve başlık DOM\'a kod olarak girmez', async () => {
    const evil = PAYLOADS[1];
    const lines = [
      `31.12.2025 10:00 - ${evil}: ${PAYLOADS[0]}`,
      `31.12.2025 10:01 - Ali: ${PAYLOADS.join('\n')}`,
      `31.12.2025 10:02 - Ali: <img src=x onerror=alert(1)>.pdf (dosya ekli)`,
      `31.12.2025 10:03 - Ali: "><svg onload=alert(1)>.jpg (dosya ekli)`,
      `31.12.2025 10:04 - ${evil} gruba katıldı`,
      `31.12.2025 10:05 - Veli: selam`,
    ];
    const result = parseChat(lines.join('\n'));
    const { byId, stats } = resolveAttachments(result.messages, new Map());
    const view = new ChatView({ result, byId, stats, title: PAYLOADS[2], me: evil }, () => {}, () => {});
    document.body.append(view.root);
    for (let i = 0; i < 50 && view.root.querySelectorAll('[data-id]').length < result.messages.length; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(view.root.querySelectorAll('[data-id]').length).toBe(result.messages.length);
    assertSafeTree(view.root);
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
    // Başlık ve yazar adları metin olarak görünür
    expect(view.root.querySelector('.title')!.textContent).toBe(PAYLOADS[2]);
    expect(view.root.textContent).toContain('onerror=alert(1)>.pdf');
    view.destroy();
  });
});

describe('ReDoS: düşmanca girdiler hızlı ayrıştırılır', () => {
  const n = 50_000;
  const cases: Record<string, string> = {
    'boşluk dizisi': ' '.repeat(n),
    'açılı ayraç dizisi': '<'.repeat(n),
    '"<a:" tekrarı': '<a:'.repeat(n / 3),
    'nokta dizisi': 'a.'.repeat(n / 2),
    'yarım ek etiketi': 'x.jpg ('.repeat(n / 7),
    'yarım eklendi işareti': '<x.jpg '.repeat(n / 7),
    'yıldız tekrarı': '*a'.repeat(n / 2),
    '@ tekrarı': '@a'.repeat(n / 2),
    'uzun sayı': '1'.repeat(n),
    'omitted benzeri': 'a '.repeat(n / 2) + 'omitted!',
  };
  it.each(Object.entries(cases))('%s', (_name, body) => {
    for (const prefix of ['31.12.2023 21:41 - A: ', '[31.12.2023 21:41:00] A: \u200E', '']) {
      const t = performance.now();
      try {
        parseChat(prefix + body);
      } catch {
        /* sohbet değil hatası beklenebilir */
      }
      expect(performance.now() - t).toBeLessThan(500);
    }
  });
  it('biçimlendirici (bağlantı/etiket/kalın) düşmanca girdide hızlıdır', () => {
    setMentionNames(['Ali Veli', 'Ayşe']);
    for (const body of Object.values(cases)) {
      const div = document.createElement('div');
      const t = performance.now();
      renderRich(body.slice(0, 20_000), div);
      expect(performance.now() - t).toBeLessThan(1000);
    }
  });
});

describe('Zip kaynaklı saldırılar', () => {
  async function zipFile(files: Record<string, string>, name = 'x.zip') {
    const zip = new JSZip();
    for (const [k, v] of Object.entries(files)) zip.file(k, v);
    return new File([(await zip.generateAsync({ type: 'uint8array' })) as BlobPart], name);
  }

  it('dizin gezinmeli (../) dosya adları yalnızca son parçaya indirgenir', async () => {
    const loaded = await loadFile(
      await zipFile({
        '_chat.txt': '[31.12.2023 21:41:00] A: \u200E<00000001-a.pdf eklendi>',
        '../../etc/00000001-a.pdf': 'x',
      }),
    );
    const entry = [...loaded.media.values()][0];
    expect(entry.name).toBe('00000001-a.pdf');
    expect(displayName('../../evil/00000001-a.pdf')).not.toContain('/');
    expect(mediaKey('..\\..\\evil.pdf')).toBe('evil.pdf');
  });

  it('bozuk zip anlaşılır hata verir', async () => {
    await expect(loadFile(new File([new Uint8Array([80, 75, 3, 4, 1, 2, 3])], 'bozuk.zip'))).rejects.toThrow(/açılamadı/);
  });

  it('çok büyük .txt reddedilir (sekme çökmesin)', async () => {
    const big = { size: MAX_CHAT_BYTES + 1, name: 'chat.txt', text: async () => '' } as unknown as File;
    await expect(loadFile(big)).rejects.toThrow(/büyük/);
  });

  it('betik çalıştırabilecek türler yeni sekmede açılmaz', () => {
    for (const ext of ['svg', 'html', 'htm', 'xhtml', 'xml', 'txt', 'js', 'mhtml']) expect(OPENABLE.has(ext)).toBe(false);
  });
});

describe('Kaynak kod denetimi', () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.ts')) files.push(p);
    }
  };
  const SRC = join(process.cwd(), 'src');
  walk(SRC);

  it('ağ isteği veya dinamik kod çalıştırma API\'si kullanılmaz', () => {
    const banned = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|eval)\s*\(|new\s+(Function|WebSocket|EventSource|XMLHttpRequest)\b|document\.write|insertAdjacentHTML|outerHTML\s*=/;
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(banned.exec(src)?.[0], f).toBeUndefined();
    }
  });

  it('innerHTML yalnızca sabit simgeler/şablonlarla kullanılır', () => {
    for (const f of files) {
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((line: string, i: number) => {
        const m = /\.innerHTML\s*=\s*(.*)$/.exec(line);
        if (!m) return;
        const rhs = m[1].trim();
        const ok =
          /^icons\.\w+;$/.test(rhs) || // sabit SVG simgesi
          rhs === 'icon;' || // iconButton(icons.x, …) parametresi
          rhs === 'landingHtml();' || // aşağıdaki testte ayrıca denetlenir
          (rhs.startsWith('`') && collectTemplate(lines, i).every(isSafeInterpolation));
        expect(ok, `${f}:${i + 1} → ${rhs}`).toBe(true);
      });
    }
  });

  it('tanıtım sayfası şablonu yalnızca simge ve sabit çevirileri içerir', () => {
    const src = readFileSync(join(SRC, 'ui', 'landing.ts'), 'utf8');
    const tpl = src.slice(src.indexOf('return `'));
    const parts = [...tpl.matchAll(/\$\{([^}]*)\}/g)].map((m) => m[1].trim());
    expect(parts.length).toBeGreaterThan(10);
    for (const p of parts) expect(isSafeInterpolation(p), p).toBe(true);
  });

  it('iconButton yalnızca icons.* ile çağrılır', () => {
    for (const f of files) {
      // Tanımın kendisi (function iconButton(icon: string, …)) hariç tüm çağrılar
      for (const m of readFileSync(f, 'utf8').matchAll(/(?<!function )iconButton\(([^,]+),/g)) {
        expect(m[1].trim(), f).toMatch(/^icons\.\w+$/);
      }
    }
  });

  it('dış bağlantılar noopener ile açılır', () => {
    const src = readFileSync(join(SRC, 'ui', 'format.ts'), 'utf8');
    expect(src).toContain("a.rel = 'noopener noreferrer nofollow'");
  });
});

/** Şablonlarda izin verilen ifadeler: sabit simgeler ve sabit sözlük değerleri (t('anahtar')). */
function isSafeInterpolation(expr: string): boolean {
  return /^icons\.\w+$/.test(expr) || /^t\('\w+'\)$/.test(expr);
}

/** innerHTML'e atanan şablon dizesindeki ${…} ifadelerini döndürür. */
function collectTemplate(lines: string[], start: number): string[] {
  let text = '';
  for (let i = start; i < lines.length; i++) {
    text += lines[i] + '\n';
    if (i > start && /`;\s*$/.test(lines[i])) break;
    if (i === start && /`[^`]*`;\s*$/.test(lines[i].slice(lines[i].indexOf('`')))) break;
  }
  return [...text.matchAll(/\$\{([^}]*)\}/g)].map((m) => m[1].trim());
}

describe('CSP', () => {
  it('derlemeye ağ isteklerini engelleyen katı politika eklenir', () => {
    const plugin = cspPlugin();
    expect(plugin.apply).toBe('build');
    const hook = plugin.transformIndexHtml as (html: string) => string;
    const out = hook('<head><meta charset="UTF-8" /></head>');
    const csp = /content="([^"]+)"/.exec(out)?.[1] ?? '';
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).not.toMatch(/https?:|\*/);
  });
});
