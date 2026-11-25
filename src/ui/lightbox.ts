import type { BlobCache } from '../media/resolve';
import type { Message } from '../parser/types';
import type { MediaEntry } from '../zip/loader';
import { formatDay, formatTime } from './format';
import { t } from '../i18n';
import { icons } from './icons';

export interface GalleryItem {
  msg: Message;
  entry: MediaEntry;
}

/** Tam ekran görsel gösterici: ←/→ ile gezinme, Esc ile kapatma */
export class Lightbox {
  private root: HTMLDivElement;
  private img: HTMLImageElement;
  private caption: HTMLDivElement;
  private counter: HTMLSpanElement;
  private index = 0;
  private items: GalleryItem[] = [];
  private lastFocus: Element | null = null;

  constructor(private cache: BlobCache) {
    this.root = document.createElement('div');
    this.root.className = 'lightbox';
    this.root.hidden = true;
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', t('viewer'));
    this.root.innerHTML = `
      <div class="lb-bar">
        <div class="lb-caption"></div>
        <span class="lb-counter"></span>
        <button class="icon-btn" data-act="download" type="button" aria-label="${t('download')}" title="${t('download')}">${icons.download}</button>
        <button class="icon-btn" data-act="close" type="button" aria-label="${t('close')}" title="${t('closeEsc')}">${icons.close}</button>
      </div>
      <button class="lb-nav prev icon-btn" data-act="prev" type="button" aria-label="${t('prev')}">${icons.left}</button>
      <img class="lb-img" alt="" />
      <button class="lb-nav next icon-btn" data-act="next" type="button" aria-label="${t('next')}">${icons.right}</button>`;
    this.img = this.root.querySelector('.lb-img')!;
    this.caption = this.root.querySelector('.lb-caption')!;
    this.counter = this.root.querySelector('.lb-counter')!;
    this.root.addEventListener('click', (e) => {
      const act = (e.target as Element).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'close' || e.target === this.root) this.close();
      else if (act === 'prev') this.show(this.index - 1);
      else if (act === 'next') this.show(this.index + 1);
      else if (act === 'download') void this.download();
    });
    this.onKey = this.onKey.bind(this);
    document.body.appendChild(this.root);
  }

  setItems(items: GalleryItem[]): void {
    this.items = items;
  }

  open(msgId: number): void {
    const i = this.items.findIndex((it) => it.msg.id === msgId);
    if (i < 0) return;
    this.lastFocus = document.activeElement;
    this.root.hidden = false;
    document.addEventListener('keydown', this.onKey);
    this.show(i);
    this.root.querySelector<HTMLElement>('[data-act="close"]')?.focus();
  }

  close(): void {
    this.root.hidden = true;
    this.img.removeAttribute('src');
    document.removeEventListener('keydown', this.onKey);
    (this.lastFocus as HTMLElement | null)?.focus?.();
  }

  destroy(): void {
    this.close();
    this.root.remove();
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.close();
    else if (e.key === 'ArrowLeft') this.show(this.index - 1);
    else if (e.key === 'ArrowRight') this.show(this.index + 1);
  }

  private async show(i: number): Promise<void> {
    if (i < 0 || i >= this.items.length) return;
    this.index = i;
    const { msg, entry } = this.items[i];
    this.caption.textContent = `${msg.author ?? ''} · ${formatDay(msg.date)} ${formatTime(msg.date)}${msg.text ? ` — ${msg.text}` : ''}`;
    this.counter.textContent = `${i + 1} / ${this.items.length}`;
    this.root.classList.toggle('first', i === 0);
    this.root.classList.toggle('last', i === this.items.length - 1);
    const url = await this.cache.url(entry);
    if (this.index === i) this.img.src = url;
  }

  private async download(): Promise<void> {
    const { entry } = this.items[this.index];
    const a = document.createElement('a');
    a.href = await this.cache.url(entry);
    a.download = entry.name;
    a.click();
  }
}
