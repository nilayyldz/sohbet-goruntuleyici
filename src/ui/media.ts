import { BlobCache } from '../media/resolve';
import { parseVcf } from '../media/vcf';
import { baseName, extOf } from '../parser/patterns';
import type { AttachmentRef } from '../parser/types';
import type { MediaEntry } from '../zip/loader';
import { t } from '../i18n';
import { formatSize } from './format';
import { icons } from './icons';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

/** iOS belgelerinin başındaki "00000004-" sıra önekini gösterimden kaldırır. */
export function displayName(path: string): string {
  const name = baseName(path);
  return /^\d{8}-(PHOTO|VIDEO|AUDIO|STICKER|GIF)-/.test(name) ? name : name.replace(/^\d{8}-/, '');
}

/**
 * Yeni sekmede açılabilecek türler. blob: URL'leri uygulamanın kökenini (origin) taşır;
 * SVG/HTML/metin gibi betik çalıştırabilecek ya da HTML sanılabilecek türler burada
 * OLMAMALI, yoksa zip'teki kötü niyetli bir dosya uygulama içinde kod çalıştırabilir.
 * Diğer her şey yalnızca indirilebilir.
 */
export const OPENABLE = new Set(['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mp3', 'm4a']);

/**
 * Medya öğelerini ekrana yaklaşınca zip'ten çıkarır, çok uzaklaşınca (yalnızca görüntü)
 * belleği geri verir.
 */
export class MediaLoader {
  readonly cache = new BlobCache();
  private loaders = new WeakMap<Element, { load: () => void; unload?: () => void; loaded: boolean }>();
  private near: IntersectionObserver;
  private far: IntersectionObserver;

  constructor(root: HTMLElement) {
    this.near = new IntersectionObserver((items) => {
      for (const it of items) {
        const l = this.loaders.get(it.target);
        if (it.isIntersecting && l && !l.loaded) {
          l.loaded = true;
          l.load();
        }
      }
    }, { root, rootMargin: '1200px 0px' });
    this.far = new IntersectionObserver((items) => {
      for (const it of items) {
        const l = this.loaders.get(it.target);
        if (!it.isIntersecting && l?.loaded && l.unload) {
          l.loaded = false;
          l.unload();
        }
      }
    }, { root, rootMargin: '6000px 0px' });
  }

  watch(target: Element, load: () => void, unload?: () => void): void {
    this.loaders.set(target, { load, unload, loaded: false });
    this.near.observe(target);
    if (unload) this.far.observe(target);
  }

  destroy(): void {
    this.near.disconnect();
    this.far.disconnect();
    this.cache.clear();
  }

  // ---- Bileşenler -------------------------------------------------------

  render(att: AttachmentRef, entry: MediaEntry | undefined, onImageClick: () => void): HTMLElement {
    if (!entry) return att.kind === 'sticker' ? missingSticker() : missingCard(att.name);
    switch (att.kind) {
      case 'image':
      case 'sticker':
        return this.image(entry, att.kind === 'sticker', onImageClick);
      case 'video':
        return this.video(entry);
      case 'audio':
        return this.audio(entry);
      case 'contact':
        return this.contact(entry);
      default:
        return this.document(entry);
    }
  }

  private image(entry: MediaEntry, sticker: boolean, onClick: () => void): HTMLElement {
    const box = el('button', sticker ? 'media sticker' : 'media img-box');
    box.type = 'button';
    box.setAttribute('aria-label', t('imageZoom', { name: entry.name }));
    const img = el('img');
    img.alt = entry.name;
    img.decoding = 'async';
    box.appendChild(img);
    box.addEventListener('click', onClick);
    img.addEventListener('load', () => {
      if (img.naturalWidth && !sticker) {
        box.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
        box.classList.add('sized');
      }
      box.classList.add('ready');
    });
    img.addEventListener('error', () => {
      if (!img.getAttribute('src')) return;
      // Ör. HEIC çoğu tarayıcıda gösterilemez → belge kartına dön
      box.replaceWith(this.document(entry, t('imageUnsupported')));
    });
    this.watch(
      box,
      () => void this.cache.url(entry).then((u) => (img.src = u)),
      () => {
        img.removeAttribute('src');
        this.cache.release(entry);
      },
    );
    return box;
  }

