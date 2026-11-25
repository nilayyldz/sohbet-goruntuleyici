import { t } from '../i18n';
import { icons } from './icons';

/**
 * Başlangıç (tanıtım) sayfasının HTML'i. Yalnızca sabit simgeler ve sabit sözlük
 * değerleri içerir; kullanıcı verisi hiçbir zaman buraya girmez.
 */
export function landingHtml(): string {
  return `
  <div class="hero-band">
    <span class="glow g1"></span><span class="glow g2"></span>
    <header class="start-bar">
      <div class="brand"><span class="brand-logo">${icons.chat}</span><span class="brand-name">${t('brandHtml')}</span></div>
      <nav class="start-nav">
        <a href="#nasil">${t('navHow')}</a>
        <a href="#gizlilik">${t('navPrivacy')}</a>
        <button class="lang-btn start-lang" type="button" aria-label="${t('langToggle')}" title="${t('langToggle')}">${t('langCode')}</button>
        <button class="icon-btn start-theme" type="button" aria-label="${t('themeToggle')}" title="${t('themeToggle')}">${icons.theme}</button>
      </nav>
    </header>
    <div class="hero">
      <div class="hero-text">
        <span class="pill">${icons.shield}<span>${t('pill')}</span></span>
        <h1>${t('heroHtml')}</h1>
        <p class="lead">${t('lead')}</p>
        <label class="drop" tabindex="0">
          <input type="file" accept=".zip,.txt,application/zip,text/plain" hidden />
          <span class="drop-icon">${icons.upload}</span>
          <span class="drop-copy">
            <span class="drop-title">${t('dropTitle')}</span>
            <span class="drop-text">${t('dropText')}</span>
          </span>
          <span class="drop-btn">${t('dropBtn')}</span>
        </label>
        <p class="error" role="alert" hidden></p>
        <ul class="trust">
          <li>${icons.lock}<span>${t('trustUpload')}</span></li>
          <li>${icons.offline}<span>${t('trustOffline')}</span></li>
          <li>${icons.phone}<span>${t('trustPlatforms')}</span></li>
        </ul>
      </div>
      <div class="phone" aria-hidden="true">
        <div class="phone-screen">
          <div class="pv-head"><span class="pv-back">‹</span><span class="pv-avatar">PE</span><div><b>${t('pvGroup')}</b><small>${t('pvMembers')}</small></div></div>
          <div class="pv-body">
            <div class="day-chip-wrap"><span class="day-chip">${t('pvToday')}</span></div>
            <div class="row in first"><div class="bubble"><div class="author c1">Ece</div><div class="body"><span class="text">${t('pvMsg1')}</span><span class="spacer"></span></div><span class="meta"><time>14:02</time></span></div></div>
            <div class="row in"><div class="bubble has-media k-document pv-doc-bubble"><div class="media doc-card"><span class="doc-icon ext-pdf">PDF</span><div class="doc-info"><div class="doc-name">${t('pvDoc')}</div><div class="doc-meta">${t('pvDocMeta')}</div></div></div><span class="meta"><time>14:02</time></span></div></div>
            <div class="row in"><div class="bubble has-media k-image media-only"><div class="media img-box sized ready pv-photo-img"></div><span class="meta overlay"><time>14:03</time></span></div></div>
            <div class="row out first"><div class="bubble"><div class="body"><span class="text">${t('pvMsg2')}</span><span class="spacer"></span></div><span class="meta"><time>14:05</time></span></div></div>
            <div class="row in first"><div class="bubble pv-voice-bubble"><div class="author c2">Kaan</div><div class="pv-voice"><span class="pv-voice-avatar">K${icons.mic}</span><span class="pv-play"></span><span class="pv-wave"></span></div><span class="pv-voice-time">0:14</span><span class="meta"><time>14:06</time></span></div></div>
            <div class="row in"><div class="bubble has-poll"><div class="body"><div class="poll"><div class="poll-question">${t('pvPollQ')}</div><div class="poll-hint">${t('poll')}</div><ul class="poll-options"><li class="poll-option leading"><div class="poll-row"><span class="poll-circle"></span><span class="poll-label">${t('pvPollA')}</span><span class="poll-count">2</span></div><div class="poll-bar"><div class="poll-fill" style="width:67%"></div></div></li><li class="poll-option"><div class="poll-row"><span class="poll-circle"></span><span class="poll-label">${t('pvPollB')}</span><span class="poll-count">1</span></div><div class="poll-bar"><div class="poll-fill" style="width:33%"></div></div></li></ul></div><span class="spacer"></span></div><span class="meta"><time>14:08</time></span></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="start-main">
    <section class="features" aria-label="${t('featuresLabel')}">
      <article><span class="f-icon">${icons.image}</span><h2>${t('f1Title')}</h2><p>${t('f1Text')}</p></article>
      <article><span class="f-icon">${icons.search}</span><h2>${t('f2Title')}</h2><p>${t('f2Text')}</p></article>
      <article><span class="f-icon">${icons.person}</span><h2>${t('f3Title')}</h2><p>${t('f3Text')}</p></article>
      <article><span class="f-icon">${icons.bolt}</span><h2>${t('f4Title')}</h2><p>${t('f4Text')}</p></article>
    </section>

    <section class="steps" id="nasil" aria-label="${t('navHow')}">
      <p class="eyebrow">${t('navHow')}</p>
      <h2>${t('stepsTitle')}</h2>
      <ol class="step-list">
        <li>
          <span class="step-no">1</span>
          <h3>${t('s1Title')}</h3>
          <p>${t('s1AndroidHtml')}</p>
          <p>${t('s1IphoneHtml')}</p>
        </li>
        <li>
          <span class="step-no">2</span>
          <h3>${t('s2Title')}</h3>
          <p>${t('s2TextHtml')}</p>
        </li>
        <li>
          <span class="step-no">3</span>
          <h3>${t('s3Title')}</h3>
          <p>${t('s3TextHtml')}</p>
          <ul class="shortcuts" aria-label="${t('shortcutsLabel')}">
            <li class="kb-only"><span><kbd>Ctrl</kbd> + <kbd>F</kbd></span>${t('scSearch')}</li>
            <li class="kb-only"><span><kbd>Enter</kbd> / <kbd>Shift</kbd> + <kbd>Enter</kbd></span>${t('scNextPrev')}</li>
            <li class="kb-only"><span><kbd>←</kbd> <kbd>→</kbd></span>${t('scPhotos')}</li>
            <li class="kb-only"><span><kbd>Esc</kbd></span>${t('scClose')}</li>
            <li class="touch-only"><span>${icons.search}</span>${t('scSearch')}</li>
            <li class="touch-only"><span>${icons.image}</span>${t('scTapPhoto')}</li>
            <li><span>${icons.calendar}</span>${t('scDate')}</li>
          </ul>
        </li>
      </ol>
    </section>

    <section class="privacy" id="gizlilik" aria-label="${t('navPrivacy')}">
      <span class="privacy-icon">${icons.shield}</span>
      <div>
        <h2>${t('privacyTitle')}</h2>
        <p>${t('privacyText')}</p>
      </div>
    </section>

    <footer class="start-foot">
      <span>${icons.code}${t('openSource')} · <a href="https://github.com/nilayyldz" target="_blank" rel="noopener noreferrer">@nilayyldz</a></span>
      <span>${t('notAffiliated')}</span>
    </footer>
  </div>
`;
}
