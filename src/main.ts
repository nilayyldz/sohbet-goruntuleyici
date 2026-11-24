import './styles.css';
import { resolveAttachments } from './media/resolve';
import { guessMe, parseChat } from './parser/parse';
import { applySavedTheme, ChatView, toggleTheme } from './ui/chat-view';
import { icons } from './ui/icons';
import { loadFile } from './zip/loader';

applySavedTheme();

const app = document.getElementById('app')!;
let view: ChatView | null = null;

const start = document.createElement('section');
start.className = 'start';
start.innerHTML = `
  <header class="start-bar">
    <div class="brand"><span class="brand-logo">${icons.chat}</span><span class="brand-name">Sohbet Görüntüleyici</span></div>
    <nav class="start-nav">
      <a href="#nasil">Nasıl çalışır?</a>
      <a href="#gizlilik">Gizlilik</a>
      <button class="icon-btn start-theme" type="button" aria-label="Açık/koyu tema" title="Açık/koyu tema">${icons.theme}</button>
    </nav>
  </header>

  <div class="start-main">
    <section class="hero">
      <div class="hero-text">
        <h1>WhatsApp sohbetlerini tarayıcında oku.</h1>
        <p class="lead">WhatsApp'tan dışa aktardığın zip dosyasını aç; mesajlar, fotoğraflar, sesli mesajlar, belgeler ve anketler telefondaki gibi görünsün.</p>
        <label class="drop" tabindex="0">
          <input type="file" accept=".zip,.txt,application/zip,text/plain" hidden />
          <span class="drop-icon">${icons.upload}</span>
          <span class="drop-title kb-only">Zip dosyasını buraya sürükle</span>
          <span class="drop-text kb-only">ya da</span>
          <span class="drop-btn">Dosya seç</span>
          <span class="drop-hint">.zip veya .txt · zip'i açmana gerek yok</span>
        </label>
        <p class="error" role="alert" hidden></p>
        <p class="assure">${icons.lock}<span>Dosyan bilgisayarından çıkmaz, internet bağlantısı gerekmez.</span></p>
      </div>

      <figure class="demo" aria-label="Örnek sohbet görünümü">
        <div class="demo-head">
          <span class="avatar demo-avatar">KE</span>
          <div><b>Kamp Ekibi</b><small>Deniz, Ece, Kaan, Selin</small></div>
          <span class="demo-tools">${icons.search}${icons.calendar}</span>
        </div>
        <div class="demo-body" aria-hidden="true">
          <div class="day-chip-wrap"><span class="day-chip">Cumartesi</span></div>
          <div class="row in first"><div class="bubble"><div class="author c1">Ece</div><div class="body"><span class="text">Sabah manzarası böyle, kahve de hazır ☕</span><span class="spacer"></span></div><span class="meta"><time>08:42</time></span></div></div>
          <div class="row in"><div class="bubble has-media k-image media-only"><div class="media img-box sized ready demo-photo"></div><span class="meta overlay"><time>08:42</time></span></div></div>
          <div class="row in first"><div class="bubble has-media k-document demo-doc"><div class="author c2">Kaan</div><div class="media doc-card"><span class="doc-icon ext-pdf">PDF</span><div class="doc-info"><div class="doc-name">Kamp listesi.pdf</div><div class="doc-meta">PDF · 2 sayfa</div></div></div><span class="meta"><time>09:10</time></span></div></div>
          <div class="row out first"><div class="bubble"><div class="body"><span class="text">Fener bende, yedek pil de aldım 🔦</span><span class="spacer"></span></div><span class="meta"><time>09:12</time></span></div></div>
          <div class="row in first"><div class="bubble has-poll"><div class="author c0">Deniz</div><div class="body"><div class="poll"><div class="poll-question">Dönüş ne zaman?</div><div class="poll-hint">Anket</div><ul class="poll-options"><li class="poll-option leading"><div class="poll-row"><span class="poll-circle"></span><span class="poll-label">Pazar öğlen</span><span class="poll-count">3</span></div><div class="poll-bar"><div class="poll-fill" style="width:75%"></div></div></li><li class="poll-option"><div class="poll-row"><span class="poll-circle"></span><span class="poll-label">Pazar akşam</span><span class="poll-count">1</span></div><div class="poll-bar"><div class="poll-fill" style="width:25%"></div></div></li></ul></div><span class="spacer"></span></div><span class="meta"><time>09:20</time></span></div></div>
        </div>
      </figure>
    </section>

    <section class="features" aria-label="Özellikler">
      <div><h2>${icons.image}Medya yerinde</h2><p>Fotoğraf, video, sesli mesaj, çıkartma, belge, kişi kartı ve anketler gönderildikleri mesajda görünür.</p></div>
      <div><h2>${icons.phone}Android ve iPhone</h2><p>İki platformun Türkçe ve İngilizce dışa aktarımları kendiliğinden tanınır.</p></div>
      <div><h2>${icons.search}Arama ve tarih</h2><p>Binlerce mesaj içinde ara, istediğin güne atla, fotoğrafları tam ekran gez.</p></div>
      <div><h2>${icons.person}Kendi bakış açın</h2><p>Adını seçtiğinde kendi mesajların sağda, yeşil baloncuklarda görünür.</p></div>
    </section>

    <section class="steps" id="nasil" aria-labelledby="nasil-baslik">
      <h2 id="nasil-baslik">Nasıl çalışır?</h2>
      <ol class="step-list">
        <li>
          <h3>Sohbeti dışa aktar</h3>
          <p><b>Android:</b> Sohbet → <b>⋮</b> → Diğer → <b>Sohbeti dışa aktar</b> → Medyayı ekle</p>
          <p><b>iPhone:</b> Sohbet → kişi/grup adı → <b>Sohbeti Dışa Aktar</b> → Medya Ekle</p>
        </li>
        <li>
          <h3>Zip dosyasını aç</h3>
          <p>Dosyayı yukarıdaki alana sürükle ya da <b>Dosya seç</b>'e tıkla. Zip'i önceden açmana gerek yok.</p>
        </li>
        <li>
          <h3>Oku, ara, gez</h3>
          <p>Üstteki <b>Ben:</b> menüsünden adını seç.</p>
          <ul class="shortcuts" aria-label="Kısayollar">
            <li class="kb-only"><span><kbd>Ctrl</kbd> + <kbd>F</kbd></span>Sohbette ara</li>
            <li class="kb-only"><span><kbd>Enter</kbd> / <kbd>Shift</kbd> + <kbd>Enter</kbd></span>Sonraki / önceki sonuç</li>
            <li class="kb-only"><span><kbd>←</kbd> <kbd>→</kbd></span>Fotoğraflar arasında gez</li>
            <li class="kb-only"><span><kbd>Esc</kbd></span>Aramayı / fotoğrafı kapat</li>
            <li class="touch-only"><span>${icons.search}</span>Sohbette ara</li>
            <li class="touch-only"><span>${icons.image}</span>Fotoğrafa dokun, tam ekran aç</li>
            <li><span>${icons.calendar}</span>Belirli bir tarihe git</li>
          </ul>
        </li>
      </ol>
    </section>

    <section class="privacy" id="gizlilik" aria-labelledby="gizlilik-baslik">
      <h2 id="gizlilik-baslik">${icons.lock}Gizlilik</h2>
      <p>Zip dosyan yalnızca bu sayfanın içinde, kendi tarayıcında açılır. Sayfa hiçbir sunucuya bağlanamayacak şekilde ayarlıdır; hesap, reklam ya da izleme kodu yoktur. Sekmeyi kapattığında açtığın her şey bellekten silinir.</p>
    </section>

    <footer class="start-foot">
      <span>${icons.code}Açık kaynak · MIT lisansı · <a href="https://github.com/nilayyldz" target="_blank" rel="noopener noreferrer">@nilayyldz</a></span>
      <span>WhatsApp veya Meta ile bağlantılı değildir.</span>
    </footer>
  </div>
`;
app.append(start);

const overlay = document.createElement('div');
overlay.className = 'loading';
overlay.hidden = true;
overlay.innerHTML = `<div class="spinner"></div><div class="loading-text"></div>`;
document.body.append(overlay);

const input = start.querySelector<HTMLInputElement>('input[type=file]')!;
const drop = start.querySelector<HTMLElement>('.drop')!;
const errorEl = start.querySelector<HTMLElement>('.error')!;
start.querySelector('.start-theme')!.addEventListener('click', () => toggleTheme());

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
  // README ekran görüntüleri için demo modu (derlemeye girmez)
  void import('../dev/demo').then((m) => m.runDemo(open));
}
