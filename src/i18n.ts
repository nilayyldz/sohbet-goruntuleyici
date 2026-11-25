/**
 * Arayüz dili (Türkçe / İngilizce). Sohbet içeriği çevrilmez; yalnızca uygulamanın kendi metinleri.
 * Sözlük değerleri sabittir ve kod içinde yazılır; bazıları <b>, <br />, <kbd>,
 * <span class="hl"> içerebilir (güvenlik testi yalnızca bu etiketlere izin verir).
 */
export type Lang = 'tr' | 'en';

const tr = {
  // Genel
  appName: 'Sohbet Görüntüleyici',
  brandHtml: 'Sohbet<b>Görüntüleyici</b>',
  themeToggle: 'Açık/koyu tema',
  langToggle: 'Dil: English',
  langCode: 'EN',
  notAffiliated: 'WhatsApp veya Meta ile bağlantılı değildir.',
  openSource: 'Açık kaynak · MIT lisansı',

  // Tanıtım sayfası
  navHow: 'Nasıl çalışır?',
  navPrivacy: 'Gizlilik',
  pill: '%100 tarayıcında · Hiçbir şey yüklenmez',
  heroHtml: 'WhatsApp sohbetlerin,<br /><span class="hl">olduğu gibi</span> karşında.',
  lead: 'Dışa aktardığın zip dosyasını bırak. Mesajlar, fotoğraflar, videolar, sesli mesajlar ve anketler saniyeler içinde, tanıdık bir görünümle açılsın.',
  dropTitle: 'Zip dosyanı buraya bırak',
  dropText: 'veya tıklayıp seç · .zip / .txt',
  dropBtn: 'Dosya seç',
  trustUpload: 'Sunucuya yüklenmez',
  trustOffline: 'İnternetsiz çalışır',
  trustPlatforms: 'Android ve iPhone',
  featuresLabel: 'Özellikler',
  f1Title: 'Her şey yerli yerinde',
  f1Text: 'Fotoğraf, video, sesli mesaj, çıkartma, belge, kişi kartı ve anketler mesajın içinde görünür.',
  f2Title: 'Bul, git, oku',
  f2Text: 'Binlerce mesaj arasında ara, istediğin tarihe atla, fotoğrafları tam ekran gez.',
  f3Title: 'Senin bakış açın',
  f3Text: 'Kendi adını seç, mesajların sağda yeşil baloncuklarda görünsün. Koyu tema da hazır.',
  f4Title: 'Hafif ve hızlı',
  f4Text: 'Tek bir dosya, kurulum yok. 60 bin mesajlık gruplar bile akıcı açılır.',
  stepsTitle: 'Üç adımda sohbetin karşında',
  s1Title: 'Sohbeti dışa aktar',
  s1AndroidHtml: '<b>Android:</b> Sohbet → <b>⋮</b> → Diğer → <b>Sohbeti dışa aktar</b> → Medyayı ekle',
  s1IphoneHtml: '<b>iPhone:</b> Sohbet → kişi/grup adı → <b>Sohbeti Dışa Aktar</b> → Medya Ekle',
  s2Title: "Zip'i buraya bırak",
  s2TextHtml: "Dosyayı açmana gerek yok. Olduğu gibi sürükle ya da <b>Dosya seç</b>'e tıkla.",
  s3Title: 'Oku, ara, gez',
  s3TextHtml: "Sohbet WhatsApp'taki gibi açılır. <b>Ben:</b> menüsünden kendi adını seç.",
  shortcutsLabel: 'Kısayollar',
  scSearch: 'Sohbette ara',
  scNextPrev: 'Sonraki / önceki sonuç',
  scPhotos: 'Fotoğraflar arasında gez',
  scClose: 'Aramayı / fotoğrafı kapat',
  scTapPhoto: 'Fotoğrafa dokun, tam ekran aç',
  scDate: 'Belirli bir tarihe git',
  privacyTitle: 'Sohbetin sadece senin.',
  privacyText: 'Dosyan bu sayfadan dışarı çıkamaz: sayfa, tarayıcıya hiçbir sunucuya bağlanmama kuralıyla yüklenir. Hesap yok, reklam yok, izleme yok. Sayfayı kapattığında her şey bellekten silinir.',

  // Telefon önizlemesi
  pvGroup: 'Proje Ekibi',
  pvMembers: 'Ece, Kaan, Selin, Sen',
  pvToday: 'Bugün',
  pvMsg1: 'Sunumu attım, bakar mısınız? 🙌',
  pvDoc: 'Sunum-taslak.pdf',
  pvDocMeta: 'PDF · 12 sayfa',
  pvMsg2: 'Harika olmuş, akşam üstünden geçeriz 👍',
  pvPollQ: 'Toplantı ne zaman?',
  pvPollA: 'Bu akşam',
  pvPollB: 'Yarın sabah',

  // Yükleme ve hatalar
  loadingOpen: 'Dosya açılıyor…',
  loadingParse: 'Mesajlar ayrıştırılıyor…',
  dropHere: 'Dosyayı bırak',
  errRead: 'Dosya okunamadı.',
  errTooBig: 'Sohbet metni tarayıcıda açılamayacak kadar büyük (256 MB sınırı).',
  errBadZip: 'Zip dosyası açılamadı. Dosya bozuk veya zip değil.',
  errNoChat: 'Zip içinde WhatsApp sohbet metni (.txt) bulunamadı.',
  errNotChat: 'Bu dosya bir WhatsApp sohbet dışa aktarımına benzemiyor.',

  // Sohbet ekranı
  back: 'Başka dosya aç',
  messagesCount: '{n} mesaj',
  meHint: 'Sağ tarafta (yeşil) gösterilecek kişi',
  meAria: 'Ben kimim?',
  meNone: 'Ben: seçilmedi',
  meOption: 'Ben: {name}',
  search: 'Sohbette ara (Ctrl+F)',
  searchPlaceholder: 'Sohbette ara…',
  searchAria: 'Sohbette ara',
  searchPrev: 'Önceki sonuç (Shift+Enter)',
  searchNext: 'Sonraki sonuç (Enter)',
  searchClose: 'Aramayı kapat (Esc)',
  searchNone: 'Sonuç yok',
  jumpDate: 'Tarihe git',
  info: 'Dışa aktarım bilgisi',
  scrollEnd: 'En son mesaja git',
  rendering: 'Görüntüleniyor… %{p}',
  emptyChat: 'Bu sohbette mesaj yok.',
  infoFormat: 'Biçim',
  infoDateOrder: 'Tarih sırası',
  infoMessages: 'Mesaj',
  infoParticipants: 'Katılımcı',
  infoMatched: 'Eşleşen medya',
  infoOmitted: 'Dahil edilmeyen medya',
  infoRecovered: 'Zaman damgasıyla kurtarılan',
  infoUnused: "Zip'te kullanılmayan dosya",
  infoRange: 'Tarih aralığı',
  infoMissing: "Zip'te bulunamayan {n} dosya",
  infoPrivacy: 'Tüm işlemler bu cihazda yapıldı; hiçbir veri gönderilmedi.',
  langTr: 'Türkçe',
  langEn: 'İngilizce',
  langUnknown: 'Bilinmiyor',
  orderDMY: 'Gün.Ay.Yıl',
  orderMDY: 'Ay/Gün/Yıl',
  orderYMD: 'Yıl-Ay-Gün',
  edited: 'Düzenlendi',
  deleted: 'Bu mesaj silindi',
  selfDeleted: 'Bu mesajı sildiniz',
  omittedTitle: 'WhatsApp bu dosyayı dışa aktarıma eklemedi (medyasız dışa aktarım ya da telefonda indirilmemiş medya).',
  omitted: '{kind} dışa aktarıma dahil edilmedi',
  kindMedia: 'Medya',
  kindPhoto: 'Fotoğraf',
  kindVideo: 'Video',
  kindGif: 'GIF',
  kindAudio: 'Ses kaydı',
  kindSticker: 'Çıkartma',
  kindDocument: 'Belge',
  kindContact: 'Kişi kartı',
  poll: 'Anket',
  pollTotal: 'Toplam {n} oy',
  pollVotes: '{text}: {n} oy',

  // Medya
  imageZoom: 'Görseli büyüt: {name}',
  imageUnsupported: 'Bu görsel biçimi tarayıcıda gösterilemiyor.',
  videoUnsupported: 'Bu video biçimi tarayıcıda oynatılamıyor.',
  opusUnsupported: 'Bu tarayıcı bu ses biçimini (.opus) çalamıyor. İndirip başka bir oynatıcıyla açabilirsin.',
  audioUnsupported: 'Bu ses dosyası tarayıcıda çalınamıyor.',
  contactMore: '{name} ve {n} kişi daha',
  contactDefault: 'Kişi',
  openTab: 'Yeni sekmede aç',
  download: 'İndir',
  downloadName: 'İndir: {name}',
  stickerMissing: '🏷️ Çıkartma',
  stickerMissingTitle: 'Çıkartma dosyası zip içinde yok.',
  fileMissing: 'Bu dosya zip içinde yok.',

  // Görsel gösterici
  viewer: 'Görsel gösterici',
  close: 'Kapat',
  closeEsc: 'Kapat (Esc)',
  prev: 'Önceki',
  next: 'Sonraki',

  // Tarih
  today: 'Bugün',
  yesterday: 'Dün',
};

