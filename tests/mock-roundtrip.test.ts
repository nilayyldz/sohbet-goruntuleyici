import { describe, expect, it } from 'vitest';
import { resolveAttachments } from '../src/media/resolve';
import { guessMe, parseChat } from '../src/parser/parse';
import type { Message } from '../src/parser/types';
import { loadFile } from '../src/zip/loader';
import { generateExport, type ExpectedMessage, type MockOptions } from './mock/generator';
import { toZipFile } from './mock/zip';

/** Karşılaştırma için yalnızca anlamlı alanları al (undefined/false alanları at). */
function normalize(m: Message | ExpectedMessage) {
  return {
    date: m.date.getTime(),
    author: m.author,
    text: m.text,
    attachment: m.attachment ? { name: m.attachment.name, kind: m.attachment.kind } : undefined,
    omitted: m.omitted || undefined,
    deleted: m.deleted || undefined,
    selfDeleted: m.selfDeleted || undefined,
    deletedLabel: m.deletedLabel,
    edited: m.edited || undefined,
    poll: m.poll,
  };
}

const FORMATS: { name: string; opts: Omit<MockOptions, 'seed' | 'count'> }[] = [
  { name: 'Android TR', opts: { platform: 'android', lang: 'tr' } },
  { name: 'Android EN (ABD, 12 saat)', opts: { platform: 'android', lang: 'en' } },
  { name: 'Android EN (İngiltere, 24 saat, GG/AA)', opts: { platform: 'android', lang: 'en', dateOrder: 'DMY', hour12: false } },
  { name: 'iOS TR', opts: { platform: 'ios', lang: 'tr' } },
  { name: 'iOS EN (ABD, 12 saat)', opts: { platform: 'ios', lang: 'en' } },
  { name: 'iOS EN (24 saat, GG/AA)', opts: { platform: 'ios', lang: 'en', dateOrder: 'DMY', hour12: false } },
  { name: 'Android TR birebir', opts: { platform: 'android', lang: 'tr', people: 2 } },
  { name: 'iOS TR birebir, BOM + LF', opts: { platform: 'ios', lang: 'tr', people: 2, crlf: false, bom: true } },
];
const SEEDS = [1, 2, 3, 42, 2026];

describe.each(FORMATS)('mock: $name', ({ opts }) => {
  it.each(SEEDS)('seed %i: her mesaj beklenen şekilde ayrıştırılır', (seed) => {
    const mock = generateExport({ ...opts, seed, count: 250 });
    const r = parseChat(mock.txt);
    expect(r.platform).toBe(opts.platform);
    expect(r.lang).toBe(opts.lang);
    expect(r.dateOrder).toBe(mock.options.dateOrder);
    expect(r.messages.length).toBe(mock.expected.length);
    for (let i = 0; i < r.messages.length; i++) {
      // Hata olursa hangi satır olduğu görünsün
      expect({ i, ...normalize(r.messages[i]) }).toEqual({ i, ...normalize(mock.expected[i]) });
    }
    expect(new Set(r.authors)).toEqual(new Set(mock.expected.filter((e) => e.author).map((e) => e.author)));
    expect(guessMe(r, mock.title)).toBe(mock.me);
  });

  it('zip → yükle → eşleştir: var olan ekler bulunur, eksikler listelenir', async () => {
    const mock = generateExport({ ...opts, seed: 7, count: 300, mediaPresence: 0.7 });
    const loaded = await loadFile(await toZipFile(mock));
    expect(loaded.chatFileName).toBe(mock.chatFileName);
    expect(loaded.title).toBe(mock.title);
    const r = parseChat(loaded.chatText);
    const { byId, stats } = resolveAttachments(r.messages, loaded.media);
    expect([...stats.missing].sort()).toEqual([...mock.missing].sort());
    expect(stats.found).toBe(stats.referenced - mock.missing.length);
    expect(stats.unused).toBe(0);
    for (const m of r.messages) {
      if (!m.attachment) continue;
      const entry = byId.get(m.id);
      if (mock.missing.includes(m.attachment.name)) expect(entry).toBeUndefined();
      else expect(entry?.name.normalize('NFC')).toBe(m.attachment.name);
    }
  });
});

describe('mock: zip yapısı varyasyonları', () => {
  it('alt klasör + NFD (macOS) dosya adları', async () => {
    const mock = generateExport({ platform: 'android', lang: 'tr', seed: 11, count: 200, subfolder: 'Sohbet/', nfdNames: true, mediaPresence: 1 });
    const loaded = await loadFile(await toZipFile(mock));
    const r = parseChat(loaded.chatText);
    const { stats } = resolveAttachments(r.messages, loaded.media);
    expect(stats.missing).toEqual([]);
    expect(stats.found).toBe(stats.referenced);
  });

  it('__MACOSX ve .DS_Store çöpleri yok sayılır, sohbet olmayan .txt sohbet sanılmaz', async () => {
    const mock = generateExport({ platform: 'ios', lang: 'en', seed: 12, count: 50 });
    const file = await toZipFile(mock, {
      '__MACOSX/._chat.txt': 'çöp',
      '.DS_Store': 'çöp',
      'readme.txt': 'not a chat',
    });
    const loaded = await loadFile(file);
    expect(loaded.chatFileName).toBe('_chat.txt');
    expect([...loaded.media.values()].some((e) => /DS_Store|__MACOSX/.test(e.path))).toBe(false);
  });

  it('yalnızca .txt yüklenince ekler "eksik" sayılır ama sohbet açılır', async () => {
    const mock = generateExport({ platform: 'android', lang: 'en', seed: 13, count: 80 });
    const loaded = await loadFile(new File([mock.txt], mock.chatFileName, { type: 'text/plain' }));
    const r = parseChat(loaded.chatText);
    const { stats } = resolveAttachments(r.messages, loaded.media);
    expect(stats.found).toBe(0);
    expect(r.messages.length).toBe(mock.expected.length);
  });

  it('aynı tohum aynı çıktıyı üretir (tekrarlanabilirlik)', () => {
    const a = generateExport({ platform: 'ios', lang: 'tr', seed: 99, count: 100 });
    const b = generateExport({ platform: 'ios', lang: 'tr', seed: 99, count: 100 });
    expect(a.txt).toBe(b.txt);
  });
});

describe('mock: performans', () => {
  it('50 bin mesajlık iOS sohbeti 3 saniyenin altında ayrıştırılır', () => {
    const mock = generateExport({ platform: 'ios', lang: 'tr', seed: 5, count: 50_000 });
    const t = performance.now();
    const r = parseChat(mock.txt);
    const ms = performance.now() - t;
    expect(r.messages.length).toBe(mock.expected.length);
    expect(ms).toBeLessThan(3000);
  });
});
