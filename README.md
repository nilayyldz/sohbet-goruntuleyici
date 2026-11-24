# WhatsApp Sohbet Görüntüleyici

WhatsApp'tan dışa aktardığın sohbeti, WhatsApp'taki gibi baloncuklar, fotoğraflar, videolar
ve sesli mesajlarla birlikte bilgisayarında ya da telefonunda okumanı sağlar.

**Sohbetin hiçbir yere yüklenmez.** Her şey kendi tarayıcında açılır.

<p align="center">
  <a href="https://nilayyldz.github.io/whatsapp-sohbet-goruntuleyici/"><b>▶ Hemen kullan</b></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/nilayyldz/whatsapp-sohbet-goruntuleyici/releases/latest"><b>⬇ İndir (internetsiz kullanım)</b></a>
</p>

> Bu araç WhatsApp ya da Meta ile bağlantılı değildir.

---

## Nasıl kullanılır?

### 1. Sohbeti WhatsApp'tan dışa aktar

**Android:** Sohbeti aç → sağ üstte **⋮** → **Diğer** → **Sohbeti dışa aktar** →
**Medyayı ekle** → dosyayı kendine kaydet (örneğin Drive'a ya da kendine e-postayla gönder).

**iPhone:** Sohbeti aç → üstteki kişi/grup adına dokun → en alta kaydır →
**Sohbeti Dışa Aktar** → **Medya Ekle** → **Dosyalar'a Kaydet**.

Sonuçta adı `WhatsApp Sohbeti - ….zip` gibi olan bir dosyan olacak. **Zip'i açmana gerek yok.**

### 2. Görüntüleyiciyi aç

İki yol var, ikisi de aynı şekilde çalışır:

- **Çevrimiçi:** [**Hemen kullan**](https://nilayyldz.github.io/whatsapp-sohbet-goruntuleyici/) bağlantısına tıkla.
- **İnternetsiz:** [Sürümler](https://github.com/nilayyldz/whatsapp-sohbet-goruntuleyici/releases/latest)
  sayfasından `index.html` dosyasını indir ve çift tıklayarak aç.

### 3. Zip dosyasını sayfaya bırak

Dosyayı sayfaya sürükle ya da **seç** yazısına tıklayıp dosyayı seç. Sohbet birkaç saniye
içinde açılır.

## Neler yapabilirsin?

- **Kendi mesajlarını sağda gör:** Üstteki **Ben:** listesinden kendi adını seç. Seçimin o
  sohbet için hatırlanır.
- **Ara:** 🔍 simgesine tıkla ya da **Ctrl+F** tuşlarına bas. Sonuçlar arasında **Enter** ile
  ilerleyebilirsin.
- **Bir tarihe git:** 📅 simgesine tıklayıp tarih seç.
- **Fotoğrafları büyüt:** Fotoğrafa tıkla, **←/→** ile diğerlerine geç, **Esc** ile kapat.
- **Belgeleri aç ya da indir:** Belge kartlarındaki düğmeleri kullan.
- **Koyu/açık tema:** 🌙 simgesine tıkla.
- **Sohbet bilgisi:** 📄 simgesi mesaj sayısını, tarih aralığını ve bulunamayan dosyaları gösterir.

Android ve iPhone dışa aktarımlarının ikisi de, Türkçe ve İngilizce olarak desteklenir.

## Gizlilik

- Sohbetin **hiçbir sunucuya gönderilmez.** Sayfa, tarayıcıya "dışarıya hiçbir bağlantı
  kurma" kuralıyla yüklenir; bu yüzden istese bile veri gönderemez.
- Mesajların, fotoğrafların ve dosyaların kaydedilmez. Sayfayı kapattığında her şey
  bellekten silinir.
- Tarayıcıda yalnızca iki tercih saklanır: seçtiğin tema ve "Ben" seçimin.
- Reklam, analiz ya da izleme kodu yoktur.

## Sık sorulanlar

**Bazı fotoğraflarda "Fotoğraf dışa aktarıma dahil edilmedi" yazıyor. Neden?**
WhatsApp o fotoğrafı zip'e koymamış. Bunun nedeni mesajı gönderen kişi değil, dışa aktarımı
yapan telefondur. Olası nedenler:
- Dışa aktarırken **Medya olmadan** seçilmiş olabilir.
- WhatsApp uzun sohbetlerde yalnızca **en son medyayı** ekler.
- Fotoğraf o telefona hiç indirilmemiş ya da sonradan silinmiş olabilir.

Eski fotoğrafları da görmek istiyorsan önce telefonda sohbeti açıp fotoğrafları indir, sonra
**Medyayı ekle** seçeneğiyle yeniden dışa aktar.

**Kendi mesajlarım neden solda görünüyor?**
Üstteki **Ben:** listesinden adını seç.

**Sesli mesajlar çalmıyor.**
Sesli mesajlar `.opus` biçimindedir. Chrome, Edge ve Firefox bunları çalar. Safari'de
çalmazsa kartın üzerindeki indirme düğmesini kullanabilirsin.

**Telefonda kullanabilir miyim?**
Evet. [Hemen kullan](https://nilayyldz.github.io/whatsapp-sohbet-goruntuleyici/) bağlantısını
telefonunun tarayıcısında aç ve zip dosyasını seç.

**Çok büyük bir sohbet açılmıyor.**
Birkaç GB'lık dışa aktarımlarda tarayıcının belleği yetmeyebilir. Bilgisayarda ve Chrome ya
da Edge ile denemeni öneririz.

## Sorun mu yaşadın?

Bir sohbet yanlış görünüyorsa [bir sorun kaydı (issue) aç](https://github.com/nilayyldz/whatsapp-sohbet-goruntuleyici/issues).
**Gerçek sohbetini ya da zip dosyanı paylaşma.** Sorunlu satırı, adları ve içeriği
değiştirerek yazman yeterli.

---

Geliştiriciler için: kurulum, mimari, testler ve katkı rehberi
[docs/GELISTIRME.md](docs/GELISTIRME.md) dosyasında.
