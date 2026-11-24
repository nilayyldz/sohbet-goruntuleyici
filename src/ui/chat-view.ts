import type { ResolveStats } from '../media/resolve';
import type { Message, ParseResult, Poll } from '../parser/types';
import type { MediaEntry } from '../zip/loader';
import { dayKey, formatDay, formatTime, highlight, isEmojiOnly, renderRich, setMentionNames, toInputDate } from './format';
import { icons } from './icons';
import { Lightbox, type GalleryItem } from './lightbox';
import { MediaLoader } from './media';

export interface ChatData {
  result: ParseResult;
  byId: Map<number, MediaEntry>;
  stats: ResolveStats;
  title: string;
  me: string | null;
}

const AUTHOR_COLORS = 12;
const ENCRYPTION = /(end-to-end encrypted|uçtan uca şifreli)/i;
const PLATFORM_LABEL = { android: 'Android', ios: 'iOS' } as const;
const LANG_LABEL = { tr: 'Türkçe', en: 'İngilizce', unknown: 'Bilinmiyor' } as const;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function iconButton(icon: string, label: string, cls = 'icon-btn'): HTMLButtonElement {
  const b = h('button', cls);
  b.type = 'button';
  b.innerHTML = icon;
  b.title = label;
  b.setAttribute('aria-label', label);
  return b;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => /\p{L}/u.test(p));
  return (parts.slice(0, 2).map((p) => [...p][0]).join('') || '#').toLocaleUpperCase('tr-TR');
}

export class ChatView {
  readonly root: HTMLElement;
  private scroller: HTMLElement;
  private inner: HTMLElement;
  private subtitle!: HTMLElement;
  private progress: HTMLElement;
  private media: MediaLoader;
  private lightbox: Lightbox;
  private rows: (HTMLElement | undefined)[] = [];
  private textEls = new Map<number, HTMLElement>();
  private rendered = 0;
  private waiters: { id: number; resolve: () => void }[] = [];
  private me: string | null;
  private isGroup: boolean;
  private authorIndex = new Map<string, number>();
  private destroyed = false;

  // arama
  private searchBar!: HTMLElement;
  private searchInput!: HTMLInputElement;
  private searchCount!: HTMLElement;
  private hits: number[] = [];
  private hitIndex = -1;
  private highlighted: number | null = null;
  private query = '';

  constructor(private data: ChatData, private onClose: () => void, private onMeChange: (me: string | null) => void) {
    const { result } = data;
    this.me = data.me;
    this.isGroup = result.authors.length > 2;
    result.authors.forEach((a, i) => this.authorIndex.set(a, i));
    setMentionNames(result.authors);

    this.root = h('div', 'chat');
    this.root.append(this.buildHeader(), this.buildSearchBar());
    this.scroller = h('main', 'chat-scroll');
    this.scroller.tabIndex = -1;
    this.inner = h('div', 'chat-inner');
    this.scroller.append(this.inner);
    this.progress = h('div', 'render-progress');
    this.subtitle.after(this.progress);
    const fab = iconButton(icons.down, 'En son mesaja git', 'fab');
    fab.addEventListener('click', () => void this.scrollToEnd());
    this.scroller.addEventListener('scroll', () => {
      const gap = this.scroller.scrollHeight - this.scroller.scrollTop - this.scroller.clientHeight;
      fab.classList.toggle('show', gap > 800 || this.rendered < result.messages.length);
    }, { passive: true });
    this.root.append(this.scroller, fab);

    this.media = new MediaLoader(this.scroller);
    this.lightbox = new Lightbox(this.media.cache);
    const gallery: GalleryItem[] = [];
    for (const m of result.messages) {
      const entry = data.byId.get(m.id);
      if (entry && m.attachment?.kind === 'image') gallery.push({ msg: m, entry });
    }
    this.lightbox.setItems(gallery);

    if (result.messages.length === 0) {
      this.inner.append(h('div', 'sys', 'Bu sohbette mesaj yok.'));
    }
    setTimeout(() => this.renderChunk(), 0);
  }

  destroy(): void {
    this.destroyed = true;
    this.media.destroy();
    this.lightbox.destroy();
    this.root.remove();
  }

  // ---- Başlık ve araç çubuğu ---------------------------------------------

