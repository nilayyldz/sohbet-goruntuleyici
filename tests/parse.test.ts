import { describe, expect, it } from 'vitest';
import { guessMe, parseChat } from '../src/parser/parse';
import { ANDROID_EN, ANDROID_TR, IOS_EN, IOS_TR } from './samples';

describe('Android EN', () => {
  const r = parseChat(ANDROID_EN);
  const m = r.messages;
  it('detects format', () => {
    expect(r.platform).toBe('android');
    expect(r.lang).toBe('en');
    expect(r.dateOrder).toBe('MDY');
    expect(r.authors).toEqual(['Alice', 'Bob']);
  });
  it('parses system, multiline and dates', () => {
    expect(m[0].author).toBeNull();
    expect(m[1].date).toEqual(new Date(2023, 11, 31, 21, 41));
    expect(m[2].text).toBe('Thanks! This is\na multi-line message');
    expect(m[6].date).toEqual(new Date(2024, 0, 1, 0, 5));
  });
  it('parses attachments with caption', () => {
    expect(m[3].attachment).toEqual({ name: 'IMG-20231231-WA0001.jpg', kind: 'image' });
    expect(m[3].text).toBe('Look at this');
    expect(m[7].attachment?.kind).toBe('audio');
    expect(m[8].attachment).toEqual({ name: 'Report.pdf', kind: 'document' });
  });
  it('parses markers', () => {
    expect(m[4].omitted).toBe(true);
    expect(m[5].deleted && m[5].selfDeleted).toBe(true);
    expect(m[6].edited).toBe(true);
    expect(m[6].text).toBe('Edited text');
    expect(m[9].deleted).toBe(true);
    expect(m[9].selfDeleted).toBe(false);
  });
  it('guesses me', () => expect(guessMe(r, null)).toBe('Alice'));
});

describe('Android TR', () => {
  const r = parseChat(ANDROID_TR);
  const m = r.messages;
  it('detects format', () => {
    expect(r.platform).toBe('android');
    expect(r.lang).toBe('tr');
    expect(r.dateOrder).toBe('DMY');
  });
  it('parses messages', () => {
    expect(m[0].author).toBeNull();
    expect(m[2].author).toBe('Mehmet');
    expect(m[2].text).toBe('Teşekkürler: sana da');
    expect(m[3].attachment?.name).toBe('IMG-20231231-WA0001.jpg');
    expect(m[3].text).toBe('Şuna bak');
    expect(m[4].omitted).toBe(true);
    expect(m[5].edited).toBe(true);
    expect(m[5].text).toBe('Düzeltilmiş metin');
    expect(m[6].selfDeleted).toBe(true);
    expect(m[7].attachment?.kind).toBe('video');
    expect(m[8].author).toBeNull();
    expect(m[8].date).toEqual(new Date(2024, 0, 1, 0, 8));
  });
  it('guesses me by title', () => {
    expect(guessMe({ ...r, messages: [] }, 'Mehmet')).toBe('Ayşe');
  });
});

describe('iOS EN', () => {
  const r = parseChat(IOS_EN);
  const m = r.messages;
  it('detects format', () => {
    expect(r.platform).toBe('ios');
    expect(r.lang).toBe('en');
    expect(r.dateOrder).toBe('MDY');
    expect(r.authors).toEqual(['Alice', 'Bob']);
  });
  it('parses', () => {
    expect(m[0].author).toBeNull();
    expect(m[1].date).toEqual(new Date(2023, 11, 31, 21, 41, 10));
    expect(m[2].attachment).toEqual({ name: '00000003-PHOTO-2023-12-31-21-42-00.jpg', kind: 'image' });
    expect(m[2].text).toBe('');
    expect(m[3].text).toBe('Two\nlines');
    expect(m[4].omitted).toBe(true);
    expect(m[4].omittedLabel).toBe('image');
    expect(m[5].omittedLabel).toBe('contact card');
    expect(m[6].attachment).toEqual({ name: '00000007-Report.pdf', kind: 'document' });
    expect(m[6].text).toBe('');
    expect(m[7].attachment?.kind).toBe('audio');
    expect(m[8].edited).toBe(true);
    expect(m[8].text).toBe('Fixed');
    expect(m[9].author).toBeNull();
    expect(m[9].text).toBe('Bob added Carol');
    expect(m[10].deleted).toBe(true);
    expect(m[10].text).not.toContain('\u200E');
  });
});

describe('iOS TR', () => {
  const r = parseChat(IOS_TR);
  const m = r.messages;
  it('detects format', () => {
    expect(r.platform).toBe('ios');
    expect(r.lang).toBe('tr');
    expect(r.dateOrder).toBe('DMY');
  });
  it('parses', () => {
    expect(m[0].author).toBeNull();
    expect(m[2].attachment?.kind).toBe('image');
    expect(m[3].omittedLabel).toBe('görüntü');
    expect(m[4].omitted).toBe(true);
    expect(m[5].attachment?.kind).toBe('sticker');
    expect(m[6].edited).toBe(true);
    expect(m[7].selfDeleted).toBe(true);
  });
  it('guesses me', () => expect(guessMe(r, null)).toBe('Ayşe'));
});

describe('edge cases', () => {
  it('rejects non-chat text', () => {
    expect(() => parseChat('hello\nworld')).toThrow();
  });
  it('resolves ambiguous dates by chronology', () => {
    const txt = ['01/02/24, 10:00 - A: x', '01/03/24, 10:00 - A: y', '02/03/24, 10:00 - A: z'].join('\n');
    // DMY: 1 Şub, 1 Mar, 2 Mar (artan) · MDY: 2 Oca, 3 Oca, 3 Şub (artan) → eşit, '/' ve AM/PM yok → DMY
    expect(parseChat(txt).dateOrder).toBe('DMY');
    const txt2 = ['01/12/24, 10:00 - A: x', '02/01/24, 10:00 - A: y'].join('\n');
    // DMY: 1 Ara → 2 Oca (geri gider) · MDY: 12 Oca → 1 Şub (ileri)
    expect(parseChat(txt2).dateOrder).toBe('MDY');
  });
  it('handles YMD and 24h with comma', () => {
    const r = parseChat('2024-01-31, 21:05 - A: x');
    expect(r.messages[0].date).toEqual(new Date(2024, 0, 31, 21, 5));
  });
  it('handles phone number authors with bidi marks', () => {
    const r = parseChat('31.12.2023 21:41 - \u202A+90 555 123 45 67\u202C: selam');
    expect(r.messages[0].author).toBe('+90 555 123 45 67');
  });
  it('treats unknown attachment labels as uncertain', () => {
    const r = parseChat('31.12.2023 21:41 - A: IMG-1.jpg (Datei angehängt)');
    expect(r.messages[0].attachment?.uncertain).toBe(true);
    expect(r.messages[0].raw).toBe('IMG-1.jpg (Datei angehängt)');
  });
  it('parses 200k lines quickly', () => {
    const lines: string[] = [];
    for (let i = 0; i < 200_000; i++) lines.push(`31.12.2023 21:${String(i % 60).padStart(2, '0')} - Ali: mesaj ${i}`);
    const t = performance.now();
    const r = parseChat(lines.join('\n'));
    const ms = performance.now() - t;
    expect(r.messages.length).toBe(200_000);
    console.log(`200k satır: ${ms.toFixed(0)} ms`);
  });
});
