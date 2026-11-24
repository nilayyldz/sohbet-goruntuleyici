import {
  ANDROID_ATTACH_LABELS, ANDROID_ATTACHMENT, ANDROID_HEADER, BIDI_CHARS, DELETED, DELETED_BY, EDITED, EN_HINTS,
  IOS_ATTACHMENT, IOS_ATTACHMENT_SUFFIX, IOS_HEADER, LRM, OMITTED_EN, OMITTED_EXACT, OMITTED_TR, SELF_MARKERS, TR_HINTS,
  kindFromName, POLL_HEADER, POLL_OPTION,
} from './patterns';
import type { DateOrder, Lang, Message, ParseResult, Platform, Poll } from './types';

interface RawEntry {
  a: number; b: number; c: number; aLen: number; sep: string;
  h: number; m: number; s: number; ampm: 'am' | 'pm' | null;
  body: string;
}

/** Satır başındaki görünmez karakterleri atar, özel boşlukları normal boşluğa çevirir. */
function cleanLine(line: string): string {
  return line.replace(/^[\u200E\u200F\u202A-\u202E\uFEFF]+/, '').replace(/[\u202F\u00A0]/g, ' ');
}

function stripBidi(s: string): string {
  return s.replace(BIDI_CHARS, '');
}

export function detectPlatform(lines: string[]): Platform | null {
  let ios = 0;
  let android = 0;
  for (let i = 0; i < lines.length && i < 500; i++) {
    const l = cleanLine(lines[i]);
    if (IOS_HEADER.test(l)) ios++;
    else if (ANDROID_HEADER.test(l)) android++;
  }
  if (ios === 0 && android === 0) return null;
  return ios >= android ? 'ios' : 'android';
}

function toEntry(m: RegExpExecArray): RawEntry {
  const marker = m[8] ?? m[9];
  let ampm: RawEntry['ampm'] = null;
  if (m[8]) ampm = m[8].toLowerCase() === 'p' ? 'pm' : 'am';
  else if (m[9]) ampm = marker.toLowerCase() === 'ös' ? 'pm' : 'am';
  return {
    a: +m[1], sep: m[2], b: +m[3], c: +m[4], aLen: m[1].length,
    h: +m[5], m: +m[6], s: m[7] ? +m[7] : 0, ampm,
    body: m[10] ?? '',
  };
}

function buildDate(e: RawEntry, order: DateOrder): Date {
  let y: number, mo: number, d: number;
  if (order === 'YMD') { y = e.a; mo = e.b; d = e.c; }
  else if (order === 'MDY') { mo = e.a; d = e.b; y = e.c; }
  else { d = e.a; mo = e.b; y = e.c; }
  if (y < 100) y += 2000;
  let h = e.h;
  if (e.ampm === 'pm') h = (h % 12) + 12;
  else if (e.ampm === 'am') h = h % 12;
  return new Date(y, mo - 1, d, h, e.m, e.s);
}

function countDecreases(entries: RawEntry[], order: DateOrder): number {
  let prev = -Infinity;
  let dec = 0;
  for (const e of entries) {
    const t = buildDate(e, order).getTime();
    if (t < prev) dec++;
    prev = t;
  }
  return dec;
}

export function detectDateOrder(entries: RawEntry[]): DateOrder {
  if (entries.length === 0) return 'DMY';
  if (entries.some((e) => e.aLen === 4)) return 'YMD';
  const firstGt12 = entries.some((e) => e.a > 12);
  const secondGt12 = entries.some((e) => e.b > 12);
  if (firstGt12 && !secondGt12) return 'DMY';
  if (secondGt12 && !firstGt12) return 'MDY';
  // Belirsiz: mesajlar zaman sırasında olmalı; hangi yorum daha az geri gidiyorsa onu seç.
  const dmy = countDecreases(entries, 'DMY');
  const mdy = countDecreases(entries, 'MDY');
  if (dmy !== mdy) return dmy < mdy ? 'DMY' : 'MDY';
  if (entries[0].sep === '.') return 'DMY';
  return entries[0].ampm ? 'MDY' : 'DMY';
}