type Dict = typeof tr;
export type Key = keyof Dict;

const en: Dict = {
  appName: 'Chat Viewer',
  brandHtml: 'Chat<b>Viewer</b>',
  themeToggle: 'Light/dark theme',
  langToggle: 'Dil: Türkçe',
  langCode: 'TR',
  notAffiliated: 'Not affiliated with WhatsApp or Meta.',
  openSource: 'Open source · MIT license',

  navHow: 'How it works',
  navPrivacy: 'Privacy',
  pill: '100% in your browser · Nothing is uploaded',
  heroHtml: 'Your WhatsApp chats,<br /><span class="hl">just as they were.</span>',
  lead: 'Drop the zip file you exported. Messages, photos, videos, voice notes and polls open in seconds, in a familiar look.',
  dropTitle: 'Drop your zip file here',
  dropText: 'or click to choose · .zip / .txt',
  dropBtn: 'Choose file',
  trustUpload: 'Never uploaded',
  trustOffline: 'Works offline',
  trustPlatforms: 'Android and iPhone',
  featuresLabel: 'Features',
  f1Title: 'Everything in place',
  f1Text: 'Photos, videos, voice notes, stickers, documents, contact cards and polls appear inside their messages.',
  f2Title: 'Find, jump, read',
  f2Text: 'Search thousands of messages, jump to any date, browse photos full screen.',
  f3Title: 'Your point of view',
  f3Text: 'Pick your name and your messages move to the right, in green bubbles. Dark theme included.',
  f4Title: 'Light and fast',
  f4Text: 'One file, nothing to install. Even group chats with 60,000 messages stay smooth.',
  stepsTitle: 'Your chat in three steps',
  s1Title: 'Export the chat',
  s1AndroidHtml: '<b>Android:</b> Chat → <b>⋮</b> → More → <b>Export chat</b> → Include media',
  s1IphoneHtml: '<b>iPhone:</b> Chat → contact/group name → <b>Export Chat</b> → Attach Media',
  s2Title: 'Drop the zip here',
  s2TextHtml: 'No need to unzip it. Drag it in as is, or click <b>Choose file</b>.',
  s3Title: 'Read, search, browse',
  s3TextHtml: 'The chat opens just like in WhatsApp. Pick your name from the <b>Me:</b> menu.',
  shortcutsLabel: 'Shortcuts',
  scSearch: 'Search the chat',
  scNextPrev: 'Next / previous result',
  scPhotos: 'Browse photos',
  scClose: 'Close search / photo',
  scTapPhoto: 'Tap a photo to open it full screen',
  scDate: 'Jump to a date',
  privacyTitle: 'Your chat stays yours.',
  privacyText: 'Your file can’t leave this page: it loads with a rule that stops the browser from connecting to any server. No accounts, no ads, no tracking. Close the tab and everything is cleared from memory.',

  pvGroup: 'Project Team',
  pvMembers: 'Ece, Kaan, Selin, You',
  pvToday: 'Today',
  pvMsg1: 'Sent the deck, can you take a look? 🙌',
  pvDoc: 'Deck-draft.pdf',
  pvDocMeta: 'PDF · 12 pages',
  pvMsg2: 'Looks great, let’s go over it tonight 👍',
  pvPollQ: 'When should we meet?',
  pvPollA: 'Tonight',
  pvPollB: 'Tomorrow morning',

  loadingOpen: 'Opening file…',
  loadingParse: 'Reading messages…',
  dropHere: 'Drop the file',
  errRead: 'The file could not be read.',
  errTooBig: 'The chat text is too large to open in the browser (256 MB limit).',
  errBadZip: 'The zip file could not be opened. It is damaged or not a zip.',
  errNoChat: 'No WhatsApp chat text (.txt) was found in the zip.',
  errNotChat: 'This file doesn’t look like a WhatsApp chat export.',

  back: 'Open another file',
  messagesCount: '{n} messages',
  meHint: 'Person shown on the right (green)',
  meAria: 'Who am I?',
  meNone: 'Me: not selected',
  meOption: 'Me: {name}',
  search: 'Search the chat (Ctrl+F)',
  searchPlaceholder: 'Search the chat…',
  searchAria: 'Search the chat',
  searchPrev: 'Previous result (Shift+Enter)',
  searchNext: 'Next result (Enter)',
  searchClose: 'Close search (Esc)',
  searchNone: 'No results',
  jumpDate: 'Jump to date',
  info: 'Export details',
  scrollEnd: 'Go to latest message',
  rendering: 'Rendering… {p}%',
  emptyChat: 'This chat has no messages.',
  infoFormat: 'Format',
  infoDateOrder: 'Date order',
  infoMessages: 'Messages',
  infoParticipants: 'Participants',
  infoMatched: 'Matched media',
  infoOmitted: 'Media not included',
  infoRecovered: 'Recovered by timestamp',
  infoUnused: 'Unused files in zip',
  infoRange: 'Date range',
  infoMissing: '{n} files missing from the zip',
  infoPrivacy: 'Everything ran on this device; no data was sent.',
  langTr: 'Turkish',
  langEn: 'English',
  langUnknown: 'Unknown',
  orderDMY: 'Day.Month.Year',
  orderMDY: 'Month/Day/Year',
  orderYMD: 'Year-Month-Day',
  edited: 'Edited',
  deleted: 'This message was deleted',
  selfDeleted: 'You deleted this message',
  omittedTitle: 'WhatsApp didn’t include this file in the export (exported without media, or the media was never downloaded on the phone).',
  omitted: '{kind} not included in the export',
  kindMedia: 'Media',
  kindPhoto: 'Photo',
  kindVideo: 'Video',
  kindGif: 'GIF',
  kindAudio: 'Voice message',
  kindSticker: 'Sticker',
  kindDocument: 'Document',
  kindContact: 'Contact card',
  poll: 'Poll',
  pollTotal: '{n} votes in total',
  pollVotes: '{text}: {n} votes',

  imageZoom: 'Enlarge image: {name}',
  imageUnsupported: 'This image format can’t be shown in the browser.',
  videoUnsupported: 'This video format can’t be played in the browser.',
  opusUnsupported: 'This browser can’t play this audio format (.opus). Download it and open it in another player.',
  audioUnsupported: 'This audio file can’t be played in the browser.',
  contactMore: '{name} and {n} more',
  contactDefault: 'Contact',
  openTab: 'Open in new tab',
  download: 'Download',
  downloadName: 'Download: {name}',
  stickerMissing: '🏷️ Sticker',
  stickerMissingTitle: 'The sticker file is not in the zip.',
  fileMissing: 'This file is not in the zip.',

  viewer: 'Image viewer',
  close: 'Close',
  closeEsc: 'Close (Esc)',
  prev: 'Previous',
  next: 'Next',

  today: 'Today',
  yesterday: 'Yesterday',
};

