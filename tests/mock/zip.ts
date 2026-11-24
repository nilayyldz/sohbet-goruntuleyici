import JSZip from 'jszip';
import type { MockExport } from './generator';

/** Mock dışa aktarımı gerçek bir zip dosyasına (File) çevirir. */
export async function toZipFile(mock: MockExport, extra: Record<string, Uint8Array | string> = {}): Promise<File> {
  const zip = new JSZip();
  for (const [path, data] of Object.entries({ ...mock.files, ...extra })) zip.file(path, data);
  const buf = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  return new File([buf as BlobPart], mock.zipName, { type: 'application/zip' });
}
