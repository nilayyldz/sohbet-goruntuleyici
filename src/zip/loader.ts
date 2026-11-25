import { AppError } from '../i18n';
import JSZip from 'jszip';
import { baseName } from '../parser/patterns';
import { detectPlatform } from '../parser/parse';

export interface MediaEntry {
  path: string;
  name: string;
  size: number;
  read(): Promise<Blob>;
}

export interface LoadedExport {
  chatText: string;
  chatFileName: string;
  /** Normalize edilmiş dosya adı → girdi */
  media: Map<string, MediaEntry>;
  title: string | null;
}

/** Eşleştirme anahtarı: Unicode NFC (macOS NFD üretir) + küçük harf */
export function mediaKey(name: string): string {
  return baseName(name).normalize('NFC').toLowerCase().trim();
}

/** Zip dosya adlarını önce UTF-8 olarak, olmazsa Windows-1254 (Türkçe) olarak çöz. */
function decodeFileName(bytes: string[] | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array((bytes as string[]).map((c) => c.charCodeAt(0)));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(u8);
  } catch {
    return new TextDecoder('windows-1254').decode(u8);
  }
}

/** Sohbet başlığını dosya adından çıkarır. */
export function titleFromFileName(name: string): string | null {
  const n = baseName(name).replace(/\.(zip|txt)$/i, '').normalize('NFC');
  const patterns = [
    /^WhatsApp Chat with (.+)$/i,
    /^WhatsApp Chat - (.+)$/i,
    /^WhatsApp Sohbeti - (.+)$/i,
    /^(.+) ile WhatsApp Sohbeti$/i,
    /^WhatsApp Sohbeti: (.+)$/i,
  ];
  for (const p of patterns) {
    const m = p.exec(n);
    if (m) return m[1].trim();
  }
  return null;
}

function scoreChatName(name: string): number {
  const b = baseName(name).toLowerCase();
  if (b === '_chat.txt') return 3;
  if (/whatsapp/.test(b)) return 2;
  return 1;
}

/** Tek bir sohbet metni için üst sınır (sıkıştırılmış "zip bombası" sekmeyi çökertmesin) */
export const MAX_CHAT_BYTES = 256 * 1024 * 1024;

/** JSZip boyutu herkese açık API'de vermiyor; zip başlığındaki değeri oku. */
function uncompressedSize(f: JSZip.JSZipObject): number {
  return (f as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
}

export async function loadFile(file: File): Promise<LoadedExport> {
  if (/\.txt$/i.test(file.name)) {
    if (file.size > MAX_CHAT_BYTES) throw new AppError('errTooBig');
    return { chatText: await file.text(), chatFileName: file.name, media: new Map(), title: titleFromFileName(file.name) };
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer(), { decodeFileName: (b) => decodeFileName(b as string[] | Uint8Array) });
  } catch {
    throw new AppError('errBadZip');
  }

  const files = Object.values(zip.files).filter((f) => !f.dir && !/(^|\/)(__MACOSX|\.DS_Store)/.test(f.name));
  const txts = files.filter((f) => /\.txt$/i.test(f.name)).sort((a, b) => scoreChatName(b.name) - scoreChatName(a.name));

  let chatText: string | null = null;
  let chatFile: JSZip.JSZipObject | null = null;
  let tooBig = false;
  // Sohbet adayı olarak en fazla 20 .txt aç; belge olarak eklenmiş yüzlerce .txt'yi tek tek çözme.
  for (const t of txts.slice(0, 20)) {
    if (uncompressedSize(t) > MAX_CHAT_BYTES) {
      tooBig = true;
      continue;
    }
    const text = await t.async('string');
    if (detectPlatform(text.split(/\r?\n/, 500))) {
      chatText = text;
      chatFile = t;
      break;
    }
  }
  if (!chatText || !chatFile) {
    throw new AppError(tooBig ? 'errTooBig' : 'errNoChat');
  }

  const media = new Map<string, MediaEntry>();
  for (const f of files) {
    if (f === chatFile) continue;
    const key = mediaKey(f.name);
    if (media.has(key)) continue;
    media.set(key, { path: f.name, name: baseName(f.name), size: uncompressedSize(f), read: () => f.async('blob') });
  }

  const title = titleFromFileName(file.name) ?? titleFromFileName(chatFile.name);
  return { chatText, chatFileName: chatFile.name, media, title };
}