  private video(entry: MediaEntry): HTMLElement {
    const box = el('div', 'media video-box');
    const v = el('video');
    v.controls = true;
    v.preload = 'metadata';
    v.playsInline = true;
    box.appendChild(v);
    v.addEventListener('loadedmetadata', () => {
      if (v.videoWidth) box.style.aspectRatio = `${v.videoWidth} / ${v.videoHeight}`;
    });
    v.addEventListener('error', () => {
      if (!v.getAttribute('src')) return;
      box.replaceWith(this.document(entry, t('videoUnsupported')));
    });
    this.watch(
      box,
      () => void this.cache.url(entry).then((u) => (v.src = u)),
      () => {
        if (!v.paused) return;
        v.removeAttribute('src');
        v.load();
        this.cache.release(entry);
      },
    );
    return box;
  }

  private audio(entry: MediaEntry): HTMLElement {
    const box = el('div', 'media audio-box');
    const icon = el('span', 'audio-icon');
    icon.innerHTML = icons.mic;
    const a = el('audio');
    a.controls = true;
    a.preload = 'metadata';
    box.append(icon, a);
    const ext = extOf(entry.name);
    const probe = ext === 'opus' || ext === 'ogg' ? 'audio/ogg; codecs=opus' : ext === 'amr' ? 'audio/amr' : '';
    if (probe && !a.canPlayType(probe)) {
      return this.document(entry, t('opusUnsupported'));
    }
    a.addEventListener('error', () => {
      if (!a.getAttribute('src')) return;
      box.replaceWith(this.document(entry, t('audioUnsupported')));
    });
    this.watch(box, () => void this.cache.url(entry).then((u) => (a.src = u)));
    return box;
  }

  private contact(entry: MediaEntry): HTMLElement {
    const card = el('div', 'media contact-card');
    const avatar = el('span', 'contact-avatar');
    avatar.innerHTML = icons.person;
    const info = el('div', 'contact-info');
    const name = el('div', 'contact-name', displayName(entry.name).replace(/\.vcf$/i, ''));
    const phones = el('div', 'contact-phones');
    info.append(name, phones);
    const dl = this.downloadButton(entry);
    card.append(avatar, info, dl);
    this.watch(card, () => {
      void this.cache.text(entry).then((vcfText) => {
        const c = parseVcf(vcfText);
        if (c.length) {
          name.textContent = c.length > 1 ? t('contactMore', { name: c[0].name, n: c.length - 1 }) : c[0].name;
          phones.textContent = c[0].phones.join(' · ');
        }
      });
    });
    return card;
  }

  document(entry: MediaEntry, note?: string): HTMLElement {
    const ext = extOf(entry.name);
    const card = el('div', 'media doc-card');
    const icon = el('span', `doc-icon ext-${ext || 'file'}`, (ext || 'dosya').toUpperCase().slice(0, 4));
    const info = el('div', 'doc-info');
    info.append(el('div', 'doc-name', displayName(entry.name)));
    const meta = [ext.toUpperCase(), formatSize(entry.size)].filter(Boolean).join(' · ');
    if (meta) info.append(el('div', 'doc-meta', meta));
    if (note) info.append(el('div', 'doc-note', note));
    const actions = el('div', 'doc-actions');
    if (OPENABLE.has(ext)) {
      const open = el('button', 'icon-btn small');
      open.type = 'button';
      open.title = t('openTab');
      open.setAttribute('aria-label', t('openTab'));
      open.innerHTML = icons.open;
      open.addEventListener('click', async () => {
        // Açılır pencere engelleyicisine takılmamak için sekmeyi hemen aç
        const w = window.open('', '_blank');
        const u = await this.cache.url(entry);
        if (w) w.location.href = u;
      });
      actions.append(open);
    }
    actions.append(this.downloadButton(entry));
    card.append(icon, info, actions);
    return card;
  }

  private downloadButton(entry: MediaEntry): HTMLElement {
    const b = el('button', 'icon-btn small');
    b.type = 'button';
    b.title = t('download');
    b.setAttribute('aria-label', t('downloadName', { name: entry.name }));
    b.innerHTML = icons.download;
    b.addEventListener('click', async () => {
      const a = el('a');
      a.href = await this.cache.url(entry);
      a.download = displayName(entry.name);
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
    return b;
  }
}

/** Zip'te olmayan çıkartma: dosya adı yerine sade bir "Çıkartma" notu */
function missingSticker(): HTMLElement {
  const note = el('span', 'muted sticker-missing');
  note.textContent = t('stickerMissing');
  note.title = t('stickerMissingTitle');
  return note;
}

function missingCard(name: string): HTMLElement {
  const card = el('div', 'media doc-card missing');
  const icon = el('span', 'doc-icon');
  icon.innerHTML = icons.clip;
  const info = el('div', 'doc-info');
  info.append(el('div', 'doc-name', displayName(name)), el('div', 'doc-note', t('fileMissing')));
  card.append(icon, info);
  return card;
}
