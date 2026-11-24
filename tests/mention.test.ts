// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderRich, setMentionNames } from '../src/ui/format';

function html(text: string): string {
  const div = document.createElement('div');
  renderRich(text, div);
  return div.innerHTML;
}

describe('@mentions', () => {
  it('colors known multi-word names and single words', () => {
    setMentionNames(['~ Ozan Çağrı ŞEN', 'Zeynep']);
    expect(html('@Ozan Çağrı ŞEN selam')).toBe('<span class="mention">@Ozan Çağrı ŞEN</span> selam');
    expect(html('@Zeynep baskan kizmami')).toBe('<span class="mention">@Zeynep</span> baskan kizmami');
    expect(html('@Ali naber')).toBe('<span class="mention">@Ali</span> naber');
    expect(html('ara @905551234567')).toBe('ara <span class="mention">@905551234567</span>');
  });
  it('ignores e-mail addresses and keeps other formatting', () => {
    setMentionNames([]);
    expect(html('mail: a@b.com')).toBe('mail: a@b.com');
    expect(html('*kalın* @Ece')).toBe('<strong>kalın</strong> <span class="mention">@Ece</span>');
  });
});
