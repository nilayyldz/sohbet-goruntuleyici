import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { resolveAttachments } from '../src/media/resolve';
import { parseVcf } from '../src/media/vcf';
import { parseChat } from '../src/parser/parse';
import { loadFile, mediaKey, titleFromFileName } from '../src/zip/loader';
import { ANDROID_TR, IOS_EN } from './samples';

async function makeZip(files: Record<string, string>, name: string): Promise<File> {
  const zip = new JSZip();
  for (const [k, v] of Object.entries(files)) zip.file(k, v);
  const buf = await zip.generateAsync({ type: 'uint8array' });
  return new File([buf as BlobPart], name);
}

describe('loader + resolver', () => {
  it('finds iOS _chat.txt and matches attachments', async () => {
    const file = await makeZip(
      {
        '_chat.txt': IOS_EN,
        '00000003-PHOTO-2023-12-31-21-42-00.jpg': 'img',
        '00000007-Report.pdf': 'pdf',
        'notes.txt': 'not a chat',
      },
      'WhatsApp Chat - Friends.zip',
    );
    const loaded = await loadFile(file);
    expect(loaded.chatFileName).toBe('_chat.txt');
    expect(loaded.title).toBe('Friends');
    const r = parseChat(loaded.chatText);
    const { byId, stats } = resolveAttachments(r.messages, loaded.media);
    expect(byId.get(2)?.name).toBe('00000003-PHOTO-2023-12-31-21-42-00.jpg');
    expect(byId.get(6)?.name).toBe('00000007-Report.pdf');
    expect(stats.missing).toEqual(['00000008-AUDIO-2024-01-01-00-02-00.opus']);
  });

  it('handles Android TR in a subfolder and NFD names', async () => {
    const nfd = 'Şubat Raporu.pdf'.normalize('NFD');
    const file = await makeZip(
      {
        'export/Mehmet ile WhatsApp Sohbeti.txt': ANDROID_TR + `\n01.01.2024 00:09 - Mehmet: Şubat Raporu.pdf (dosya ekli)`,
        'export/IMG-20231231-WA0001.jpg': 'img',
        [`export/${nfd}`]: 'pdf',
      },
      'x.zip',
    );
    const loaded = await loadFile(file);
    expect(loaded.title).toBe('Mehmet');
    const r = parseChat(loaded.chatText);
    const { byId, stats } = resolveAttachments(r.messages, loaded.media);
    expect(byId.get(3)?.name).toBe('IMG-20231231-WA0001.jpg');
    expect(byId.get(r.messages.length - 1)).toBeDefined();
    expect(stats.missing).toEqual(['VID-20240101-WA0003.mp4']);
  });

  it('reverts uncertain attachments without file', () => {
    const r = parseChat('31.12.2023 21:41 - A: Bu bir test.txt (yani öyle)');
    resolveAttachments(r.messages, new Map());
    expect(r.messages[0].attachment).toBeUndefined();
    expect(r.messages[0].text).toBe('Bu bir test.txt (yani öyle)');
  });

  it('rejects zips without chat', async () => {
    await expect(loadFile(await makeZip({ 'a.txt': 'hello' }, 'a.zip'))).rejects.toThrow(/bulunamadı/);
  });

  it('titles and keys', () => {
    expect(titleFromFileName('WhatsApp Chat with Bob.txt')).toBe('Bob');
    expect(titleFromFileName('WhatsApp Sohbeti - Aile.zip')).toBe('Aile');
    expect(mediaKey('a/B̈.JPG')).toBe('ö'.replace('ö', 'b̈'.normalize('NFC')) + '.jpg');
  });

  it('parses vcf', () => {
    const c = parseVcf('BEGIN:VCARD\nVERSION:3.0\nN:Yılmaz;Ali;;;\nFN:Ali Yılmaz\nTEL;type=CELL:+90 555\nEND:VCARD');
    expect(c).toEqual([{ name: 'Ali Yılmaz', phones: ['+90 555'] }]);
  });
});
