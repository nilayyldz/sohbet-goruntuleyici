/**
 * Tohumlu (seed) sahte WhatsApp dışa aktarımı üreticisi.
 *
 * Her mesaj için hem dışa aktarım satırını hem de ayrıştırıcının üretmesi gereken
 * beklenen sonucu birlikte üretir; böylece testler "üret → ayrıştır → karşılaştır"
 * şeklinde yüzlerce rastgele ama tekrarlanabilir senaryoyu doğrular.
 * İçerikteki tüm adlar ve metinler uydurmadır.
 */
import type { AttachmentKind } from '../../src/parser/types';

export type MockPlatform = 'android' | 'ios';
export type MockLang = 'tr' | 'en';

export interface MockOptions {
  platform: MockPlatform;
  lang: MockLang;
  count: number;
  seed: number;
  /** Varsayılan: TR → DMY, EN → MDY */
  dateOrder?: 'DMY' | 'MDY';
  /** Varsayılan: EN → 12 saat, TR → 24 saat */
  hour12?: boolean;
  /** Katılımcı sayısı (2 = birebir sohbet) */
  people?: number;
  /** Eklerin ne kadarı zip'te olsun (0..1) */
  mediaPresence?: number;
  crlf?: boolean;
  bom?: boolean;
  /** Medya dosyalarını alt klasöre koy */
  subfolder?: string;
  /** Dosya adlarını macOS gibi NFD olarak yaz */
  nfdNames?: boolean;
}

export interface ExpectedMessage {
  date: Date;
  author: string | null;
  text: string;
  attachment?: { name: string; kind: AttachmentKind };
  omitted?: boolean;
  deleted?: boolean;
  selfDeleted?: boolean;
  deletedLabel?: string;
  edited?: boolean;
}

export interface MockExport {
  txt: string;
  /** Zip içi yol → içerik */
  files: Record<string, Uint8Array | string>;
  chatFileName: string;
  zipName: string;
  title: string;
  authors: string[];
  me: string;
  expected: ExpectedMessage[];
  /** txt'de geçip zip'e konmayan ek adları */
  missing: string[];
  options: Required<Omit<MockOptions, 'subfolder'>> & { subfolder: string };
}

const L = '\u200E';
const N = '\u202F';

// ---- Tohumlu rastgele sayı üreteci (mulberry32) -----------------------------
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  };
}

// ---- Uydurma içerik ---------------------------------------------------------
const NAMES_TR = ['Deniz Aksoy', 'Ece', 'Kaan Yılmaz', 'Selin Çelik', 'Burak Öztürk', 'Işıl Güneş', 'Ömer'];
const NAMES_EN = ['Alice Carter', 'Bob', 'Carol Diaz', 'Dave Evans', 'Erin', 'Frank Green', 'Grace'];
const PHONE = '+90 555 010 20 30';
const WORDS_TR = 'merhaba bugün yarın toplantı proje kahve harika tamam evet hayır belki akşam yemek film maç tatil şimdi çok güzel öğle ğüşıöç'.split(' ');
const WORDS_EN = 'hello today tomorrow meeting project coffee great okay yes no maybe evening dinner movie match holiday now very nice lunch'.split(' ');
const EMOJI = ['😀', '🎉', '👍', '❤️', '🙏', '😂', '👨‍👩‍👧', '🇹🇷'];
const DOC_NAMES = ['Rapor.pdf', 'Bütçe 2026.xlsx', 'Sunum (son).pptx', 'notlar.txt', 'Şartname.docx', 'arşiv.zip'];

interface Labels {
  attachedAndroid: string;
  omittedAndroid: string;
  omittedIos: Record<'image' | 'video' | 'audio' | 'sticker' | 'document', string>;
  deleted: string;
  selfDeleted: string;
  edited: string;
  system: (who: string, other: string) => string[];
  pages: string;
  admin: (who: string) => string;
}

