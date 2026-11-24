import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Derlenen sayfaya katı bir Content-Security-Policy ekler.
 * connect-src 'none' sayesinde tarayıcı fetch/XHR/WebSocket isteklerinin hepsini engeller;
 * medya yalnızca blob: URL'lerinden yüklenebilir. Geliştirme sunucusu (HMR websocket'i)
 * bozulmasın diye yalnızca build sırasında uygulanır.
 */
export function cspPlugin(): Plugin {
  const csp = [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    'img-src blob: data:',
    'media-src blob:',
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
  ].join('; ');
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      );
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [cspPlugin(), viteSingleFile()],
  build: { target: 'es2022', modulePreload: { polyfill: false } },
});