export const DICTS: Record<Lang, Dict> = { tr, en };

const LANG_KEY = 'wa-viewer-lang';
let current: Lang = detect();
const listeners = new Set<() => void>();

function detect(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'tr' || saved === 'en') return saved;
  } catch {
    /* depolama kapalı olabilir */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  return /^tr\b/i.test(nav) ? 'tr' : 'en';
}

export function getLang(): Lang {
  return current;
}

/** Sayı ve tarih biçimleri için yerel ayar */
export function locale(): string {
  return current === 'tr' ? 'tr-TR' : 'en-US';
}

export function setLang(lang: Lang, persist = true): void {
  if (lang === current) return;
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  if (persist) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* yok say */
    }
  }
  for (const fn of listeners) fn();
}

export function onLangChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Çeviri; {ad} biçimindeki yer tutucuları doldurur. */
export function t(key: Key, vars?: Record<string, string | number>): string {
  let s: string = DICTS[current][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(`{${k}}`, typeof v === 'number' ? v.toLocaleString(locale()) : v);
    }
  }
  return s;
}

/** Hata kodu taşıyan hata: arayüz mesajı seçili dile göre çevirir. */
export class AppError extends Error {
  constructor(readonly code: Key) {
    super(DICTS.tr[code]);
  }
}

if (typeof document !== 'undefined') document.documentElement.lang = current;
