import { describe, expect, it } from 'vitest';
import { resolveAttachments } from '../src/media/resolve';
import { parseChat } from '../src/parser/parse';
import type { MediaEntry } from '../src/zip/loader';

const L = '\u200E';
const N = '\u202F';

describe('admin-deleted messages', () => {
  it('iOS TR: keeps author, marks deleted with original label', () => {
    const r = parseChat(
      [
        `[05.03.2024 15:40:00] Ayşe: selam`,
        `${L}[05.03.2024 15:41:00] Lale Yıldırım: ${L}Bu mesaj ~${N}Ozan Çağrı ŞEN adlı yönetici tarafından silindi.`,
      ].join('\n'),
    );
    const m = r.messages[1];
    expect(m.author).toBe('Lale Yıldırım');
    expect(m.deleted).toBe(true);
    expect(m.deletedLabel).toBe('Bu mesaj ~ Ozan Çağrı ŞEN adlı yönetici tarafından silindi');
  });
  it('Android EN', () => {
    const r = parseChat('1/2/24, 3:04 PM - Bob: This message was deleted by admin Alice.');
    expect(r.messages[0].author).toBe('Bob');
    expect(r.messages[0].deleted).toBe(true);
  });
});

describe('omitted media recovery', () => {
  const entry = (name: string): MediaEntry => ({ name, path: name, size: 1, read: async () => new Blob() });
  it('attaches unreferenced iOS file with matching timestamp and kind', () => {
    const r = parseChat(
      [
        `${L}[05.03.2024 15:49:12] Lale Yıldırım: ${L}görüntü dahil edilmedi`,
        `${L}[05.03.2024 15:50:00] Lale Yıldırım: ${L}video dahil edilmedi`,
      ].join('\n'),
    );
    const media = new Map([
      ['a', entry('00000002-PHOTO-2024-03-05-15-49-12.jpg')],
      ['b', entry('00000003-PHOTO-2024-03-05-15-50-00.jpg')], // tür tutmuyor (video bekleniyor)
    ]);
    const { byId, stats } = resolveAttachments(r.messages, media);
    expect(r.messages[0].omitted).toBe(false);
    expect(r.messages[0].attachment?.kind).toBe('image');
    expect(byId.get(0)?.name).toBe('00000002-PHOTO-2024-03-05-15-49-12.jpg');
    expect(r.messages[1].omitted).toBe(true);
    expect(stats.recovered).toBe(1);
  });
  it('does not reuse files already referenced', () => {
    const r = parseChat(
      [
        `${L}[05.03.2024 15:49:12] A: ${L}<ek: 00000002-PHOTO-2024-03-05-15-49-12.jpg>`,
        `${L}[05.03.2024 15:49:12] B: ${L}görüntü dahil edilmedi`,
      ].join('\n'),
    );
    const media = new Map([['00000002-photo-2024-03-05-15-49-12.jpg', entry('00000002-PHOTO-2024-03-05-15-49-12.jpg')]]);
    resolveAttachments(r.messages, media);
    expect(r.messages[1].omitted).toBe(true);
  });
});
