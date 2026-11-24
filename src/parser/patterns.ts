import type { AttachmentKind } from './types';

/** Tarih: 31.12.2023 · 12/31/23 · 2023-12-31 */
const DATE = String.raw`(\d{1,4})([./-])(\d{1,2})\2(\d{1,4})`;
/** Saat: 21:41 · 21:41:05 · 9:41 PM · 9:41 p.m. · 09.41 · 9:41 ÖS */
const TIME = String.raw`(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?(?:\s?([AaPp])\.?\s?[Mm]\.?|\s?(ÖÖ|ÖS|öö|ös))?`;

/** iOS: [31.12.2023 21:41:05] Ali: Merhaba */
export const IOS_HEADER = new RegExp(String.raw`^\[${DATE},?\s+${TIME}\]\s?(.*)$`);
/** Android: 31.12.2023 21:41 - Ali: Merhaba */
export const ANDROID_HEADER = new RegExp(String.raw`^${DATE},?\s+${TIME}\s[-–]\s(.*)$`);

/** Görünmez yön/biçim karakterleri (iOS bunlarla doludur) */
export const BIDI_CHARS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
export const LRM = '\u200E';

// ---- Ekler -------------------------------------------------------------

/** iOS: <attached: 00000012-PHOTO-2023-12-31-21-41-05.jpg> · <ek: …> (dilden bağımsız) */
export const IOS_ATTACHMENT = /<\s*[^:<>\n]{1,24}:\s*([^<>\n]+?\.[A-Za-z0-9]{1,6})\s*>/;
/** iOS (Türkçe vb.): <00003035-Rapor.docx eklendi> — etiket dosya adından sonra gelir */
export const IOS_ATTACHMENT_SUFFIX = /<\s*([^<>\n]+?\.[A-Za-z0-9]{1,6})\s+(eklendi|ekli|attached)\s*>/i;

/** Android'in bilinen ek etiketleri. Diğer diller için genel desen de denenir. */
export const ANDROID_ATTACH_LABELS = ['file attached', 'dosya ekli'];
/** Android: IMG-20231231-WA0001.jpg (file attached) · (dosya ekli) */
export const ANDROID_ATTACHMENT = /^(.+?\.[A-Za-z0-9]{1,6}) \(([^()\n]{3,32})\)\s*$/;

// ---- Medya hariç / silindi / düzenlendi --------------------------------

export const OMITTED_EXACT = [
  '<media omitted>',
  '<medya dahil edilmedi>',
  '<medya atlandı>',
  'null',
];
/** iOS EN: "image omitted", "Contact card omitted" */
export const OMITTED_EN = /^([\p{L} ]{2,30}) omitted$/iu;
/** iOS TR: "görüntü dahil edilmedi", "Çıkartma dahil edilmedi" */
export const OMITTED_TR = /^([\p{L} ]{2,30}) dahil edilmedi$/iu;

export const DELETED = [
  'this message was deleted',
  'this message was deleted.',
  'you deleted this message',
  'you deleted this message.',
  'bu mesaj silindi',
  'bu mesaj silindi.',
  'bu mesajı sildiniz',
  'bu mesajı sildiniz.',
];

/** Yönetici (veya başkası) tarafından silinen mesajlar */
export const DELETED_BY = [
  /^bu mesaj .{1,120} tarafından silindi\.?$/i,
  /^this message was deleted by .{1,120}$/i,
];

/**
 * Mesaj sonundaki düzenleme işareti. Başta \s* yok: uzun boşluk dizilerinde
 * her konumdan yeniden denenip karesel zaman (ReDoS) harcardı; boşluk sonradan kırpılıyor.
 */
export const EDITED = /<(this message was edited|bu mesaj düzenlendi)>\s*$/i;

/** "Sen"/"You" olduğunu ele veren mesajlar */
export const SELF_MARKERS = ['you deleted this message', 'bu mesajı sildiniz'];

// ---- Dil ipuçları -------------------------------------------------------

export const TR_HINTS = [
  'dosya ekli', 'dahil edilmedi', '<ek:', ' eklendi>', 'bu mesaj silindi', 'bu mesaj düzenlendi',
  'uçtan uca şifreli', 'gruba ekledi', 'grubu oluşturdu', 'katıldı', 'ayrıldı',
];
export const EN_HINTS = [
  'file attached', 'omitted', '<attached:', 'this message was deleted', 'this message was edited',
  'end-to-end encrypted', 'added', 'created group', 'joined', 'left',
];

// ---- Dosya türü ---------------------------------------------------------

const EXT_KIND: Record<string, AttachmentKind> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image', heic: 'image', heif: 'image',
  webp: 'image',
  mp4: 'video', mov: 'video', '3gp': 'video', m4v: 'video', webm: 'video', mkv: 'video', avi: 'video',
  opus: 'audio', ogg: 'audio', m4a: 'audio', mp3: 'audio', aac: 'audio', wav: 'audio', amr: 'audio',
  vcf: 'contact',
};

export function kindFromName(name: string): AttachmentKind {
  const ext = extOf(name);
  const kind = EXT_KIND[ext] ?? 'document';
  // WhatsApp çıkartmaları: Android STK-…webp, iOS …-STICKER-….webp
  if (ext === 'webp' && /(^STK-|STICKER)/i.test(baseName(name))) return 'sticker';
  return kind;
}

export function extOf(name: string): string {
  const m = /\.([A-Za-z0-9]{1,6})$/.exec(name);
  return m ? m[1].toLowerCase() : '';
}

export function baseName(path: string): string {
  const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return i >= 0 ? path.slice(i + 1) : path;
}

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  bmp: 'image/bmp', heic: 'image/heic', heif: 'image/heif',
  mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', '3gp': 'video/3gpp', webm: 'video/webm',
  mkv: 'video/x-matroska', avi: 'video/x-msvideo',
  opus: 'audio/ogg; codecs=opus', ogg: 'audio/ogg', m4a: 'audio/mp4', mp3: 'audio/mpeg', aac: 'audio/aac',
  wav: 'audio/wav', amr: 'audio/amr',
  pdf: 'application/pdf', txt: 'text/plain', vcf: 'text/vcard',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

export function mimeFromName(name: string): string {
  return MIME[extOf(name)] ?? 'application/octet-stream';
}