  private buildHeader(): HTMLElement {
    const { result, title, stats } = this.data;
    const header = h('header', 'chat-header');
    const back = iconButton(icons.left, 'Başka dosya aç', 'icon-btn back');
    back.addEventListener('click', () => this.onClose());
    const avatar = h('div', 'avatar', initials(title));
    const titles = h('div', 'titles');
    titles.append(h('div', 'title', title));
    this.subtitle = h('div', 'subtitle');
    this.subtitle.textContent = this.isGroup
      ? result.authors.join(', ')
      : `${result.messages.length.toLocaleString('tr-TR')} mesaj`;
    this.subtitle.title = this.subtitle.textContent;
    titles.append(this.subtitle);

    const tools = h('div', 'tools');

    // "Ben kimim?" seçimi
    const meLabel = h('label', 'me-select');
    meLabel.title = 'Sağ tarafta (yeşil) gösterilecek kişi';
    const meIcon = h('span', 'me-icon');
    meIcon.innerHTML = icons.person;
    const select = h('select');
    select.setAttribute('aria-label', 'Ben kimim?');
    const option = (label: string, value: string) => {
      const o = h('option', '', label);
      o.value = value;
      return o;
    };
    select.append(option('Ben: seçilmedi', ''));
    for (const a of result.authors) select.append(option(`Ben: ${a}`, a));
    select.value = this.me ?? '';
    const markChoice = () => meLabel.classList.toggle('needs-choice', !select.value && result.authors.length > 1);
    markChoice();
    select.addEventListener('change', () => {
      this.setMe(select.value || null);
      markChoice();
    });
    meLabel.append(meIcon, select);

    const searchBtn = iconButton(icons.search, 'Sohbette ara (Ctrl+F)');
    searchBtn.addEventListener('click', () => this.toggleSearch(true));

    const dateWrap = h('label', 'icon-btn date-btn');
    dateWrap.title = 'Tarihe git';
    dateWrap.innerHTML = icons.calendar;
    const dateInput = h('input');
    dateInput.type = 'date';
    dateInput.setAttribute('aria-label', 'Tarihe git');
    const msgs = result.messages;
    if (msgs.length) {
      dateInput.min = toInputDate(msgs[0].date);
      dateInput.max = toInputDate(msgs[msgs.length - 1].date);
    }
    dateInput.addEventListener('change', () => {
      if (!dateInput.value) return;
      const [y, m, d] = dateInput.value.split('-').map(Number);
      const target = new Date(y, m - 1, d).getTime();
      const found = msgs.find((x) => x.date.getTime() >= target) ?? msgs[msgs.length - 1];
      if (found) void this.scrollToMessage(found.id, false);
    });
    dateWrap.append(dateInput);

    const infoBtn = iconButton(icons.file, 'Dışa aktarım bilgisi');
    const info = h('div', 'info-pop');
    info.hidden = true;
    const rows: [string, string][] = [
      ['Biçim', `${PLATFORM_LABEL[result.platform]} · ${LANG_LABEL[result.lang]}`],
      ['Tarih sırası', { DMY: 'Gün.Ay.Yıl', MDY: 'Ay/Gün/Yıl', YMD: 'Yıl-Ay-Gün' }[result.dateOrder]],
      ['Mesaj', result.messages.length.toLocaleString('tr-TR')],
      ['Katılımcı', String(result.authors.length)],
      ['Eşleşen medya', `${stats.found} / ${stats.referenced}`],
      ['Dahil edilmeyen medya', result.messages.filter((x) => x.omitted).length.toLocaleString('tr-TR')],
    ];
    if (stats.recovered) rows.push(['Zaman damgasıyla kurtarılan', String(stats.recovered)]);
    if (stats.unused !== undefined) rows.push(["Zip'te kullanılmayan dosya", String(stats.unused)]);
    if (msgs.length) rows.push(['Tarih aralığı', `${formatDay(msgs[0].date)} – ${formatDay(msgs[msgs.length - 1].date)}`]);
    const dl = h('dl');
    for (const [k, v] of rows) dl.append(h('dt', '', k), h('dd', '', v));
    info.append(dl);
    if (stats.missing.length) {
      const det = h('details');
      det.append(h('summary', '', `Zip'te bulunamayan ${stats.missing.length} dosya`));
      const ul = h('ul');
      for (const n of stats.missing.slice(0, 200)) ul.append(h('li', '', n));
      det.append(ul);
      info.append(det);
    }
    info.append(h('p', 'privacy', 'Tüm işlemler bu cihazda yapıldı; hiçbir veri gönderilmedi.'));
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      info.hidden = !info.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!info.hidden && !info.contains(e.target as Node)) info.hidden = true;
    });

    const themeBtn = iconButton(icons.theme, 'Açık/koyu tema');
    themeBtn.addEventListener('click', () => toggleTheme());

    tools.append(meLabel, searchBtn, dateWrap, infoBtn, themeBtn);
    header.append(back, avatar, titles, tools, info);
    return header;
  }

  private buildSearchBar(): HTMLElement {
    const bar = h('div', 'search-bar');
    bar.hidden = true;
    const input = h('input');
    input.type = 'search';
    input.placeholder = 'Sohbette ara…';
    input.setAttribute('aria-label', 'Sohbette ara');
    const count = h('span', 'search-count');
    count.setAttribute('aria-live', 'polite');
    const prev = iconButton(icons.up, 'Önceki sonuç (Shift+Enter)');
    const next = iconButton(icons.down, 'Sonraki sonuç (Enter)');
    const close = iconButton(icons.close, 'Aramayı kapat (Esc)');
    let timer = 0;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => this.runSearch(input.value), 200);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.query !== input.value.trim()) this.runSearch(input.value);
        else this.stepSearch(e.shiftKey ? -1 : 1);
      } else if (e.key === 'Escape') this.toggleSearch(false);
    });
    prev.addEventListener('click', () => this.stepSearch(-1));
    next.addEventListener('click', () => this.stepSearch(1));
    close.addEventListener('click', () => this.toggleSearch(false));
    bar.append(input, count, prev, next, close);
    this.searchBar = bar;
    this.searchInput = input;
    this.searchCount = count;
    return bar;
  }

  toggleSearch(show: boolean): void {
    this.searchBar.hidden = !show;
    if (show) {
      this.searchInput.focus();
      this.searchInput.select();
    } else {
      this.searchInput.value = '';
      this.runSearch('');
    }
  }

  private runSearch(raw: string): void {
    const q = raw.trim().toLocaleLowerCase('tr-TR');
    this.query = raw.trim();
    this.clearHighlight();
    if (!q) {
      this.hits = [];
      this.hitIndex = -1;
      this.searchCount.textContent = '';
      return;
    }
    this.hits = this.data.result.messages
      .filter((m) => m.text.toLocaleLowerCase('tr-TR').includes(q) || (m.attachment?.name.toLocaleLowerCase('tr-TR').includes(q) ?? false))
      .map((m) => m.id);
    this.hitIndex = this.hits.length ? 0 : -1;
    this.showHit();
  }

  private stepSearch(dir: number): void {
    if (!this.hits.length) return;
    this.hitIndex = (this.hitIndex + dir + this.hits.length) % this.hits.length;
    this.showHit();
  }

  private showHit(): void {
    this.searchCount.textContent = this.hits.length
      ? `${(this.hitIndex + 1).toLocaleString('tr-TR')} / ${this.hits.length.toLocaleString('tr-TR')}`
      : 'Sonuç yok';
    if (this.hitIndex < 0) return;
    const id = this.hits[this.hitIndex];
    void this.scrollToMessage(id, true).then(() => {
      this.clearHighlight();
      const t = this.textEls.get(id);
      if (t) highlight(t, this.query);
      this.highlighted = id;
    });
  }

  private clearHighlight(): void {
    if (this.highlighted === null) return;
    const t = this.textEls.get(this.highlighted);
    const msg = this.data.result.messages[this.highlighted];
    if (t && msg) {
      t.replaceChildren();
      renderRich(msg.text, t);
    }
    this.highlighted = null;
  }

  // ---- "Ben" ------------------------------------------------------------

  private setMe(me: string | null): void {
    this.me = me;
    for (const m of this.data.result.messages) {
      const row = this.rows[m.id];
      if (!row || m.author === null) continue;
      const out = m.author === me;
      row.classList.toggle('out', out);
      row.classList.toggle('in', !out);
    }
    this.onMeChange(me);
  }

  // ---- Kaydırma ---------------------------------------------------------

  private whenRendered(id: number): Promise<void> {
    if (id < this.rendered) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push({ id, resolve }));
  }

  async scrollToMessage(id: number, flash: boolean): Promise<void> {
    await this.whenRendered(id);
    const row = this.rows[id];
    if (!row) return;
    // content-visibility tahmini boyutlar kullandığından iki aşamada hizala
    row.scrollIntoView({ block: 'center' });
    await nextFrame();
    row.scrollIntoView({ block: 'center' });
    if (flash) {
      row.classList.remove('flash');
      void row.offsetWidth;
      row.classList.add('flash');
    }
  }

  async scrollToEnd(): Promise<void> {
    const n = this.data.result.messages.length;
    if (!n) return;
    await this.whenRendered(n - 1);
    this.scroller.scrollTop = this.scroller.scrollHeight;
    await nextFrame();
    this.scroller.scrollTop = this.scroller.scrollHeight;
  }

  // ---- Kademeli çizim ---------------------------------------------------

  private currentDay: HTMLElement | null = null;
  private currentDayKey = '';

  private renderChunk(): void {
    if (this.destroyed) return;
    const msgs = this.data.result.messages;
    const start = performance.now();
    const frag = document.createDocumentFragment();
    while (this.rendered < msgs.length && performance.now() - start < 14) {
      const m = msgs[this.rendered];
      const prev = this.rendered > 0 ? msgs[this.rendered - 1] : null;
      const key = dayKey(m.date);
      if (key !== this.currentDayKey) {
        this.currentDayKey = key;
        this.currentDay = h('section', 'day');
        const chipWrap = h('div', 'day-chip-wrap');
        chipWrap.append(h('span', 'day-chip', formatDay(m.date)));
        this.currentDay.append(chipWrap);
        frag.append(this.currentDay);
      }
      const newRun = !prev || prev.author !== m.author || dayKey(prev.date) !== key || prev.author === null;
      const row = this.buildRow(m, newRun);
      this.rows[m.id] = row;
      this.currentDay!.append(row);
      this.rendered++;
    }
    this.inner.append(frag);

    const done = this.rendered >= msgs.length;
    this.progress.textContent = done ? '' : `Görüntüleniyor… %${Math.floor((this.rendered / msgs.length) * 100)}`;
    this.waiters = this.waiters.filter((w) => {
      if (w.id < this.rendered) {
        w.resolve();
        return false;
      }
      return true;
    });
    if (!done) setTimeout(() => this.renderChunk(), 0);
  }

  private buildRow(m: Message, first: boolean): HTMLElement {
    if (m.author === null) {
      const row = h('div', ENCRYPTION.test(m.text) ? 'sys enc' : 'sys');
      row.dataset.id = String(m.id);
      const chip = h('span', 'sys-chip');
      if (ENCRYPTION.test(m.text)) {
        const lock = h('span', 'lock');
        lock.innerHTML = icons.lock;
        chip.append(lock);
      }
      chip.append(document.createTextNode(m.text));
      row.append(chip);
      return row;
    }

    const out = m.author === this.me;
    const row = h('div', `row ${out ? 'out' : 'in'}${first ? ' first' : ''}`);
    row.dataset.id = String(m.id);
    const bubble = h('div', 'bubble');
    row.append(bubble);

    if (this.isGroup && first) {
      const name = h('div', `author c${(this.authorIndex.get(m.author) ?? 0) % AUTHOR_COLORS}`, m.author);
      bubble.append(name);
    }

    const entry = this.data.byId.get(m.id);
    let mediaOnly = false;
    if (m.attachment) {
      const kind = m.attachment.kind;
      bubble.append(this.media.render(m.attachment, entry, () => this.lightbox.open(m.id)));
      if (entry && (kind === 'image' || kind === 'video') && !m.text && !m.omitted && !m.deleted) {
        mediaOnly = true;
        bubble.classList.add('media-only');
      }
      if (kind === 'sticker' && entry && !m.text) row.classList.add('sticker-row');
      bubble.classList.add('has-media', `k-${kind}`);
    }

    const body = h('div', 'body');
    if (m.omitted) {
      const note = h('span', 'muted');
      note.innerHTML = icons.ban;
      note.append(document.createTextNode(omittedText(m.omittedLabel)));
      note.title = 'WhatsApp bu dosyayı dışa aktarıma eklemedi (medyasız dışa aktarım ya da telefonda indirilmemiş medya).';
      body.append(note);
    } else if (m.deleted) {
      const note = h('span', 'muted');
      note.innerHTML = icons.ban;
      note.append(document.createTextNode(m.deletedLabel ?? (m.selfDeleted ? 'Bu mesajı sildiniz' : 'Bu mesaj silindi')));
      body.append(note);
    }
    if (m.poll) {
      bubble.classList.add('has-poll');
      body.append(renderPoll(m.poll));
    } else if (m.text) {
      const text = h('span', 'text');
      if (isEmojiOnly(m.text) && !m.attachment) bubble.classList.add('emoji-only');
      renderRich(m.text, text);
      this.textEls.set(m.id, text);
      body.append(text);
    }
    const meta = h('span', 'meta');
    if (m.edited) meta.append(h('span', 'edited', 'Düzenlendi'));
    const time = h('time', '', formatTime(m.date));
    time.dateTime = m.date.toISOString();
    time.title = `${formatDay(m.date)} ${m.date.toLocaleTimeString('tr-TR')}`;
    meta.append(time);

    if (mediaOnly) {
      meta.classList.add('overlay');
      bubble.append(meta);
    } else {
      body.append(h('span', m.edited ? 'spacer wide' : 'spacer'));
      bubble.append(body, meta);
    }
    return row;
  }
}