const LABELS: Record<MockLang, Labels> = {
  tr: {
    attachedAndroid: 'dosya ekli',
    omittedAndroid: '<Medya dahil edilmedi>',
    omittedIos: { image: 'görüntü', video: 'video', audio: 'ses', sticker: 'Çıkartma', document: 'belge' },
    deleted: 'Bu mesaj silindi',
    selfDeleted: 'Bu mesajı sildiniz',
    edited: '<Bu mesaj düzenlendi>',
    system: (who, other) => [`${who}, ${other} adlı kişiyi ekledi`, `${who} gruptan ayrıldı`, `${who} grup açıklamasını değiştirdi`],
    pages: 'sayfa',
    admin: (who) => `Bu mesaj ~${N}${who} adlı yönetici tarafından silindi.`,
  },
  en: {
    attachedAndroid: 'file attached',
    omittedAndroid: '<Media omitted>',
    omittedIos: { image: 'image', video: 'video', audio: 'audio', sticker: 'sticker', document: 'document' },
    deleted: 'This message was deleted',
    selfDeleted: 'You deleted this message',
    edited: '<This message was edited>',
    system: (who, other) => [`${who} added ${other}`, `${who} left`, `${who} changed the group description`],
    pages: 'pages',
    admin: (who) => `This message was deleted by admin ${who}.`,
  },
};

const ENCRYPTION: Record<MockLang, string> = {
  tr: 'Mesajlar ve aramalar uçtan uca şifrelidir. WhatsApp dahil olmak üzere bu sohbetin dışında bulunan hiç kimse bunları okuyamaz ve dinleyemez.',
  en: 'Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.',
};

// ---- Tarih biçimleme ---------------------------------------------------------
const p2 = (n: number) => String(n).padStart(2, '0');

function formatStamp(d: Date, o: MockExport['options']): string {
  const day = d.getDate();
  const mon = d.getMonth() + 1;
  const yy = d.getFullYear() % 100;
  let date: string;
  if (o.lang === 'tr') date = `${p2(day)}.${p2(mon)}.${d.getFullYear()}`;
  else date = o.dateOrder === 'MDY' ? `${mon}/${day}/${p2(yy)}` : `${p2(day)}/${p2(mon)}/${d.getFullYear()}`;
  const secs = o.platform === 'ios' ? `:${p2(d.getSeconds())}` : '';
  let time: string;
  if (o.hour12) {
    const h = d.getHours() % 12 || 12;
    time = `${h}:${p2(d.getMinutes())}${secs}${N}${d.getHours() < 12 ? 'AM' : 'PM'}`;
  } else {
    time = `${p2(d.getHours())}:${p2(d.getMinutes())}${secs}`;
  }
  const sep = o.lang === 'tr' && o.platform === 'android' ? ' ' : ', ';
  return o.platform === 'ios' ? `[${date}${sep}${time}]` : `${date}${sep}${time} -`;
}

// ---- Medya baytları (gerçek biçim başlıklarıyla) ----------------------------
const PNG_1PX = Uint8Array.from(
  atobBytes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC'),
);
function atobBytes(b64: string): number[] {
  return [...atob(b64)].map((c) => c.charCodeAt(0));
}
function fakeBytes(kind: AttachmentKind, name: string): Uint8Array | string {
  if (kind === 'image' || kind === 'sticker') return PNG_1PX;
  if (kind === 'contact') return `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${name.replace(/\.vcf$/i, '')}\r\nTEL:${PHONE}\r\nEND:VCARD\r\n`;
  if (name.endsWith('.pdf')) return '%PDF-1.4\n%%EOF\n';
  return `sahte içerik: ${name}`;
}

