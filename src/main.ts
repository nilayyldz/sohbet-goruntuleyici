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
  <div class="hero-band">
    <span class="glow g1"></span><span class="glow g2"></span>
    <header class="start-bar">
      <div class="brand"><span class="brand-logo">${icons.chat}</span><span class="brand-name">Sohbet<b>Görüntüleyici</b></span></div>
      <nav class="start-nav">
        <a href="#nasil">Nasıl çalışır?</a>
        <a href="#gizlilik">Gizlilik</a>
        <button class="icon-btn start-theme" type="button" aria-label="Açık/koyu tema" title="Açık/koyu tema">${icons.theme}</button>
      </nav>
    </header>
    <div class="hero">
      <div class="hero-text">
        <span class="pill">${icons.shield}<span>%100 tarayıcında · Hiçbir şey yüklenmez</span></span>
        <h1>WhatsApp sohbetlerin,<br /><span class="hl">olduğu gibi</span> karşında.</h1>
        <p class="lead">Dışa aktardığın zip dosyasını bırak. Mesajlar, fotoğraflar, videolar, sesli mesajlar ve anketler saniyeler içinde, tanıdık bir görünümle açılsın.</p>
        <label class="drop" tabindex="0">
          <input type="file" accept=".zip,.txt,application/zip,text/plain" hidden />
          <span class="drop-icon">${icons.upload}</span>
          <span class="drop-copy">
            <span class="drop-title">Zip dosyanı buraya bırak</span>
            <span class="drop-text">veya tıklayıp seç · .zip / .txt</span>
          </span>
          <span class="drop-btn">Dosya seç</span>
        </label>
        <p class="error" role="alert" hidden></p>
        <ul class="trust">
          <li>${icons.lock}<span>Sunucuya yüklenmez</span></li>
          <li>${icons.offline}<span>İnternetsiz çalışır</span></li>
          <li>${icons.phone}<span>Android ve iPhone</span></li>
        </ul>
      </div>
      <div class="phone" aria-hidden="true">
        <div class="phone-screen">
          <div class="pv-head"><span class="pv-back">‹</span><span class="pv-avatar">PE</span><div><b>Proje Ekibi</b><small>Ece, Kaan, Selin, Sen</small></div></div>
          <div class="pv-body">
            <div class="day-chip-wrap"><span class="day-chip">Bugün</span></div>
            <div class="row in first"><div class="bubble"><div class="author c1">Ece</div><div class="body"><span class="text">Sunumu attım, bakar mısınız? 🙌</span><span class="spacer"></span></div><span class="meta"><time>14:02</time></span></div></div>
            <div class="row in"><div class="bubble has-media k-document pv-doc-bubble"><div class="media doc-card"><span class="doc-icon ext-pdf">PDF</span><div class="doc-info"><div class="doc-name">Sunum-taslak.pdf</div><div class="doc-meta">PDF · 12 sayfa</div></div></div><span class="meta"><time>14:02</time></span></div></div>
            <div class="row in"><div class="bubble has-media k-image media-only"><div class="media img-box sized ready pv-photo-img"></div><span class="meta overlay"><time>14:03</time></span></div></div>
            <div class="row out first"><div class="bubble"><div class="body"><span class="text">Harika olmuş, akşam üstünden geçeriz 👍</span><span class="spacer"></span></div><span class="meta"><time>14:05</time></span></div></div>
            <div class="row in first"><div class="bubble pv-voice-bubble"><div class="author c2">Kaan</div><div class="pv-voice"><span class="pv-voice-avatar">K${icons.mic}</span><span class="pv-play"></span><span class="pv-wave"></span></div><span class="pv-voice-time">0:14</span><span class="meta"><time>14:06</time></span></div></div>
            <div class="row in"><div class="bubble has-poll"><div class="body"><div class="poll"><div class="poll-question">Toplantı ne zaman?</div><div class="poll-hint">Anket</div><ul class="poll-options"><li class="poll-option leading"><div class="poll-row"><span class="poll-circle"></span><span class="poll-label">Bu akşam</span><span class="poll-count">2</span></div><div class="poll-bar"><div class="poll-fill" style="width:67%"></div></div></li><li class="poll-option"><div class="poll-row"><span class="poll-circle"></span><span class="poll-label">Yarın sabah</span><span class="poll-count">1</span></div><div class="poll-bar"><div class="poll-fill" style="width:33%"></div></div></li></ul></div><span class="spacer"></span></div><span class="meta"><time>14:08</time></span></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="start-main">
    <section class="features" aria-label="Özellikler">
      <article><span class="f-icon">${icons.image}</span><h2>Her şey yerli yerinde</h2><p>Fotoğraf, video, sesli mesaj, çıkartma, belge, kişi kartı ve anketler mesajın içinde görünür.</p></article>
      <article><span class="f-icon">${icons.search}</span><h2>Bul, git, oku</h2><p>Binlerce mesaj arasında ara, istediğin tarihe atla, fotoğrafları tam ekran gez.</p></article>
      <article><span class="f-icon">${icons.person}</span><h2>Senin bakış açın</h2><p>Kendi adını seç, mesajların sağda yeşil baloncuklarda görünsün. Koyu tema da hazır.</p></article>
      <article><span class="f-icon">${icons.bolt}</span><h2>Hafif ve hızlı</h2><p>Tek bir dosya, kurulum yok. 60 bin mesajlık gruplar bile akıcı açılır.</p></article>
    </section>

    <section class="steps" id="nasil" aria-label="Nasıl çalışır?">
      <p class="eyebrow">Nasıl çalışır?</p>
      <h2>Üç adımda sohbetin karşında</h2>
      <ol class="step-list">
        <li>
          <span class="step-no">1</span>
          <h3>Sohbeti dışa aktar</h3>
          <p><b>Android:</b> Sohbet → <b>⋮</b> → Diğer → <b>Sohbeti dışa aktar</b> → Medyayı ekle</p>
          <p><b>iPhone:</b> Sohbet → kişi/grup adı → <b>Sohbeti Dışa Aktar</b> → Medya Ekle</p>
        </li>
        <li>
          <span class="step-no">2</span>
          <h3>Zip'i buraya bırak</h3>
          <p>Dosyayı açmana gerek yok. Olduğu gibi sürükle ya da <b>Dosya seç</b>'e tıkla.</p>
        </li>
        <li>
          <span class="step-no">3</span>
          <h3>Oku, ara, gez</h3>
          <p>Sohbet WhatsApp'taki gibi açılır. <b>Ben:</b> menüsünden kendi adını seç.</p>
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

    <section class="privacy" id="gizlilik" aria-label="Gizlilik">
      <span class="privacy-icon">${icons.shield}</span>
      <div>
        <h2>Sohbetin sadece senin.</h2>
        <p>Dosyan bu sayfadan dışarı çıkamaz: sayfa, tarayıcıya hiçbir sunucuya bağlanmama kuralıyla yüklenir. Hesap yok, reklam yok, izleme yok. Sayfayı kapattığında her şey bellekten silinir.</p>
      </div>
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