// ---- Tema -----------------------------------------------------------------

const THEME_KEY = 'wa-viewer-theme';

export function applySavedTheme(): void {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch {
    /* depolama kapalı olabilir */
  }
}

function toggleTheme(): void {
  const root = document.documentElement;
  const current = root.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* yok say */
  }
}

/** Gizli sekmede de ilerleyen kısa bekleme (requestAnimationFrame arka planda durur). */
function nextFrame(): Promise<void> {
  return new Promise((r) => setTimeout(r, 32));
}

const OMITTED_NAMES: [RegExp, string][] = [
  [/^(görüntü|fotoğraf|resim|image|photo)$/, 'Fotoğraf'],
  [/^video$/, 'Video'],
  [/^gif$/, 'GIF'],
  [/^(ses|audio|sesli mesaj)$/, 'Ses kaydı'],
  [/^(çıkartma|sticker)$/, 'Çıkartma'],
  [/^(belge|document)$/, 'Belge'],
  [/^(kişi kartı|contact card)$/, 'Kişi kartı'],
];

/** "görüntü" → "Fotoğraf dışa aktarıma dahil edilmedi" */
function omittedText(label: string | undefined): string {
  const l = (label ?? '').toLocaleLowerCase('tr-TR');
  const name = OMITTED_NAMES.find(([re]) => re.test(l))?.[1];
  if (name) return `${name} dışa aktarıma dahil edilmedi`;
  if (l) return `${l.charAt(0).toLocaleUpperCase('tr-TR')}${l.slice(1)} dışa aktarıma dahil edilmedi`;
  return 'Medya dışa aktarıma dahil edilmedi';
}