function isValidAuthor(name: string): boolean {
  return name.length > 0 && name.length <= 80 && !/["“”„«»]/.test(name);
}

/** Mesaj gövdesindeki işaretleri (ek, medya hariç, silindi, düzenlendi) çözer. */
function interpretText(msg: Message, rawText: string, markerTexts: string[]): void {
  let text = rawText;
  const edited = EDITED.exec(stripBidi(text));
  if (edited) {
    msg.edited = true;
    markerTexts.push(edited[1]);
    text = stripBidi(text).slice(0, edited.index);
  }
  text = stripBidi(text).trim();
  const lower = text.toLowerCase();

  if (OMITTED_EXACT.includes(lower)) {
    msg.omitted = true;
    markerTexts.push(lower);
    msg.text = '';
    return;
  }
  if (!text.includes('\n')) {
    const om = OMITTED_EN.exec(text) ?? OMITTED_TR.exec(text);
    if (om) {
      msg.omitted = true;
      msg.omittedLabel = om[1].toLowerCase();
      markerTexts.push(lower);
      msg.text = '';
      return;
    }
  }
  if (DELETED.includes(lower)) {
    msg.deleted = true;
    msg.selfDeleted = SELF_MARKERS.includes(lower.replace(/\.$/, ''));
    markerTexts.push(lower);
    msg.text = '';
    return;
  }
  // "Bu mesaj ~ Ad adlı yönetici tarafından silindi." / "This message was deleted by admin ~ Ad."
  if (!text.includes('\n') && DELETED_BY.some((re) => re.test(text))) {
    msg.deleted = true;
    msg.deletedLabel = text.replace(/\.$/, '');
    markerTexts.push(lower);
    msg.text = '';
    return;
  }

  // iOS: "<attached: dosya.jpg>" (belgelerde önünde "Rapor.pdf • 3 pages" bulunur)
  const ios = IOS_ATTACHMENT.exec(text) ?? IOS_ATTACHMENT_SUFFIX.exec(text);
  if (ios) {
    const name = ios[1].trim();
    markerTexts.push(ios[0].toLowerCase());
    let before = text.slice(0, ios.index).trim();
    const after = text.slice(ios.index + ios[0].length).trim();
    if (before.includes('•') || /\d+\s+(pages?|sayfa)\b/i.test(before) || /\.[A-Za-z0-9]{1,6}$/.test(before)) {
      before = '';
    }
    msg.attachment = { name, kind: kindFromName(name) };
    msg.text = [before, after].filter(Boolean).join('\n');
    return;
  }

  // Android: "IMG-20231231-WA0001.jpg (file attached)" + isteğe bağlı açıklama satırları
  const nl = text.indexOf('\n');
  const first = nl >= 0 ? text.slice(0, nl) : text;
  const rest = nl >= 0 ? text.slice(nl + 1).trim() : '';
  const an = ANDROID_ATTACHMENT.exec(first);
  if (an) {
    const label = an[2].toLowerCase();
    const name = an[1].trim();
    msg.attachment = { name, kind: kindFromName(name) };
    msg.text = rest;
    if (ANDROID_ATTACH_LABELS.includes(label)) {
      markerTexts.push(label);
    } else {
      // Bilinmeyen etiket (başka dil olabilir): zip'te dosya bulunamazsa düz metne geri dönülecek.
      msg.attachment.uncertain = true;
      msg.raw = text;
    }
    return;
  }

  msg.text = text;
  const poll = parsePoll(text);
  if (poll) {
    msg.poll = poll;
    markerTexts.push(text.slice(0, text.indexOf(':') + 1).toLowerCase());
  }
}

/**
 * Anket metni:
 *   ANKET:            POLL:
 *   Soru              Question
 *   SEÇENEK: a (1 oy) OPTION: a (1 vote)
 * Soru birden çok satır olabilir; en az bir seçenek gerekir.
 */
export function parsePoll(text: string): Poll | null {
  const lines = text.split('\n');
  if (lines.length < 3 || !POLL_HEADER.test(lines[0].trim())) return null;
  const question: string[] = [];
  const options: Poll['options'] = [];
  for (const raw of lines.slice(1)) {
    const line = raw.trim();
    const opt = POLL_OPTION.exec(line);
    if (opt) {
      options.push({ text: opt[1].trim(), votes: Number(opt[2]) });
    } else if (options.length === 0) {
      question.push(line);
    } else {
      return null; // seçeneklerden sonra beklenmeyen satır: anket değil
    }
  }
  if (!options.length || !question.join('').trim()) return null;
  return { question: question.join('\n').trim(), options };
}

function detectLang(markerTexts: string[]): Lang {
  let tr = 0;
  let en = 0;
  for (const raw of markerTexts) {
    const t = raw.toLowerCase();
    for (const h of TR_HINTS) if (t.includes(h)) tr++;
    for (const h of EN_HINTS) if (t.includes(h)) en++;
  }
  if (tr === 0 && en === 0) return 'unknown';
  return tr >= en ? 'tr' : 'en';
}

export function parseChat(input: string): ParseResult {
  const lines = input.replace(/^\uFEFF/, '').split(/\r\n|\n|\r|\u2028/);
  const platform = detectPlatform(lines);
  if (!platform) {
    throw new Error('Bu dosya bir WhatsApp sohbet dışa aktarımına benzemiyor.');
  }
  const header = platform === 'ios' ? IOS_HEADER : ANDROID_HEADER;

  const entries: RawEntry[] = [];
  for (const line of lines) {
    const m = header.exec(cleanLine(line));
    if (m) {
      entries.push(toEntry(m));
    } else if (entries.length > 0) {
      // Tarihle başlamayan satır: önceki mesajın devamı
      entries[entries.length - 1].body += '\n' + line.replace(/[\u202F\u00A0]/g, ' ');
    }
  }

  const dateOrder = detectDateOrder(entries);
  const messages: Message[] = [];
  const markerTexts: string[] = [];
  const authorSet = new Set<string>();

  for (const e of entries) {
    const msg: Message = { id: messages.length, date: buildDate(e, dateOrder), author: null, text: '' };
    const body = e.body;
    const sepIdx = body.indexOf(': ');
    let author: string | null = null;
    let text = body;
    if (sepIdx > 0) {
      const candidate = stripBidi(body.slice(0, sepIdx)).trim();
      if (isValidAuthor(candidate)) {
        author = candidate;
        text = body.slice(sepIdx + 2);
      }
    }

    if (author !== null && platform === 'ios' && text.startsWith(LRM)) {
      // iOS sistem mesajları "Grup Adı: \u200EX gruba katıldı" biçimindedir (başta LRM).
      // Ekler ve işaretler de LRM ile başlar; onları ayırt etmek için önce yorumla.
      interpretText(msg, text, markerTexts);
      const isMarker = msg.attachment || msg.omitted || msg.deleted || msg.edited || msg.poll;
      if (!isMarker) {
        msg.author = null;
        markerTexts.push(msg.text);
      } else {
        msg.author = author;
      }
    } else if (author === null) {
      msg.text = stripBidi(text).trim();
      markerTexts.push(msg.text);
    } else {
      msg.author = author;
      interpretText(msg, text, markerTexts);
    }

    if (msg.author) authorSet.add(msg.author);
    messages.push(msg);
  }

  return { platform, lang: detectLang(markerTexts), dateOrder, messages, authors: [...authorSet] };
}

/**
 * "Ben" olan kişiyi tahmin eder (sağ tarafta gösterilecek baloncuklar).
 * 1) "Bu mesajı sildiniz" / "You deleted this message" yazan kişi kesin olarak bendir.
 * 2) İki kişilik sohbette sohbet başlığı karşı tarafın adıdır.
 */
export function guessMe(result: ParseResult, chatTitle: string | null): string | null {
  for (const m of result.messages) {
    if (m.selfDeleted && m.author) return m.author;
  }
  if (result.authors.length === 2 && chatTitle) {
    const t = chatTitle.trim().toLowerCase();
    const idx = result.authors.findIndex((a) => a.toLowerCase() === t);
    if (idx >= 0) return result.authors[1 - idx];
  }
  return null;
}
