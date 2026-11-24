# WhatsApp Sohbet Görüntüleyici

WhatsApp'ın **Sohbeti dışa aktar** özelliğiyle alınan `.zip` (veya yalnızca `.txt`) dosyasını
WhatsApp'a benzeyen bir arayüzde açan web uygulaması. Mesajlar, fotoğraflar, videolar, sesli
mesajlar, belgeler ve çıkartmalar gönderildikleri yerde gösterilir.

**Tamamen tarayıcıda çalışır.** Dosyan hiçbir sunucuya yüklenmez. Uygulama tek bir HTML
dosyasıdır ve internet bağlantısı olmadan da açılır.

> Bu proje WhatsApp ya da Meta ile bağlantılı değildir. Yalnızca kullanıcının kendi dışa
> aktardığı dosyaları görüntülemek için yapılmış bağımsız bir araçtır.

---

## İçindekiler

- [Özellikler](#özellikler)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [WhatsApp'tan sohbet nasıl dışa aktarılır?](#whatsapptan-sohbet-nasıl-dışa-aktarılır)
- [Desteklenen biçimler](#desteklenen-biçimler)
- [Gizlilik ve güvenlik](#gizlilik-ve-güvenlik)
- [Geliştirme](#geliştirme)
- [Testler ve sahte veri (mock)](#testler-ve-sahte-veri-mock)
- [Mimari](#mimari)
- [Sık sorulanlar](#sık-sorulanlar)
- [Bilinen sınırlar](#bilinen-sınırlar)
- [Katkıda bulunma](#katkıda-bulunma)

---

## Özellikler

| Alan | Neler var |
|---|---|
| **Biçimler** | Android ve iOS dışa aktarımları; Türkçe ve İngilizce. Tarih sırası (GG/AA, AA/GG, YYYY-AA-GG), 12/24 saat ve iOS'un görünmez yön karakterleri otomatik çözülür. |
| **Ekler** | Txt'deki referanslar zip'teki dosyalarla eşleştirilir: alt klasörler, macOS'un NFD dosya adları ve büyük/küçük harf farkı sorun olmaz. |
| **Medya** | Resim (tıklayınca tam ekran, ←/→ ile gezinme), video, sesli mesaj, çıkartma, belge kartı (aç/indir), kişi kartı (`.vcf`). |
| **Mesaj türleri** | Sistem mesajları, şifreleme bildirimi, silinen mesajlar ("Bu mesajı sildiniz", yönetici silmesi), düzenlenen mesajlar, dışa aktarıma dahil edilmeyen medya. |
| **Metin** | `*kalın*`, `_italik_`, `~üstü çizili~`, ` ```kod``` `, tıklanabilir bağlantılar, mavi `@etiketler`, yalnızca emojiden oluşan büyük mesajlar. |
| **Araçlar** | "Ben kimim?" seçimi (sağdaki yeşil baloncuklar; tahmin edilir ve hatırlanır), sohbette arama (Ctrl+F), tarihe atlama, açık/koyu tema, dışa aktarım bilgi paneli. |
| **Performans** | 60 bin mesajlık sohbetler akıcı kalır: kademeli çizim, `content-visibility`, medya yalnızca ekrana yaklaşınca zip'ten çıkarılır. |
| **Mobil** | Telefon ekranlarına uyumlu düzen. |

## Hızlı başlangıç

### Hazır dosyayla

1. [Actions](../../actions) sekmesinde son başarılı çalıştırmayı aç ve **sohbet-goruntuleyici**
   dosyasını indir. İçindeki `index.html` uygulamanın tamamıdır.
2. `index.html` dosyasını çift tıklayarak tarayıcıda aç.
3. WhatsApp'tan aldığın `.zip` dosyasını sayfaya sürükle veya **seç** bağlantısına tıkla.

### Kaynaktan derleyerek

Gereken: [Node.js](https://nodejs.org/) 20 veya üstü.

```bash
git clone <bu-deponun-adresi>
cd <depo-klasörü>
npm ci
npm run build
```

Çıktı: `dist/index.html`. Bu tek dosyayı istediğin yere kopyalayabilir, USB belleğe atabilir
veya statik bir sunucuda yayınlayabilirsin.

## WhatsApp'tan sohbet nasıl dışa aktarılır?

**Android:** Sohbeti aç → sağ üstte **⋮** → **Diğer** → **Sohbeti dışa aktar** →
**Medyayı ekle** (fotoğraflar da görünsün istiyorsan) → dosyayı kendine kaydet.

**iPhone:** Sohbeti aç → üstteki kişi/grup adına dokun → en alta kaydır →
**Sohbeti Dışa Aktar** → **Medya Ekle** → dosyayı **Dosyalar**'a kaydet.

> **İpucu:** WhatsApp, medya eklense bile çok uzun sohbetlerde yalnızca en son medyayı ekler.
> Eski fotoğraflar "Fotoğraf dışa aktarıma dahil edilmedi" olarak görünür. Ayrıntılar için
> [Sık sorulanlar](#sık-sorulanlar) bölümüne bak.

## Desteklenen biçimler

| | Android | iOS |
|---|---|---|
| Sohbet dosyası | `WhatsApp Chat with X.txt` · `X ile WhatsApp Sohbeti.txt` | `_chat.txt` |
| Satır (TR) | `31.12.2025 21:41 - Ayşe: Merhaba` | `[31.12.2025 21:41:05] Ayşe: Merhaba` |
| Satır (EN) | `12/31/25, 9:41 PM - Ayşe: Hello` | `[12/31/25, 9:41:05 PM] Ayşe: Hello` |
| Ek (TR) | `IMG-20251231-WA0001.jpg (dosya ekli)` | `<00000012-PHOTO-2025-12-31-21-41-05.jpg eklendi>` · `<ek: …>` |
| Ek (EN) | `IMG-20251231-WA0001.jpg (file attached)` | `<attached: 00000012-PHOTO-….jpg>` |
| Medya hariç | `<Medya dahil edilmedi>` · `<Media omitted>` | `görüntü dahil edilmedi` · `image omitted` |

Diğer dillerdeki dışa aktarımlar da büyük ölçüde açılır. Mesaj satırları dilden bağımsız
tanınır. Android ekleri, dosya zip'te bulunduğu sürece eşleşir. Ancak "silindi" gibi
işaretler yalnızca Türkçe ve İngilizce için tanınır.

## Gizlilik ve güvenlik

WhatsApp dışa aktarımları çok kişisel veriler içerir ve çoğu zaman başka birinden gelir. Bu
yüzden uygulama, zip'in **içeriğini güvenilmeyen girdi** olarak kabul eder.

### Veri cihazdan çıkmaz

- Derlenmiş sayfada katı bir **Content-Security-Policy** var: `default-src 'none'; connect-src 'none'; …`.
  Tarayıcı, sayfanın herhangi bir sunucuya istek atmasını (fetch, XHR, WebSocket, beacon)
  engeller.
- Tüm kod (JSZip dahil) tek dosyaya gömülüdür. CDN, yazı tipi sunucusu, analitik ya da
  izleme kodu yoktur.
- Medya yalnızca bellek içi `blob:` URL'leriyle gösterilir. Sayfa kapanınca hepsi silinir.
- `localStorage`'a yalnızca tema tercihi ve sohbet başına "Ben" seçimi yazılır. Mesaj
  içeriği asla saklanmaz.

### Saldırılara karşı alınan önlemler

| Tehdit | Önlem | Test |
|---|---|---|
| Mesaj, yazar adı veya dosya adında HTML/JS (XSS) | Tüm içerik `textContent` ve DOM API ile eklenir. `innerHTML` yalnızca sabit simgelerde kullanılır. Bağlantılar yalnızca `http(s)` olabilir ve `rel="noopener noreferrer"` taşır. | `tests/security.test.ts`: 13 saldırı girdisi + tüm sohbet görünümü |
| Zip'teki SVG/HTML dosyasının uygulama içinde çalışması | Yeni sekmede yalnızca PDF, resim ve video/ses açılır. Diğer her şey yalnızca indirilir. | `OPENABLE` testi |
| Yavaşlatan girdiler (ReDoS) | Tüm düzenli ifadeler doğrusal zamanlı olacak şekilde yazıldı. Düşmanca 50 bin karakterlik girdiler test edilir. | ReDoS testleri |
| `../` içeren zip yolları | Dosyalar yalnızca son ad parçasıyla kullanılır; diske hiçbir şey yazılmaz. | Dizin gezinme testi |
| Zip bombası / çok büyük sohbet | Sohbet metni 256 MB ile sınırlı; en fazla 20 `.txt` adayı açılır. | Boyut sınırı testi |
| Dinamik kod çalıştırma | Kaynakta `eval`, `new Function`, `fetch`, `XMLHttpRequest`, `WebSocket` vb. kullanımı testle yasaklıdır. | Kaynak kod denetimi |
| Bağımlılık açıkları | Çalışma zamanı bağımlılığı yalnızca JSZip'tir. Sürümler sabitlenmiştir ve CI'da `npm audit` çalışır. | CI |

Bir güvenlik sorunu bulursan lütfen herkese açık bir issue yerine depo sahibiyle doğrudan
iletişime geç.

## Geliştirme

```bash
npm ci               # bağımlılıkları kur
npm run dev          # geliştirme sunucusu (http://localhost:5173)
npm test             # tüm testler
npm run test:watch   # değişiklikte testleri yeniden çalıştır
npm run typecheck    # TypeScript kontrolü
npm run build        # dist/index.html üret
npm run fixtures     # fixtures/ altına örnek zip'ler üret
```

Geliştirme sunucusunda CSP kapalıdır (Vite'ın anlık yenilemesi çalışsın diye). Gizlilik
kontrolünü `npm run build` sonrasında `dist/index.html` üzerinde yap.

## Testler ve sahte veri (mock)

Test takımı Vitest ile çalışır ve **120'den fazla test** içerir:

| Dosya | Kapsam |
|---|---|
| `tests/parse.test.ts` | Dört temel biçim, belirsiz tarihler, telefon numarası yazarlar, 200 bin satır performansı |
| `tests/resolve.test.ts` | Zip yükleme, sohbet dosyası bulma, alt klasör, NFD adlar, vCard |
| `tests/admin-omitted.test.ts` | Yönetici silmesi, dahil edilmeyen medyanın zaman damgasıyla kurtarılması |
| `tests/ios-tr-eklendi.test.ts` | iOS Türkçe `<… eklendi>` ekleri, belgeler, çıkartmalar |
| `tests/mention.test.ts` | `@etiket` tanıma (çok kelimeli adlar, telefon numaraları, e-postalar) |
| `tests/mock-roundtrip.test.ts` | **Sahte veriyle uçtan uca:** 8 biçim varyasyonu × 5 tohum; zip üret → yükle → ayrıştır → beklenenle karşılaştır |
| `tests/security.test.ts` | XSS, ReDoS, zip saldırıları, kaynak kod denetimi, CSP |

### Sahte veri üreticisi

`tests/mock/generator.ts`, tekrarlanabilir (tohumlu) sahte dışa aktarımlar üretir. Her mesaj
için hem txt satırını hem de ayrıştırıcının vermesi **gereken** sonucu birlikte oluşturur.
Böylece yüzlerce rastgele senaryo otomatik olarak doğrulanır. İçerikteki tüm adlar ve
metinler uydurmadır.

```ts
import { generateExport } from './tests/mock/generator';
import { toZipFile } from './tests/mock/zip';

const mock = generateExport({
  platform: 'ios',      // 'android' | 'ios'
  lang: 'tr',           // 'tr' | 'en'
  count: 500,           // mesaj sayısı
  seed: 42,             // aynı tohum → aynı çıktı
  people: 4,            // 2 = birebir sohbet
  mediaPresence: 0.7,   // eklerin %70'i zip'te olsun
  dateOrder: 'DMY',     // isteğe bağlı: 'DMY' | 'MDY'
  hour12: false,        // isteğe bağlı
  subfolder: 'Sohbet/', // isteğe bağlı: zip içinde alt klasör
  nfdNames: true,       // isteğe bağlı: macOS tarzı dosya adları
});

mock.txt        // sohbet metni
mock.expected   // beklenen ayrıştırma sonucu
mock.missing    // txt'de geçip zip'e konmayan ekler
await toZipFile(mock) // tarayıcıda açılabilecek File nesnesi
```

Üretilen içerik şunları kapsar: çok satırlı mesajlar, biçimlendirme, bağlantılar,
`@etiketler`, iki nokta içeren metinler, emojiler (ZWJ ve bayraklar dahil), her tür ek
(eksik olanlar dahil), açıklamalı ekler, dahil edilmeyen medya, silinen ve düzenlenen
mesajlar, yönetici silmesi, grup sistem mesajları, telefon numarası yazarlar, CRLF/LF ve BOM.

`npm run fixtures` ise tarayıcıda elle denemek için gerçek görsel, ses ve PDF içeren örnek
zip'leri `fixtures/` klasörüne yazar. Bunlar arasında 60 bin mesajlık bir grup da var.

## Mimari

```
index.html              Giriş sayfası (derlemede tek dosyaya gömülür)
vite.config.ts          Tek dosya derleme + CSP eklentisi
src/
  main.ts               Dosya seçme/bırakma, yükleme akışı
  parser/
    patterns.ts         Satır, ek ve işaret regex'leri; dosya türü/MIME tabloları
    parse.ts            Biçim/dil/tarih sırası tespiti, ayrıştırma, "ben" tahmini
    types.ts            Message, ParseResult türleri
  zip/loader.ts         JSZip ile açma, sohbet .txt'sini bulma, medya indeksi, boyut sınırı
  media/
    resolve.ts          Ek ↔ dosya eşleştirme, zaman damgasıyla kurtarma, Blob URL önbelleği
    vcf.ts              vCard ayrıştırıcı
  ui/
    chat-view.ts        Başlık, arama, kademeli çizim, kaydırma, bilgi paneli
    media.ts            Tembel yüklenen medya bileşenleri, belge/kişi kartları
    lightbox.ts         Tam ekran görsel gösterici
    format.ts           Güvenli metin biçimlendirme, @etiket, vurgulama, tarih biçimleri
    icons.ts            Sabit SVG simgeleri
  styles.css            WhatsApp benzeri tema (açık/koyu)
tests/                  Vitest testleri ve sahte veri üreticisi
scripts/make-fixtures.mjs  Örnek zip üreticisi
```

**Akış:** dosya → `loadFile` (zip'i açar, sohbet metnini bulur) → `parseChat` (satırları
mesajlara çevirir) → `resolveAttachments` (ekleri dosyalarla eşleştirir) → `ChatView`
(mesajları parça parça çizer; medya ekrana yaklaşınca yüklenir).

## Sık sorulanlar

**"Fotoğraf dışa aktarıma dahil edilmedi" neden yazıyor?**
WhatsApp o dosyayı zip'e koymamış ve txt'ye bu notu yazmış. Mesajı gönderen kişiden değil,
dışa aktarımı yapan telefondan kaynaklanır. Olası nedenler: dışa aktarım "Medya olmadan"
yapılmış olabilir; WhatsApp uzun sohbetlerde yalnızca en son medyayı ekler; ya da dosya o
telefona hiç indirilmemiş veya silinmiş olabilir. Bilgi panelindeki (📄) **"Zip'te
kullanılmayan dosya"** sayısı 0 ise dosyalar gerçekten zip'te yoktur.

**Kendi mesajlarım neden solda?**
Üst çubuktaki **"Ben:"** listesinden kendi adını seç. Seçim o sohbet için hatırlanır.

**Sesli mesajlar çalmıyor.**
WhatsApp sesli mesajları `.opus` biçimindedir. Chrome, Edge ve Firefox bunları çalar.
Desteklemeyen tarayıcılarda dosyayı indirme seçeneği gösterilir.

## Bilinen sınırlar

- JSZip zip'in tamamını belleğe okur. Birkaç GB'lık dışa aktarımlarda tarayıcının belleği
  yetmeyebilir.
- HEIC fotoğrafları çoğu tarayıcı gösteremez. Bunlar indirilebilir belge olarak görünür.
- Anketler, konumlar ve yanıtlanan (alıntılanan) mesajlar dışa aktarım metninde ayrı
  biçimde yer almadığı için düz metin olarak görünür.

## Katkıda bulunma

1. Depoyu çatalla (fork) ve bir dal aç.
2. Değişikliğini yap; `npm test` ve `npm run build` geçmeli.
3. Yeni bir dışa aktarım biçimi ekliyorsan `tests/mock/generator.ts`'e de ekle ki uçtan uca
   testler onu da kapsasın.
4. **Gerçek sohbet dışa aktarımlarını asla depoya ekleme.** Örnek gerekiyorsa sahte veri
   üreticisini kullan ya da adları ve içeriği değiştir.
