import './styles.css';
import { resolveAttachments } from './media/resolve';
import { guessMe, parseChat } from './parser/parse';
import { AppError, getLang, onLangChange, setLang, t } from './i18n';
import { applySavedTheme, ChatView, type ChatData, toggleTheme } from './ui/chat-view';
import { landingHtml } from './ui/landing';
import { loadFile } from './zip/loader';

applySavedTheme();

const app = document.getElementById('app')!;
let view: ChatView | null = null;
let lastData: ChatData | null = null;

const start = document.createElement('section');
start.className = 'start';
app.append(start);

const overlay = document.createElement('div');
overlay.className = 'loading';
overlay.hidden = true;
overlay.innerHTML = `<div class="spinner"></div><div class="loading-text"></div>`;
document.body.append(overlay);

const errorEl = () => start.querySelector<HTMLElement>('.error')!;

/** Tanıtım sayfasını seçili dilde çizer ve olay dinleyicilerini bağlar. */
function renderStart(): void {
  const scroll = start.scrollTop;
  start.innerHTML = landingHtml();
  start.scrollTop = scroll;
  const input = start.querySelector<HTMLInputElement>('input[type=file]')!;
  const drop = start.querySelector<HTMLElement>('.drop')!;
  start.querySelector('.start-theme')!.addEventListener('click', () => toggleTheme());
  start.querySelector('.start-lang')!.addEventListener('click', () => setLang(getLang() === 'tr' ? 'en' : 'tr'));
  input.addEventListener('change', () => {
    const f = input.files?.[0];
    input.value = '';
    if (f) void open(f);
  });
  drop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });
}

function updateTitle(): void {
  document.title = view && lastData ? `${lastData.title} · ${t('appName')}` : t('appName');
  document.body.dataset.dropLabel = t('dropHere');
}

renderStart();
updateTitle();

// Sürükle-bırak tüm pencerede çalışır
let dragDepth = 0;
window.addEventListener('dragenter', (e) => {
  if (!e.dataTransfer?.types.includes('Files')) return;
  dragDepth++;
  document.body.classList.add('dragging');
});
window.addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) document.body.classList.remove('dragging');
});
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('dragging');
  const f = e.dataTransfer?.files?.[0];
  if (f) void open(f);
});

window.addEventListener('keydown', (e) => {
  if (view && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    view.toggleSearch(true);
  }
});

const ME_KEY = (title: string) => `wa-viewer-me:${title}`;
function loadMe(title: string): string | null {
  try {
    return localStorage.getItem(ME_KEY(title));
  } catch {
    return null;
  }
}
function saveMe(title: string, me: string | null): void {
  try {
    if (me) localStorage.setItem(ME_KEY(title), me);
    else localStorage.removeItem(ME_KEY(title));
  } catch {
    /* yok say */
  }
}

function setLoading(text: string | null): Promise<void> {
  overlay.hidden = text === null;
  overlay.querySelector('.loading-text')!.textContent = text ?? '';
  // Metnin ekrana çizilmesine izin ver
  return new Promise((r) => setTimeout(r, 30));
}

function showChat(data: ChatData): void {
  view?.destroy();
  lastData = data;
  view = new ChatView(
    data,
    () => {
      view?.destroy();
      view = null;
      lastData = null;
      start.hidden = false;
      updateTitle();
    },
    (m) => {
      data.me = m;
      saveMe(data.title, m);
    },
  );
  start.hidden = true;
  app.append(view.root);
  updateTitle();
}

async function open(file: File): Promise<void> {
  errorEl().hidden = true;
  try {
    await setLoading(t('loadingOpen'));
    const loaded = await loadFile(file);
    await setLoading(t('loadingParse'));
    const result = parseChat(loaded.chatText);
    const { byId, stats } = resolveAttachments(result.messages, loaded.media);
    const title = loaded.title ?? file.name.replace(/\.(zip|txt)$/i, '');
    const saved = loadMe(title);
    const me = saved && result.authors.includes(saved) ? saved : guessMe(result, loaded.title);
    showChat({ result, byId, stats, title, me });
  } catch (err) {
    console.error(err);
    const el = errorEl();
    el.textContent = err instanceof AppError ? t(err.code) : t('errRead');
    el.hidden = false;
    start.hidden = false;
  } finally {
    await setLoading(null);
  }
}

// Dil değişince tanıtım sayfasını ve açık sohbeti yeniden çiz
onLangChange(() => {
  renderStart();
  if (view && lastData) showChat(lastData);
  updateTitle();
});

if (import.meta.env.DEV) {
  (window as unknown as { __open: typeof open }).__open = open;
  // README ekran görüntüleri için demo modu (derlemeye girmez)
  void import('../dev/demo').then((m) => m.runDemo(open));
}