// ---- Üretici -----------------------------------------------------------------
export function generateExport(opts: MockOptions): MockExport {
  const o: MockExport['options'] = {
    dateOrder: opts.lang === 'tr' ? 'DMY' : 'MDY',
    hour12: opts.lang === 'en',
    people: 4,
    mediaPresence: 0.8,
    crlf: opts.platform === 'ios',
    bom: false,
    nfdNames: false,
    ...opts,
    subfolder: opts.subfolder ?? '',
  };
  const r = rng(o.seed);
  const lab = LABELS[o.lang];
  const words = o.lang === 'tr' ? WORDS_TR : WORDS_EN;
  const pool = o.lang === 'tr' ? NAMES_TR : NAMES_EN;
  const authors = [...pool.slice(0, Math.max(1, o.people - 1)), PHONE].slice(0, o.people);
  const me = authors[0];
  const group = o.people > 2;
  const title = group ? (o.lang === 'tr' ? 'Proje Ekibi' : 'Project Team') : authors[1];
  const iosSystemAuthor = group ? title : authors[1];

  const lines: string[] = [];
  const expected: ExpectedMessage[] = [];
  const files: Record<string, Uint8Array | string> = {};
  const missing: string[] = [];
  let seq = 1;
  let photoIdx = 0;

  // Gün > 12 ile başla ki tarih sırası belirsiz kalmasın
  let t = new Date(2025, 2, 14, 9, 0, 0).getTime();

  const emit = (date: Date, author: string | null, body: string, exp: Omit<ExpectedMessage, 'date' | 'author'>) => {
    const stamp = formatStamp(date, o);
    let line: string;
    if (author === null) {
      line = o.platform === 'ios' ? `${stamp} ${iosSystemAuthor}: ${L}${body}` : `${stamp} ${body}`;
    } else {
      const name = author === PHONE ? `\u202A${PHONE}\u202C` : author;
      const lead = o.platform === 'ios' && body.startsWith(L) ? L : '';
      line = `${lead}${stamp} ${name}: ${body}`;
    }
    lines.push(line);
    expected.push({ date, author, ...exp });
  };

  const sentence = (min: number, max: number) => {
    const n = r.int(min, max);
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(r.chance(0.08) ? r.pick(EMOJI) : r.pick(words));
    return out.join(' ');
  };

  const addAttachment = (date: Date, author: string, kind: AttachmentKind) => {
    const stampName = `${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}-${p2(date.getHours())}-${p2(date.getMinutes())}-${p2(date.getSeconds())}`;
    const ymd = `${date.getFullYear()}${p2(date.getMonth() + 1)}${p2(date.getDate())}`;
    const wa = `WA${String(photoIdx++).padStart(4, '0')}`;
    let name: string;
    let docDisplay = '';
    if (o.platform === 'android') {
      name = {
        image: `IMG-${ymd}-${wa}.jpg`,
        video: `VID-${ymd}-${wa}.mp4`,
        audio: `PTT-${ymd}-${wa}.opus`,
        sticker: `STK-${ymd}-${wa}.webp`,
        contact: `${r.pick(pool)} ${seq++}.vcf`,
        document: `${seq++}-${r.pick(DOC_NAMES)}`,
      }[kind];
    } else {
      const id = String(seq++).padStart(8, '0');
      if (kind === 'document') docDisplay = r.pick(DOC_NAMES);
      name = {
        image: `${id}-PHOTO-${stampName}.jpg`,
        video: `${id}-VIDEO-${stampName}.mp4`,
        audio: `${id}-AUDIO-${stampName}.opus`,
        sticker: `${id}-STICKER-${stampName}.webp`,
        contact: `${id}-${r.pick(pool)}.vcf`,
        document: `${id}-${docDisplay}`,
      }[kind];
    }
    const caption = o.platform === 'android' && kind !== 'sticker' && r.chance(0.3) ? sentence(1, 6) : '';
    let body: string;
    if (o.platform === 'android') {
      body = `${name} (${lab.attachedAndroid})${caption ? `\n${caption}` : ''}`;
    } else {
      const marker = o.lang === 'tr' ? `<${name} eklendi>` : `<attached: ${name}>`;
      const pre = kind === 'document' ? `${docDisplay} • ${L}${r.int(1, 9)} ${lab.pages} ${L}` : '';
      body = `${L}${pre}${marker}`;
    }
    if (r.chance(o.mediaPresence)) {
      const path = `${o.subfolder}${o.nfdNames ? name.normalize('NFD') : name}`;
      files[path] = fakeBytes(kind, name);
    } else {
      missing.push(name);
    }
    emit(date, author, body, { text: caption, attachment: { name, kind } });
  };

  // Şifreleme bildirimi
  emit(new Date(t), null, ENCRYPTION[o.lang], { text: ENCRYPTION[o.lang] });

  for (let i = 0; i < o.count; i++) {
    t += r.int(1, 90) * 60_000 + (o.platform === 'ios' ? r.int(0, 59) * 1000 : 0);
    const date = new Date(t);
    if (o.platform === 'android') date.setSeconds(0);
    const author = r.pick(authors);
    const roll = r.next();

    if (roll < 0.5) {
      const multi = r.chance(0.15);
      let text = multi ? `${sentence(2, 8)}\n${sentence(1, 5)}\n- ${sentence(1, 3)}` : sentence(1, 14);
      if (r.chance(0.08)) text = `*${sentence(1, 3)}* ve _${sentence(1, 2)}_`;
      if (r.chance(0.06)) text = `bağlantı: https://example.com/yol?id=${i}`;
      if (r.chance(0.06)) text = `@${r.pick(authors).replace(/^\+/, '')} ${sentence(1, 4)}`;
      if (r.chance(0.04)) text = `saat: 12:30 not: hazır`;
      const edited = r.chance(0.05);
      const body = edited ? `${text} ${o.platform === 'ios' ? L : ''}${lab.edited}` : text;
      emit(date, author, body, { text, ...(edited ? { edited: true } : {}) });
    } else if (roll < 0.75) {
      const kind = r.pick<AttachmentKind>(['image', 'image', 'image', 'video', 'audio', 'sticker', 'document', 'contact']);
      addAttachment(date, author, kind);
    } else if (roll < 0.83) {
      if (o.platform === 'android') {
        emit(date, author, lab.omittedAndroid, { text: '', omitted: true });
      } else {
        const k = r.pick(['image', 'video', 'audio', 'sticker', 'document'] as const);
        const label = lab.omittedIos[k];
        const body = o.lang === 'tr' ? `${L}${label} dahil edilmedi` : `${L}${label} omitted`;
        emit(date, author, body, { text: '', omitted: true });
      }
    } else if (roll < 0.9) {
      const self = author === me && r.chance(0.6);
      const admin = !self && group && r.chance(0.3);
      const dot = o.platform === 'ios' ? '.' : '';
      if (admin) {
        const label = lab.admin(authors[1]);
        emit(date, author, `${o.platform === 'ios' ? L : ''}${label}`, {
          text: '', deleted: true, deletedLabel: label.replace(/\.$/, '').replace(N, ' '),
        });
      } else {
        const label = self ? lab.selfDeleted : lab.deleted;
        emit(date, author, `${o.platform === 'ios' ? L : ''}${label}${dot}`, { text: '', deleted: true, selfDeleted: self });
      }
    } else if (roll < 0.95 && group) {
      const who = r.pick(authors);
      const other = r.pick(authors);
      const text = r.pick(lab.system(who, other));
      emit(date, null, text, { text });
    } else {
      // Emojiden oluşan kısa mesaj
      const text = `${r.pick(EMOJI)}${r.chance(0.5) ? r.pick(EMOJI) : ''}`;
      emit(date, author, text, { text });
    }
  }

  // "Bu mesajı sildiniz" en az bir kez geçsin ki "ben" tahmini sınanabilsin
  if (!expected.some((e) => e.selfDeleted)) {
    t += 60_000;
    const date = new Date(t);
    if (o.platform === 'android') date.setSeconds(0);
    const dot = o.platform === 'ios' ? '.' : '';
    emit(date, me, `${o.platform === 'ios' ? L : ''}${lab.selfDeleted}${dot}`, { text: '', deleted: true, selfDeleted: true });
  }

  let txt = lines.join(o.crlf ? '\r\n' : '\n');
  if (o.bom) txt = `\uFEFF${txt}`;

  const chatFileName =
    o.platform === 'ios' ? '_chat.txt' : o.lang === 'tr' ? `${title} ile WhatsApp Sohbeti.txt` : `WhatsApp Chat with ${title}.txt`;
  files[`${o.subfolder}${chatFileName}`] = txt;
  const zipName = o.lang === 'tr' ? `WhatsApp Sohbeti - ${title}.zip` : `WhatsApp Chat - ${title}.zip`;

  return { txt, files, chatFileName, zipName, title, authors, me, expected, missing, options: o };
}
