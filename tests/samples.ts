// Gerçek dışa aktarımların biçimini taklit eden sentetik örnekler.
// iOS: satır başlarında U+200E (LRM), AM/PM öncesinde U+202F bulunur.
const L = '\u200E';
const N = '\u202F';

export const ANDROID_EN = [
  `12/31/23, 9:41${N}PM - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.`,
  `12/31/23, 9:41${N}PM - Alice: Happy new year!`,
  `12/31/23, 9:42${N}PM - Bob: Thanks! This is`,
  `a multi-line message`,
  `12/31/23, 9:43${N}PM - Bob: IMG-20231231-WA0001.jpg (file attached)`,
  `Look at this`,
  `12/31/23, 9:44${N}PM - Alice: <Media omitted>`,
  `12/31/23, 9:45${N}PM - Alice: You deleted this message`,
  `1/1/24, 12:05${N}AM - Bob: Edited text <This message was edited>`,
  `1/1/24, 12:06${N}AM - Bob: PTT-20240101-WA0002.opus (file attached)`,
  `1/1/24, 12:07${N}AM - Alice: Report.pdf (file attached)`,
  `1/1/24, 12:08${N}AM - Bob: This message was deleted`,
].join('\n');

export const ANDROID_TR = [
  `31.12.2023 21:41 - Mesajlar ve aramalar uçtan uca şifrelidir. WhatsApp dahil olmak üzere bu sohbetin dışında bulunan hiç kimse bunları okuyamaz ve dinleyemez.`,
  `31.12.2023 21:41 - Ayşe: Mutlu yıllar!`,
  `31.12.2023 21:42 - Mehmet: Teşekkürler: sana da`,
  `31.12.2023 21:43 - Mehmet: IMG-20231231-WA0001.jpg (dosya ekli)`,
  `Şuna bak`,
  `31.12.2023 21:44 - Ayşe: <Medya dahil edilmedi>`,
  `01.01.2024 00:05 - Mehmet: Düzeltilmiş metin <Bu mesaj düzenlendi>`,
  `01.01.2024 00:06 - Ayşe: Bu mesajı sildiniz`,
  `01.01.2024 00:07 - Mehmet: VID-20240101-WA0003.mp4 (dosya ekli)`,
  `01.01.2024 00:08 - Mehmet, Ayşe'yi gruba ekledi`,
].join('\n');

export const IOS_EN = [
  `[12/31/23, 9:41:05${N}PM] Friends: ${L}Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.`,
  `[12/31/23, 9:41:10${N}PM] Alice: Happy new year!`,
  `${L}[12/31/23, 9:42:00${N}PM] Bob: ${L}<attached: 00000003-PHOTO-2023-12-31-21-42-00.jpg>`,
  `[12/31/23, 9:43:00${N}PM] Bob: Two`,
  `lines`,
  `${L}[12/31/23, 9:44:00${N}PM] Alice: ${L}image omitted`,
  `${L}[12/31/23, 9:45:00${N}PM] Alice: ${L}Contact card omitted`,
  `${L}[1/1/24, 12:01:00${N}AM] Bob: ${L}Report.pdf • ${L}3 pages ${L}<attached: 00000007-Report.pdf>`,
  `${L}[1/1/24, 12:02:00${N}AM] Alice: ${L}<attached: 00000008-AUDIO-2024-01-01-00-02-00.opus>`,
  `[1/1/24, 12:03:00${N}AM] Bob: Fixed ${L}<This message was edited>`,
  `${L}[1/1/24, 12:04:00${N}AM] Friends: ${L}Bob added Carol`,
  `${L}[1/1/24, 12:05:00${N}AM] Alice: ${L}This message was deleted.`,
].join('\r\n');

export const IOS_TR = [
  `[31.12.2023 21:41:05] Ayşe: ${L}Mesajlar ve aramalar uçtan uca şifrelidir. WhatsApp dahil olmak üzere bu sohbetin dışında bulunan hiç kimse bunları okuyamaz ve dinleyemez.`,
  `[31.12.2023 21:41:10] Ayşe: Mutlu yıllar!`,
  `${L}[31.12.2023 21:42:00] Mehmet: ${L}<ek: 00000003-PHOTO-2023-12-31-21-42-00.jpg>`,
  `${L}[31.12.2023 21:44:00] Ayşe: ${L}görüntü dahil edilmedi`,
  `${L}[01.01.2024 00:01:00] Mehmet: ${L}Çıkartma dahil edilmedi`,
  `${L}[01.01.2024 00:02:00] Ayşe: ${L}<ek: 00000006-STICKER-2024-01-01-00-02-00.webp>`,
  `[01.01.2024 00:03:00] Mehmet: Düzelttim ${L}<Bu mesaj düzenlendi>`,
  `${L}[01.01.2024 00:04:00] Ayşe: ${L}Bu mesajı sildiniz.`,
].join('\n');
