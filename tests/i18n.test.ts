// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { AppError, DICTS, getLang, locale, onLangChange, setLang, t, type Key } from '../src/i18n';
import { formatDay, formatSize } from '../src/ui/format';
import { landingHtml } from '../src/ui/landing';

afterEach(() => setLang('tr', false));

const keys = Object.keys(DICTS.tr) as Key[];
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
/** Sözlükte izin verilen biçim etiketleri */
const ALLOWED_TAGS = /<b>|<\/b>|<br \/>|<span class="hl">|<\/span>/g;

describe('sözlük', () => {
  it('iki dilde de aynı anahtarlar var ve hiçbiri boş değil', () => {
    expect(Object.keys(DICTS.en).sort()).toEqual([...keys].sort());
    for (const lang of ['tr', 'en'] as const) {
      for (const k of keys) expect(DICTS[lang][k].trim(), `${lang}.${k}`).not.toBe('');
    }
  });

  it('yer tutucular iki dilde aynı', () => {
    for (const k of keys) expect(placeholders(DICTS.en[k]), k).toEqual(placeholders(DICTS.tr[k]));
  });

  it('değerler yalnızca izin verilen etiketleri içerir ve tırnak barındırmaz', () => {
    for (const lang of ['tr', 'en'] as const) {
      for (const k of keys) {
        const v = DICTS[lang][k];
        expect(v.replace(ALLOWED_TAGS, ''), `${lang}.${k}`).not.toMatch(/[<>]/);
        expect(v.replace(ALLOWED_TAGS, ''), `${lang}.${k}`).not.toContain('"');
      }
    }
  });

  it('İngilizce metinlerde Türkçe karakter kalmamış (çeviri unutulmamış)', () => {
    const allowed = new Set<Key>(['langToggle']); // "Dil: Türkçe" bilinçli olarak Türkçe
    for (const k of keys) {
      if (allowed.has(k)) continue;
      expect(DICTS.en[k], k).not.toMatch(/[çğıöşüÇĞİÖŞÜ]/);
    }
  });
});

describe('dil değiştirme', () => {
  it('t() seçili dili ve yer tutucuları kullanır', () => {
    setLang('tr', false);
    expect(t('pollTotal', { n: 1234 })).toBe('Toplam 1.234 oy');
    setLang('en', false);
    expect(t('pollTotal', { n: 1234 })).toBe('1,234 votes in total');
    expect(locale()).toBe('en-US');
    expect(document.documentElement.lang).toBe('en');
  });

  it('dinleyicileri haber verir', () => {
    let calls = 0;
    const off = onLangChange(() => calls++);
    setLang('en', false);
    setLang('en', false); // aynı dil: tekrar haber vermez
    setLang('tr', false);
    off();
    setLang('en', false);
    expect(calls).toBe(2);
  });

  it('tarih ve boyut biçimleri dile göre değişir', () => {
    const now = new Date(2026, 10, 26, 12);
    setLang('tr', false);
    expect(formatDay(now, now)).toBe('Bugün');
    expect(formatDay(new Date(2026, 2, 5), now)).toBe('5 Mart 2026');
    expect(formatSize(1536)).toBe('1,5 KB');
    setLang('en', false);
    expect(formatDay(now, now)).toBe('Today');
    expect(formatDay(new Date(2026, 10, 25), now)).toBe('Yesterday');
    expect(formatDay(new Date(2026, 2, 5), now)).toBe('March 5, 2026');
    expect(formatSize(1536)).toBe('1.5 KB');
  });

  it('hata kodları seçili dile çevrilir', () => {
    const err = new AppError('errNoChat');
    setLang('en', false);
    expect(t(err.code)).toMatch(/No WhatsApp chat text/);
    setLang('tr', false);
    expect(t(err.code)).toMatch(/bulunamadı/);
  });

  it('tanıtım sayfası her iki dilde çizilir', () => {
    setLang('en', false);
    const en = landingHtml();
    expect(en).toContain('Choose file');
    expect(en).not.toContain('Dosya seç');
    setLang('tr', false);
    expect(landingHtml()).toContain('Dosya seç');
    expect(getLang()).toBe('tr');
  });
});
