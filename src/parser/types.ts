export type Platform = 'android' | 'ios';
export type Lang = 'tr' | 'en' | 'unknown';
export type DateOrder = 'DMY' | 'MDY' | 'YMD';

export type AttachmentKind = 'image' | 'sticker' | 'video' | 'audio' | 'contact' | 'document';

export interface AttachmentRef {
  /** txt içinde geçen dosya adı */
  name: string;
  kind: AttachmentKind;
  /** Etiket tanınmadı; zip'te dosya yoksa düz metin sayılır */
  uncertain?: boolean;
}

export interface Message {
  id: number;
  date: Date;
  /** null = sistem mesajı (gruba katılma, şifreleme bildirimi vb.) */
  author: string | null;
  text: string;
  attachment?: AttachmentRef;
  /** Dışa aktarımda "medya dahil edilmedi" seçildiyse */
  omitted?: boolean;
  /** Medya hariç bırakıldıysa türü (örn. "image", "görüntü") */
  omittedLabel?: string;
  edited?: boolean;
  deleted?: boolean;
  /** "Bu mesajı sildiniz" — yazanın "ben" olduğunu gösterir */
  selfDeleted?: boolean;
  /** Silme bildiriminin özgün metni (ör. "Bu mesaj ~ Ad adlı yönetici tarafından silindi") */
  deletedLabel?: string;
  /** Belirsiz ek eşleşmezse geri dönülecek ham metin */
  raw?: string;
}

export interface ParseResult {
  platform: Platform;
  lang: Lang;
  dateOrder: DateOrder;
  messages: Message[];
  authors: string[];
}
