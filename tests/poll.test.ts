// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from 'vitest';
import { resolveAttachments } from '../src/media/resolve';
import { parseChat, parsePoll } from '../src/parser/parse';
import { ChatView } from '../src/ui/chat-view';

const L = '\u200E';

describe('anket ayrıştırma', () => {
  it('Android TR anketi', () => {
    const r = parseChat(
      [
        '24.11.2026 18:00 - Ali: ANKET:',
        'toplanti?',
        'SEÇENEK: bu aksam (1 oy)',
        'SEÇENEK: yarin sabah (0 oy)',
        'SEÇENEK: hayir: mesajlasalim (12 oy)',
      ].join('\n'),
    );
    const m = r.messages[0];
    expect(m.author).toBe('Ali');
    expect(m.poll).toEqual({
      question: 'toplanti?',
      options: [
        { text: 'bu aksam', votes: 1 },
        { text: 'yarin sabah', votes: 0 },
        { text: 'hayir: mesajlasalim', votes: 12 },
      ],
    });
    expect(m.text).toContain('toplanti?'); // arama için ham metin korunur
    expect(r.lang).toBe('tr');
  });

  it('iOS EN anketi (LRM ile başlayan) sistem mesajı sanılmaz', () => {
    const r = parseChat(
      [`${L}[11/24/26, 6:00:00\u202FPM] Bob: ${L}POLL:`, 'Lunch?', 'OPTION: Pizza (1 vote)', 'OPTION: Sushi (2 votes)'].join('\n'),
    );
    expect(r.messages[0].author).toBe('Bob');
    expect(r.messages[0].poll?.options).toEqual([
      { text: 'Pizza', votes: 1 },
      { text: 'Sushi', votes: 2 },
    ]);
  });

  it('çok satırlı soru', () => {
    expect(parsePoll('ANKET:\nbirinci satır\nikinci satır\nSEÇENEK: a (0 oy)')?.question).toBe('birinci satır\nikinci satır');
  });

  it('anket olmayan metinler anket sayılmaz', () => {
    expect(parsePoll('ANKET:')).toBeNull();
    expect(parsePoll('ANKET:\nsoru?')).toBeNull(); // seçenek yok
    expect(parsePoll('Anket: bence iyi\nSEÇENEK: a (1 oy)\nx')).toBeNull();
    expect(parsePoll('ANKET:\nsoru\nSEÇENEK: a (1 oy)\nsonradan yazı')).toBeNull();
    expect(parsePoll('ANKET:\nSEÇENEK: a (1 oy)')).toBeNull(); // soru yok
  });
});

describe('anket kartı', () => {
  beforeAll(() => {
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      observe() {}
      disconnect() {}
    };
  });

  it('seçenekleri, oy çubuklarını ve toplamı gösterir; HTML çalıştırmaz', async () => {
    const result = parseChat(
      ['24.11.2026 18:00 - Ali: ANKET:', 'ne zaman?', 'SEÇENEK: <img src=x onerror=alert(1)> (3 oy)', 'SEÇENEK: yarın (1 oy)'].join('\n'),
    );
    const { byId, stats } = resolveAttachments(result.messages, new Map());
    const view = new ChatView({ result, byId, stats, title: 't', me: null }, () => {}, () => {});
    document.body.append(view.root);
    for (let i = 0; i < 20 && !view.root.querySelector('.poll'); i++) await new Promise((r) => setTimeout(r, 10));
    const poll = view.root.querySelector('.poll')!;
    expect(poll.querySelector('.poll-question')!.textContent).toBe('ne zaman?');
    const opts = [...poll.querySelectorAll('.poll-option')];
    expect(opts.map((o) => o.querySelector('.poll-count')!.textContent)).toEqual(['3', '1']);
    expect((opts[0].querySelector('.poll-fill') as HTMLElement).style.width).toBe('75%');
    expect(opts[0].classList.contains('leading')).toBe(true);
    expect(poll.querySelector('.poll-total')!.textContent).toBe('Toplam 4 oy');
    expect(poll.querySelector('img')).toBeNull();
    expect(opts[0].querySelector('.poll-label')!.textContent).toBe('<img src=x onerror=alert(1)>');
    view.destroy();
  });
});
