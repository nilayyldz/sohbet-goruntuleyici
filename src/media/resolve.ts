import { kindFromName, mimeFromName } from '../parser/patterns';
import type { AttachmentKind, Message } from '../parser/types';
import { mediaKey, type MediaEntry } from '../zip/loader';

export interface ResolveStats {
  referenced: number;
  found: number;
  missing: string[];
  /** "Dahil edilmedi" yazıp zip'te bulunan medya sayısı */
  recovered?: number;
  /** Zip'te olup hiçbir mesajın kullanmadığı dosya sayısı */
  unused?: number;
}

/** Ek referanslarını zip girdileriyle eşleştirir. Dönüş: mesaj id → girdi */
export function resolveAttachments(messages: Message[], media: Map<string, MediaEntry>) {
  const byId = new Map<number, MediaEntry>();
  const stats: ResolveStats = { referenced: 0, found: 0, missing: [] };

  // İkincil indeks: txt "00000012-Rapor.pdf" derken zip'te öneksiz "Rapor.pdf" duruyorsa.
  // Yalnızca öneksiz girdiler indekslenir; aksi hâlde aynı adlı iki belgeden eksik olanı
  // diğerinin dosyasıyla yanlışlıkla eşleşirdi.
  const noPrefix = new Map<string, MediaEntry>();
  for (const [k, v] of media) if (!/^\d{8}-/.test(k)) noPrefix.set(k, v);

  for (const m of messages) {
    const a = m.attachment;
    if (!a) continue;
    const key = mediaKey(a.name);
    const entry = media.get(key) ?? noPrefix.get(key.replace(/^\d{8}-/, ''));
    if (entry) {
      byId.set(m.id, entry);
      if (a.uncertain) delete a.uncertain;
      stats.referenced++;
      stats.found++;
    } else if (a.uncertain) {
      // Tanınmayan etiket ve dosya yok: aslında düz metindi.
      m.text = m.raw ?? m.text;
      delete m.attachment;
    } else {
      stats.referenced++;
      stats.missing.push(a.name);
    }
    delete m.raw;
  }

  stats.recovered = recoverOmitted(messages, media, byId);
  const usedEntries = new Set(byId.values());
  stats.unused = [...media.values()].filter((e) => !usedEntries.has(e)).length;
  return { byId, stats };
}

/** "görüntü dahil edilmedi" etiketinden beklenen ek türü */
const OMITTED_KIND: [RegExp, AttachmentKind[]][] = [
  [/^(görüntü|fotoğraf|resim|image|photo)$/, ['image']],
  [/^(video)$/, ['video']],
  [/^gif$/, ['video', 'image']],
  [/^(ses|audio|sesli mesaj)$/, ['audio']],
  [/^(çıkartma|sticker)$/, ['sticker', 'image']],
  [/^(belge|document)$/, ['document']],
  [/^(kişi kartı|contact card)$/, ['contact']],
];

/** iOS medya adı: 00000012-PHOTO-2023-12-31-21-42-00.jpg → zaman damgası */
const IOS_STAMP = /-(PHOTO|VIDEO|AUDIO|STICKER|GIF)-(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})\./i;

function stampKey(t: number): string {
  return String(Math.round(t / 1000));
}

/**
 * Metinde "medya dahil edilmedi" yazan ama dosyası zip'te bulunan mesajları kurtarır.
 * Yalnızca hiçbir mesajın referans vermediği, zaman damgası ve türü tutan dosyalar eşleşir.
 */
function recoverOmitted(messages: Message[], media: Map<string, MediaEntry>, byId: Map<number, MediaEntry>): number {
  const used = new Set(byId.values());
  const byStamp = new Map<string, MediaEntry[]>();
  for (const entry of media.values()) {
    if (used.has(entry)) continue;
    const s = IOS_STAMP.exec(entry.name);
    if (!s) continue;
    const t = new Date(+s[2], +s[3] - 1, +s[4], +s[5], +s[6], +s[7]).getTime();
    const k = stampKey(t);
    const list = byStamp.get(k) ?? [];
    list.push(entry);
    byStamp.set(k, list);
  }
  if (byStamp.size === 0) return 0;

  let recovered = 0;
  for (const m of messages) {
    if (!m.omitted || !m.author) continue;
    const label = (m.omittedLabel ?? '').toLocaleLowerCase('tr-TR');
    const kinds = OMITTED_KIND.find(([re]) => re.test(label))?.[1];
    for (const offset of [0, -1, 1, -2, 2]) {
      const list = byStamp.get(stampKey(m.date.getTime() + offset * 1000));
      const idx = list?.findIndex((e) => !used.has(e) && (!kinds || kinds.includes(kindFromName(e.name)))) ?? -1;
      if (!list || idx < 0) continue;
      const entry = list[idx];
      used.add(entry);
      byId.set(m.id, entry);
      m.attachment = { name: entry.name, kind: kindFromName(entry.name) };
      m.omitted = false;
      delete m.omittedLabel;
      recovered++;
      break;
    }
  }
  return recovered;
}

/** Blob URL önbelleği: tembel çıkarma ve bellek temizliği */
export class BlobCache {
  private urls = new Map<MediaEntry, string>();
  private pending = new Map<MediaEntry, Promise<string>>();

  async url(entry: MediaEntry): Promise<string> {
    const cached = this.urls.get(entry);
    if (cached) return cached;
    let p = this.pending.get(entry);
    if (!p) {
      p = entry.read().then((raw) => {
        const blob = new Blob([raw], { type: mimeFromName(entry.name) });
        const u = URL.createObjectURL(blob);
        this.urls.set(entry, u);
        this.pending.delete(entry);
        return u;
      });
      this.pending.set(entry, p);
    }
    return p;
  }

  async text(entry: MediaEntry): Promise<string> {
    return (await entry.read()).text();
  }

  release(entry: MediaEntry): void {
    const u = this.urls.get(entry);
    if (u) {
      URL.revokeObjectURL(u);
      this.urls.delete(entry);
    }
  }

  clear(): void {
    for (const u of this.urls.values()) URL.revokeObjectURL(u);
    this.urls.clear();
    this.pending.clear();
  }
}
