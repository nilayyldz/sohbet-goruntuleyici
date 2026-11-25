/**
 * YALNIZCA GELİŞTİRME: README ekran görüntüleri için örnek sohbeti otomatik açar.
 * Derlemeye girmez (main.ts bunu yalnızca import.meta.env.DEV iken yükler).
 *
 *   /?demo=Kamp%20Ekibi&me=Selin&theme=dark&scroll=Kamp%20listesi
 *   &search=kamp   → arama çubuğunu açıp arar
 *   &lightbox=1    → ilk fotoğrafı tam ekran açar
 *   &landing=1     → başlangıç sayfasında kalır (yalnızca tema uygulanır)
 *   &lang=en       → arayüz dili (tr | en)
 */
import { setLang } from '../src/i18n';

export async function runDemo(open: (f: File) => Promise<void>): Promise<void> {
  const q = new URLSearchParams(location.search);
  const lang = q.get('lang');
  if (lang === 'tr' || lang === 'en') setLang(lang, false);
  const theme = q.get('theme');
  if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
  const demo = q.get('demo');
  if (!demo || q.get('landing')) return;

  // Başsız tarayıcıda IntersectionObserver tetiklenmeyebilir: her şeyi hemen "görünür" say
  window.IntersectionObserver = class {
    constructor(private cb: IntersectionObserverCallback) {}
    observe(target: Element) {
      queueMicrotask(() => this.cb([{ target, isIntersecting: true } as IntersectionObserverEntry], this as never));
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;

  // Türkçe ve İngilizce adlandırılmış örnekleri dene
  let name = `WhatsApp Sohbeti - ${demo}.zip`;
  let res = await fetch(`/fixtures/${encodeURIComponent(name)}`);
  // Vite, olmayan dosyada 404 yerine index.html döndürür: içerik türüne bak
  if (!res.ok || (res.headers.get('content-type') ?? '').includes('text/html')) {
    name = `WhatsApp Chat - ${demo}.zip`;
    res = await fetch(`/fixtures/${encodeURIComponent(name)}`);
  }
  const blob = await res.blob();
  await open(new File([blob], name));
  await wait(1500);

  const me = q.get('me');
  const select = document.querySelector<HTMLSelectElement>('.me-select select');
  if (me && select) {
    select.value = me;
    select.dispatchEvent(new Event('change'));
  }
  const scroll = q.get('scroll');
  if (scroll) {
    const row = [...document.querySelectorAll<HTMLElement>('[data-id]')].find((r) => r.textContent?.includes(scroll));
    row?.scrollIntoView({ block: 'start' });
    await wait(300);
    row?.scrollIntoView({ block: 'start' });
  }
  const search = q.get('search');
  if (search) {
    document.querySelector<HTMLButtonElement>('[data-act="search"]')?.click();
    const input = document.querySelector<HTMLInputElement>('.search-bar input');
    if (input) {
      input.value = search;
      input.dispatchEvent(new Event('input'));
    }
  }
  // Görsellerin yüklenmesini bekle (en fazla 6 sn)
  for (let i = 0; i < 60 && document.querySelector('.img-box:not(.ready), .sticker:not(.ready)'); i++) await wait(100);
  if (q.get('lightbox')) {
    await wait(800);
    document.querySelector<HTMLElement>('.img-box')?.click();
  }
  document.documentElement.dataset.demoReady = '1';
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