/** WhatsApp tarzı anket kartı: soru, seçenekler, oy çubukları ve toplam oy. */
function renderPoll(poll: Poll): HTMLElement {
  const card = h('div', 'poll');
  const question = h('div', 'poll-question');
  renderRich(poll.question, question);
  card.append(question);
  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  const max = Math.max(0, ...poll.options.map((o) => o.votes));
  card.append(h('div', 'poll-hint', 'Anket'));
  const list = h('ul', 'poll-options');
  for (const o of poll.options) {
    const li = h('li', o.votes > 0 && o.votes === max ? 'poll-option leading' : 'poll-option');
    const row = h('div', 'poll-row');
    const circle = h('span', 'poll-circle');
    circle.setAttribute('aria-hidden', 'true');
    const label = h('span', 'poll-label');
    renderRich(o.text, label);
    const count = h('span', 'poll-count', o.votes.toLocaleString('tr-TR'));
    row.append(circle, label, count);
    const bar = h('div', 'poll-bar');
    const fill = h('div', 'poll-fill');
    fill.style.width = total ? `${(o.votes / total) * 100}%` : '0%';
    bar.append(fill);
    li.setAttribute('aria-label', `${o.text}: ${o.votes} oy`);
    li.append(row, bar);
    list.append(li);
  }
  card.append(list);
  card.append(h('div', 'poll-total', `Toplam ${total.toLocaleString('tr-TR')} oy`));
  return card;
}
