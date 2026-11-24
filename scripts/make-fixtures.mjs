// Gerçek dışa aktarımları taklit eden sentetik zip dosyaları üretir (fixtures/).
// Kişisel veri içermez; uygulamayı denemek ve geliştirmek içindir.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import JSZip from 'jszip';

const L = '\u200E';
const N = '\u202F';

// ---- Küçük medya üreticileri ---------------------------------------------
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function png(w, h, painter) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b] = painter(x, y);
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}
const gradient = (w, h, hue) => png(w, h, (x, y) => [
  Math.round(120 + 120 * Math.sin(hue + x / w * 3)),
  Math.round(90 + 140 * (y / h)),
  Math.round(160 + 90 * Math.cos(hue + x / 40)),
]);
const sticker = () => png(160, 160, (x, y) => {
  const d = Math.hypot(x - 80, y - 80);
  return d < 70 ? [255, 200, 40] : [255, 255, 255];
});
function wav(seconds = 2, freq = 440) {
  const rate = 8000, n = rate * seconds;
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin((2 * Math.PI * freq * i) / rate) * 8000 * Math.min(1, (n - i) / 2000)), 44 + i * 2);
  return b;
}
function pdf(text) {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stream = `BT /F1 18 Tf 30 100 Td (${text}) Tj ET`;
  objs[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  let out = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}
const vcf = (name, tel) => `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${name}\r\nTEL;type=CELL:${tel}\r\nEND:VCARD\r\n`;

async function save(name, files) {
  const zip = new JSZip();
  for (const [k, v] of Object.entries(files)) zip.file(k, v);
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  writeFileSync(`fixtures/${name}`, buf);
  console.log(`fixtures/${name}  ${(buf.length / 1024).toFixed(1)} KB`);
}

mkdirSync('fixtures', { recursive: true });

// ---- Android Türkçe (birebir sohbet) --------------------------------------
await save('WhatsApp Sohbeti - Mehmet.zip', {
  'Mehmet ile WhatsApp Sohbeti.txt': [
    `30.12.2023 18:02 - Mesajlar ve aramalar uçtan uca şifrelidir. WhatsApp dahil olmak üzere bu sohbetin dışında bulunan hiç kimse bunları okuyamaz ve dinleyemez. Daha fazla bilgi edinmek için dokunun.`,
    `30.12.2023 18:02 - Ayşe: Selam! Yarın akşam için plan var mı?`,
    `30.12.2023 18:05 - Mehmet: Selam 👋 *Kesinlikle* var, _sürpriz_ olsun ama`,
    `30.12.2023 18:05 - Mehmet: Adres burada: https://example.com/harita?yer=kadikoy`,
    `30.12.2023 18:06 - Ayşe: 😂😂`,
    `30.12.2023 18:07 - Ayşe: Tamam, şunu da getiririm:`,
    `- tatlı`,
    `- içecek`,
    `- ~kartlar~ oyun`,
    `31.12.2023 09:15 - Mehmet: IMG-20231231-WA0001.jpg (dosya ekli)`,
    `Sabah manzarası`,
    `31.12.2023 09:16 - Mehmet: IMG-20231231-WA0002.jpg (dosya ekli)`,
    `31.12.2023 09:20 - Ayşe: PTT-20231231-WA0003.opus (dosya ekli)`,
    `31.12.2023 10:00 - Mehmet: Menü.pdf (dosya ekli)`,
    `Menüyü attım`,
    `31.12.2023 10:01 - Mehmet: Ali Yılmaz.vcf (dosya ekli)`,
    `31.12.2023 10:02 - Ayşe: STK-20231231-WA0004.webp (dosya ekli)`,
    `31.12.2023 10:03 - Ayşe: VID-20231231-WA0005.mp4 (dosya ekli)`,
    `31.12.2023 10:04 - Mehmet: <Medya dahil edilmedi>`,
    `31.12.2023 10:05 - Ayşe: Bu mesajı sildiniz`,
    `31.12.2023 10:06 - Mehmet: Bu mesaj silindi`,
    `31.12.2023 10:07 - Mehmet: Saat 8'de görüşürüz <Bu mesaj düzenlendi>`,
    `31.12.2023 18:00 - Mehmet: ANKET:`,
    `toplantı ne zaman?`,
    `SEÇENEK: bu akşam (1 oy)`,
    `SEÇENEK: yarın sabah (0 oy)`,
    `SEÇENEK: hiç yapmayalım, mesajla halledelim (2 oy)`,
    `01.01.2024 00:00 - Ayşe: Mutlu yıllar!! 🎉`,
    `01.01.2024 00:01 - Mehmet: Sana da! \`\`\`kod_ornegi = 42\`\`\``,
  ].join('\n'),
  'IMG-20231231-WA0001.jpg': gradient(640, 420, 0),
  'IMG-20231231-WA0002.jpg': gradient(360, 640, 2),
  'PTT-20231231-WA0003.opus': wav(2, 523),
  'Menü.pdf': pdf('Yilbasi menusu'),
  'Ali Yılmaz.vcf': vcf('Ali Yılmaz', '+90 555 123 45 67'),
  'STK-20231231-WA0004.webp': sticker(),
});

// ---- iOS İngilizce (grup) -----------------------------------------------
await save('WhatsApp Chat - Weekend Trip.zip', {
  '_chat.txt': [
    `[12/28/23, 7:41:05${N}PM] Weekend Trip: ${L}Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.`,
    `${L}[12/28/23, 7:41:05${N}PM] Weekend Trip: ${L}Alice created group “Weekend Trip”`,
    `${L}[12/28/23, 7:41:06${N}PM] Weekend Trip: ${L}Alice added Bob and Carol`,
    `[12/28/23, 7:42:10${N}PM] Alice: Who's in for Saturday?`,
    `[12/28/23, 7:43:00${N}PM] Bob: Me! 🙋`,
    `[12/28/23, 7:43:30${N}PM] Carol: Count me in`,
    `${L}[12/28/23, 7:44:00${N}PM] Carol: ${L}<attached: 00000007-PHOTO-2023-12-28-19-44-00.jpg>`,
    `${L}[12/28/23, 7:44:01${N}PM] Carol: ${L}<attached: 00000008-PHOTO-2023-12-28-19-44-01.jpg>`,
    `[12/28/23, 7:45:00${N}PM] Alice: Wow, that view`,
    `${L}[12/29/23, 9:00:00${N}AM] Bob: ${L}Itinerary.pdf • ${L}1 page ${L}<attached: 00000010-Itinerary.pdf>`,
    `${L}[12/29/23, 9:01:00${N}AM] Alice: ${L}<attached: 00000011-AUDIO-2023-12-29-09-01-00.opus>`,
    `${L}[12/29/23, 9:02:00${N}AM] Carol: ${L}image omitted`,
    `${L}[12/29/23, 9:03:00${N}AM] Bob: ${L}<attached: 00000013-VIDEO-2023-12-29-09-03-00.mp4>`,
    `[12/29/23, 9:04:00${N}AM] Carol: Leaving at 8, don't be late ${L}<This message was edited>`,
    `${L}[12/29/23, 9:05:00${N}AM] Alice: ${L}This message was deleted.`,
    `${L}[12/30/23, 10:00:00${N}AM] Alice: ${L}<attached: 00000016-STICKER-2023-12-30-10-00-00.webp>`,
    `${L}[12/30/23, 10:01:00${N}AM] Weekend Trip: ${L}Carol left`,
  ].join('\r\n'),
  '00000007-PHOTO-2023-12-28-19-44-00.jpg': gradient(800, 600, 1),
  '00000008-PHOTO-2023-12-28-19-44-01.jpg': gradient(600, 800, 4),
  '00000010-Itinerary.pdf': pdf('Weekend itinerary'),
  '00000011-AUDIO-2023-12-29-09-01-00.opus': wav(3, 392),
  '00000016-STICKER-2023-12-30-10-00-00.webp': sticker(),
});

// ---- iOS Türkçe (birebir) ----------------------------------------------
await save('WhatsApp Sohbeti - Zeynep.zip', {
  '_chat.txt': [
    `[05.03.2024 14:20:00] Zeynep: ${L}Mesajlar ve aramalar uçtan uca şifrelidir. WhatsApp dahil olmak üzere bu sohbetin dışında bulunan hiç kimse bunları okuyamaz ve dinleyemez.`,
    `[05.03.2024 14:20:10] Zeynep: Toplantı notlarını attım mı sana?`,
    `[05.03.2024 14:21:00] Can: Hayır, atar mısın`,
    `${L}[05.03.2024 14:22:00] Zeynep: ${L}Notlar.pdf • ${L}2 sayfa ${L}<00000004-Notlar.pdf eklendi>`,
    `${L}[05.03.2024 14:23:00] Zeynep: ${L}<00000005-PHOTO-2024-03-05-14-23-00.jpg eklendi>`,
    `${L}[05.03.2024 14:23:30] Can: ${L}<00000006-STICKER-2024-03-05-14-23-30.webp eklendi>`,
    `${L}[05.03.2024 14:23:40] Zeynep: ${L}<00000007-STICKER-2024-03-05-14-23-40.webp eklendi>`,
    `[05.03.2024 14:23:50] Can: @⁨Zeynep⁩ notları okudum, @Ozan Çağrı ŞEN de baksın`,
    `${L}[05.03.2024 14:24:00] Can: ${L}görüntü dahil edilmedi`,
    `[05.03.2024 14:25:00] Can: Teşekkürler 🙏 ${L}<Bu mesaj düzenlendi>`,
    `${L}[06.03.2024 09:00:00] Can: ${L}Bu mesajı sildiniz.`,
    `${L}[06.03.2024 09:05:00] Zeynep: ${L}Bu mesaj ~${N}Ozan Çağrı ŞEN adlı yönetici tarafından silindi.`,
    `${L}[06.03.2024 15:49:00] Zeynep: ${L}görüntü dahil edilmedi`,
    `${L}[06.03.2024 15:50:00] Can: ${L}video dahil edilmedi`,
  ].join('\n'),
  '00000004-Notlar.pdf': pdf('Toplanti notlari'),
  '00000006-STICKER-2024-03-05-14-23-30.webp': sticker(),
  '00000010-PHOTO-2024-03-06-15-49-00.jpg': gradient(480, 360, 5),
  '00000005-PHOTO-2024-03-05-14-23-00.jpg': gradient(500, 500, 3),
});

// ---- Büyük grup sohbeti (performans testi) ------------------------------
{
  const people = ['Deniz', 'Ece', 'Kaan', 'Selin', 'Burak'];
  const words = 'merhaba bugün yarın toplantı proje kahve harika tamam evet hayır belki akşam yemek film maç tatil'.split(' ');
  const lines = [`01.01.2022 10:00 - Mesajlar ve aramalar uçtan uca şifrelidir.`];
  const files = {};
  let t = new Date(2022, 0, 1, 10, 0).getTime();
  const p2 = (n) => String(n).padStart(2, '0');
  let img = 0;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 60000; i++) {
    t += Math.floor(rnd() * 40 * 60000);
    const d = new Date(t);
    const stamp = `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
    const who = people[Math.floor(rnd() * people.length)];
    if (i % 400 === 0 && img < 120) {
      const name = `IMG-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-WA${String(img).padStart(4, '0')}.jpg`;
      files[name] = gradient(320, 240, img);
      lines.push(`${stamp} - ${who}: ${name} (dosya ekli)`);
      img++;
    } else {
      const len = 1 + Math.floor(rnd() * 14);
      lines.push(`${stamp} - ${who}: ${Array.from({ length: len }, () => words[Math.floor(rnd() * words.length)]).join(' ')}`);
    }
  }
  await save('WhatsApp Sohbeti - Büyük Grup.zip', { 'Büyük Grup ile WhatsApp Sohbeti.txt': lines.join('\n'), ...files });
}
