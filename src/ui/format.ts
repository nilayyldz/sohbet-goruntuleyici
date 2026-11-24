/**
 * WhatsApp metin biçimlendirmesini güvenli şekilde DOM düğümlerine çevirir
 * (innerHTML kullanılmaz). *kalın* _italik_ ~üstü çizili~ ```kod``` ve bağlantılar.
 */
const BASE_TOKEN = String.raw`${'```'}([\s\S]+?)${'```'}|\*([^*\n]+?)\*|_([^_\n]+?)_|~([^~\n]+?)~|(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)`;
/** @etiket: telefon numarası veya tek kelimelik ad (bilinen katılımcı adları ayrıca eklenir) */
const MENTION_FALLBACK = String.raw`\+?\d[\d ]{5,}\d|[\p{L}\p{N}_.]*[\p{L}\p{N}_]`;
const WORD = /[\p{L}\p{N}]/u;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildToken(names: string[]): RegExp {
  const alts = names.map(escapeRe);
  alts.push(MENTION_FALLBACK);
  return new RegExp(`${BASE_TOKEN}|@(${alts.join('|')})`, 'gu');
}

let TOKEN = buildToken([]);

/**
 * Sohbetteki katılımcı adlarını @etiket tanıma için kaydeder. Boşluklu adlar
 * ("@Ozan Çağrı ŞEN") yalnızca bu listeyle bütün olarak yakalanabilir.
 */
export function setMentionNames(authors: string[]): void {
  const names = new Set<string>();
  for (const a of authors) {
    const n = a.replace(/^~\s*/, '').trim();
    if (n.length > 1) names.add(n);
  }
  // Uzun adlar önce denensin ("Ozan Çağrı" yerine "Ozan Çağrı ŞEN")
  TOKEN = buildToken([...names].sort((x, y) => y.length - x.length));
}

function boundaryOk(text: string, start: number, end: number, inner: string): boolean {
  const before = start > 0 ? text[start - 1] : '';
  const after = end < text.length ? text[end] : '';
  if (before && WORD.test(before)) return false;
  if (after && WORD.test(after)) return false;
  return inner.trim() === inner && inner.length > 0;
}

export function renderRich(text: string, target: Node): void {
  TOKEN.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (s: string) => {
    if (s) target.appendChild(document.createTextNode(s));
  };
  while ((m = TOKEN.exec(text))) {
    const start = m.index;
    let end = start + m[0].length;
    if (m[1] !== undefined) {
      push(text.slice(last, start));
      const code = document.createElement('code');
      code.textContent = m[1].replace(/^\n|\n$/g, '');
      target.appendChild(code);
    } else if (m[5] !== undefined) {
      let url = m[5];
      const trail = /[.,!?;:)\]}'"]+$/.exec(url);
      if (trail) {
        url = url.slice(0, -trail[0].length);
        end -= trail[0].length;
        TOKEN.lastIndex = end;
      }
      push(text.slice(last, start));
      const a = document.createElement('a');
      a.href = url.startsWith('www.') ? `https://${url}` : url;
      a.textContent = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer nofollow';
      target.appendChild(a);
    } else if (m[6] !== undefined) {
      // @etiket: e-posta adreslerinin ortasındaki @ etiket sayılmaz
      const before = start > 0 ? text[start - 1] : '';
      if (before && (WORD.test(before) || before === '@')) {
        TOKEN.lastIndex = start + 1;
        continue;
      }
      push(text.slice(last, start));
      const span = document.createElement('span');
      span.className = 'mention';
      span.textContent = m[0];
      target.appendChild(span);
    } else {
      const inner = m[2] ?? m[3] ?? m[4];
      if (!boundaryOk(text, start, end, inner)) {
        // Biçim işareti değil (ör. dosya_adı); bir karakter ilerle.
        TOKEN.lastIndex = start + 1;
        continue;
      }
      push(text.slice(last, start));
      const el = document.createElement(m[2] !== undefined ? 'strong' : m[3] !== undefined ? 'em' : 's');
      renderRich(inner, el);
      TOKEN.lastIndex = end; // özyineleme lastIndex'i bozar
      target.appendChild(el);
    }
    last = end;
  }
  push(text.slice(last));
}

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s){1,24}$/u;
export function isEmojiOnly(text: string): boolean {
  if (!text || /[0-9#*]/.test(text)) return false;
  const count = [...text.matchAll(/\p{Extended_Pictographic}/gu)].length;
  return count > 0 && count <= 3 && EMOJI_ONLY.test(text);
}

/** Bir öğedeki metin düğümlerinde sorguyu <mark> ile vurgular. */
export function highlight(root: HTMLElement, query: string): HTMLElement | null {
  if (!query) return null;
  const q = query.toLocaleLowerCase('tr-TR');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  let first: HTMLElement | null = null;
  for (const node of nodes) {
    const val = node.data;
    const lower = val.toLocaleLowerCase('tr-TR');
    if (lower.length !== val.length) continue;
    let idx = lower.indexOf(q);
    if (idx < 0) continue;
    const frag = document.createDocumentFragment();
    let pos = 0;
    while (idx >= 0) {
      frag.appendChild(document.createTextNode(val.slice(pos, idx)));
      const mark = document.createElement('mark');
      mark.textContent = val.slice(idx, idx + q.length);
      frag.appendChild(mark);
      first ??= mark;
      pos = idx + q.length;
      idx = lower.indexOf(q, pos);
    }
    frag.appendChild(document.createTextNode(val.slice(pos)));
    node.replaceWith(frag);
  }
  return first;
}

export function formatSize(bytes: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: i === 0 ? 0 : 1 })} ${units[i]}`;
}

const timeFmt = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const weekdayFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' });

export const formatTime = (d: Date) => timeFmt.format(d);

export function formatDay(d: Date, now = new Date()): string {
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  if (diff > 1 && diff < 7) return weekdayFmt.format(d);
  return dayFmt.format(d);
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function toInputDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
