import { describe, expect, it } from 'vitest';
import { resolveAttachments } from '../src/media/resolve';
import { parseChat } from '../src/parser/parse';
import type { MediaEntry } from '../src/zip/loader';

const L = '\u200E';
const N = '\u202F';

// Gerçek iOS Türkçe dışa aktarımından (kişisel veriler değiştirilerek) alınan biçim
const CHAT = [
  `[15.08.2026 15:59:00] ~${N}Ozan Çağrı ŞEN: Bence uygun`,
  `${L}[15.08.2026 16:00:10] Ayşe: ${L}Proje_Taslagi_v2.docx ${L}<00003035-Proje_Taslagi_v2.docx eklendi>`,
  `${L}[15.08.2026 16:09:00] Lale Yıldırım: ${L}dosya.pdf.pdf • ${L}1 sayfa ${L}<00003042-dosya.pdf.pdf eklendi>`,
  `${L}[15.08.2026 13:34:04] Lale Yıldırım: ${L}<00003069-STICKER-2026-08-15-13-34-04.webp eklendi>`,
  `${L}[15.08.2026 16:10:00] Ayşe: ${L}<00003070-PHOTO-2026-08-15-16-10-00.jpg eklendi>`,
  `Açıklama satırı`,
].join('\n');

describe('iOS TR "<dosya eklendi>" ekleri', () => {
  const r = parseChat(CHAT);
  const m = r.messages;
  it('parses documents without leftover text', () => {
    expect(r.lang).toBe('tr');
    expect(m[1].author).toBe('Ayşe');
    expect(m[1].attachment).toEqual({ name: '00003035-Proje_Taslagi_v2.docx', kind: 'document' });
    expect(m[1].text).toBe('');
    expect(m[2].attachment).toEqual({ name: '00003042-dosya.pdf.pdf', kind: 'document' });
    expect(m[2].text).toBe('');
  });
  it('parses stickers as messages, not system lines', () => {
    expect(m[3].author).toBe('Lale Yıldırım');
    expect(m[3].attachment?.kind).toBe('sticker');
  });
  it('keeps captions', () => {
    expect(m[4].attachment?.kind).toBe('image');
    expect(m[4].text).toBe('Açıklama satırı');
  });
  it('matches zip entries', () => {
    const e = (name: string): MediaEntry => ({ name, path: name, size: 1, read: async () => new Blob() });
    const media = new Map([
      ['00003035-proje_taslagi_v2.docx', e('00003035-Proje_Taslagi_v2.docx')],
      ['00003069-sticker-2026-08-15-13-34-04.webp', e('00003069-STICKER-2026-08-15-13-34-04.webp')],
    ]);
    const { byId, stats } = resolveAttachments(m, media);
    expect(byId.get(1)?.name).toBe('00003035-Proje_Taslagi_v2.docx');
    expect(byId.get(3)?.name).toBe('00003069-STICKER-2026-08-15-13-34-04.webp');
    expect(stats.missing).toEqual(['00003042-dosya.pdf.pdf', '00003070-PHOTO-2026-08-15-16-10-00.jpg']);
  });
});
