import './styles.css';
import { resolveAttachments } from './media/resolve';
import { guessMe, parseChat } from './parser/parse';
import { applySavedTheme, ChatView } from './ui/chat-view';
import { icons } from './ui/icons';
import { loadFile } from './zip/loader';

applySavedTheme();

const app = document.getElementById('app')!;
let view: ChatView | null = null;

const start = document.createElement('section');
start.className = 'start';
start.innerHTML = `
  <div class="start-card">
    <div class="start-logo">${icons.lock}</div>
    <h1>WhatsApp Sohbet Görüntüleyici</h1>
    <p class="lead">WhatsApp'ın <b>Sohbeti dışa aktar</b> özelliğiyle aldığın <b>.zip</b> (veya .txt) dosyasını buraya bırak.</p>
    <label class="drop" tabindex="0">
      <input type="file" accept=".zip,.txt,application/zip,text/plain" hidden />
      <span class="drop-icon">${icons.upload}</span>
      <span class="drop-text">Dosyayı sürükleyip bırak veya <u>seç</u></span>
    </label>
    <p class="error" role="alert" hidden></p>
    <ul class="facts">
      <li><b>Tamamen çevrimdışı:</b> dosya tarayıcında açılır, hiçbir sunucuya gönderilmez.</li>
      <li>Android ve iOS, Türkçe ve İngilizce dışa aktarımları desteklenir.</li>
      <li>Resim, video, ses, belge ve kişi kartları mesajın yerinde gösterilir.</li>
    </ul>
  </div>`;
app.append(start);

const overlay = document.createElement('div');
overlay.className = 'loading';
overlay.hidden = true;
overlay.innerHTML = `<div class="spinner"></div><div class="loading-text"></div>`;
document.body.append(overlay);

const input = start.querySelector<HTMLInputElement>('input[type=file]')!;
const drop = start.querySelector<HTMLElement>('.drop')!;
const errorEl = start.querySelector<HTMLElement>('.error')!;

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

async function open(file: File): Promise<void> {
  errorEl.hidden = true;
  try {
    await setLoading('Dosya açılıyor…');
    const loaded = await loadFile(file);
    await setLoading('Mesajlar ayrıştırılıyor…');
    const result = parseChat(loaded.chatText);
    const { byId, stats } = resolveAttachments(result.messages, loaded.media);
    const title = loaded.title ?? file.name.replace(/\.(zip|txt)$/i, '');
    const saved = loadMe(title);
    const me = saved && result.authors.includes(saved) ? saved : guessMe(result, loaded.title);

    view?.destroy();
    view = new ChatView(
      { result, byId, stats, title, me },
      () => {
        view?.destroy();
        view = null;
        start.hidden = false;
        document.title = 'Sohbet Görüntüleyici';
      },
      (m) => saveMe(title, m),
    );
    start.hidden = true;
    app.append(view.root);
    document.title = `${title} · Sohbet Görüntüleyici`;
  } catch (err) {
    console.error(err);
    errorEl.textContent = err instanceof Error ? err.message : 'Dosya okunamadı.';
    errorEl.hidden = false;
    start.hidden = false;
  } finally {
    await setLoading(null);
  }
}

if (import.meta.env.DEV) {
  (window as unknown as { __open: typeof open }).__open = open;
}
