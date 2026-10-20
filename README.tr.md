# Unfollow X

[English](README.md) | [Türkçe](README.tr.md)

x.com üzerinde takip ettiğin hesapları tarayan, seni geri takip etmeyenleri gösteren ve seçtiğin hesapları yüzen bir panelden, bilinçli olarak temkinli bir hızla takipten çıkaran, tek dosyalık ve konsola yapıştırılan bir araç.

Bu resmî olmayan bir topluluk aracıdır. X Corp. ile bağlantılı değildir. X'te işlemleri otomatikleştirmek Hizmet Koşulları'nı ihlal edebilir; hız sınırlarına, hesap incelemesine veya askıya alınmaya yol açabilir. Kullanım riski sana aittir; tercihen küçük ölçekte kullan.

---

## Neler yapar

- Kendi Takip Edilenler listeni X'in web oturumu üzerinden okur.
- Geri takip verilerini karşılaştırır ve `followed_by` bayrağı false olan hesapları listeler.
- Arama, filtreler, seçim, kopyalama, gizleme/gösterme, kontrol noktası/devam etme, son taramayı geri yükleme, TR/EN arayüz ve kalıcı ayarlar sunar.
- Yalnızca açık bir onaydan sonra takipten çıkarır; çalıştırma başına üst sınır, rastgele gecikmeler, uzun duraklamalar ve hız sınırı durdurmaları uygular.
- Tarama sırasında hesabını asla değiştirmez. Tarama salt okunurdur.

## Neler yapmaz

- Hesapları takip etmez, etkileşimi otomatikleştirmez veya hesabını büyütmez.
- Arka uç, uzantı, çalışma zamanında derleme adımı veya üçüncü taraf API kullanmaz.
- Başka bir kullanıcının takip listesini taramaz.
- Hız sınırlarını, CAPTCHA'ları, hesap kilitlerini veya diğer korumaları atlatmaz.
- Hesabının kısıtlanmayacağını garanti etmez.
- Verileri x.com dışında hiçbir yere göndermez.

---

## Gereksinimler

- DevTools bulunan bir masaüstü tarayıcı.
- `https://x.com` (veya `https://twitter.com`) üzerinde oturum açılmış olması.
- X'in CSRF koruması için kullandığı `ct0` çerezi.
- `twid` çerezi tercih edilir ancak isteğe bağlıdır. O olmadan da kullanıcı adı sorgusu ve DOM yedeği çalışabilir.

> **İncelemediğin kodu yapıştırma.** Script, X oturumunla çalışır. Bilinmeyen bir fork yerine bu repodaki kopyayı kullan.

---

## Hızlı başlangıç

1. Tarayıcında `https://x.com` adresine giriş yap.
2. Herhangi bir x.com sayfası aç, örneğin `https://x.com/home`.
3. DevTools'u aç (`F12` veya macOS'te `Cmd+Option+I`) ve **Console** sekmesini seç.
4. Chrome/Edge yapıştırmayı "Don't paste code" uyarısıyla engellerse `allow pasting` yaz ve Enter'a bas. Bu uyarı bir tarayıcı güvenlik önlemidir; yalnızca koda güveniyorsan bunu yap.
5. `unfollow-x.js` dosyasını aç, tamamını seç, kopyala, Console'a yapıştır ve Enter'a bas.
6. Unfollow X paneli açılır. **Taramayı başlat** düğmesine tıkla.

Panel görünmezse x.com üzerinde olduğunu kontrol et ve Console'da hata olup olmadığına bak.

## Panel davranışı

- Panel X'in açık/koyu temasını otomatik izler ve X'in yüksek kontrast ile azaltılmış hareket ayarlarını da yansıtır. Ayrı bir tema anahtarı yoktur.
- Paneli başlığından sürükle. Tutamaç klavye odağına alınabilir: ok tuşları 8px (`Shift` 32px) taşır, `Home` sağ üst köşeye sıfırlar.
- Konum hatırlanır. Panel görünüm alanına sınırlanır ve yeniden boyutlandırma tutamacı yoktur.
- Görsel dil bir denetim defteridir: çizgili satırlar, tek bir öne çıkan sayı ve başarılı takipten çıkarmalarda üstü çizili "çıktı" damgası.

---

## Panel akışı

### 1. Boşta

- **Taramayı başlat** yeni bir tarama başlatır.
- **Önceki taramaya devam et**, algılanan kullanıcı adı için bir kontrol noktası olduğunda görünür.
- **Son taramayı göster**, son 24 saat içindeki kayıtlı bir tarama olduğunda görünür.
- Görüntüleyen kullanıcı adı algılanamazsa panel manuel olarak sorar. `@kullanıcıadı`, `kullanıcıadı` veya tam profil URL'si girebilirsin.

### 2. Tarama

- Geçerli adımı, ilerlemeyi, kaynağı (`API` veya `DOM`) ve onaylanmış takip etmeyenlerin canlı listesini gösterir.
- **Duraklat/Devam et** ve **İptal** kullanılabilir.
- Bazı satırlarda geri takip verisi bilinmiyorsa tarama **doğrulanmamış** olarak işaretlenir ve takipten çıkarma kapalı kalır.
- Kısmi taramalar 24 saat içinde ve aynı kullanıcı adı için daha sonra devam ettirilebilir.

### 3. Sonuçlar

- İsim veya kullanıcı adına göre arama.
- Filtre çipleri: doğrulanmış, korumalı, avatarsız, gizlenenleri göster.
- Tek tek satırları seç, görünen tüm satırları seç veya seçimi temizle.
- Tek bir kullanıcı adını veya görünen tüm kullanıcı adlarını kopyala.
- Taramayı silmeden hesapları gizle/göster.
- **Takipten çık** düğmesi, tam sayıyı gösteren bir onay penceresi açar.

### 4. Takipten çıkarma

- Hedefleri rastgele bir gecikmeyle tek tek işler.
- İlerlemeyi, geçerli kullanıcı adını, başarı/hata sayılarını ve sonraki işlem geri sayımını gösterir.
- **Duraklat/Devam et** ve **İptal** kullanılabilir.
- Hız sınırı, engelleme veya oturum hatalarında durur ve ilerlemeyi korur.
- Otomatik olarak yeniden başlamaz.

### 5. Bitti / Hata

- Bitti, kaç hesabın takipten çıkarıldığını, kaçının başarısız olduğunu ve kaçının kaldığını gösterir.
- Hata, nedeni gösterir ve mantıklı olduğunda yeniden deneme/devam etme seçeneği sunar.
- Paneli kapatmak arayüzünü ve istek kancalarını kaldırır. Yeniden açmak için script'i tekrar yapıştır.

---

## Tarama nasıl çalışır?

Script, sabit kodlanmış uç noktalar yerine X'in kendi web isteklerini tercih eder:

1. **Yakalama.** `fetch` ve `XMLHttpRequest` kancalar; X'in yaptığı bir sonraki aynı kaynaklı GraphQL `Following` / `followingQuery` isteğini kaydeder. Takip Edilenler sayfana geldikten sonra X'in bir sayfa istemesi için bir kez kaydırır.
2. **Yeniden oynatma.** Yakalanan istek şeklini sayfalama imlecin, sayfa boyutun ve görüntüleyen kimliğinle yeniden oynatır ve yanıt boyunca sayfalar.
3. **Yedek şablonlar.** Hiçbir istek yakalanamazsa bilinen eski `Following` sorgusunu ve 2026 `followingQuery` şeklini dener.
4. **DOM yedeği.** Her iki API yolu da başarısız olursa Takip Edilenler sayfasını kaydırır ve kullanıcı satırlarını DOM'dan ayrıştırır.

Yakalanan istek şablonları **kalıcı olarak saklanmaz**. Sayfa yenilendikten sonra script yeniden yakalar veya yedek yolları kullanır. Kontrol noktaları ve son taramalar 24 saat boyunca saklanır.

Yalnızca `followsViewer === false` olan hesaplar takip etmeyen olarak kabul edilir. Geri takip bayrağı eksikse veya güvenilir değilse tarama doğrulanmamış olarak işaretlenir ve takipten çıkarma engellenir. Bu bilinçli bir tercihtir: araç, eksik veriye dayanarak takipten çıkarmak yerine uyarı göstermeyi tercih eder.

---

## Güvenlik ve hız

### Tarama sınırları

- Sayfa gecikmesi: rastgele 1,5–2,5 saniye.
- Her 10 sayfada uzun duraklama: yaklaşık 10 saniye.
- İstek başına kullanıcı: varsayılan 50.
- Kesin durma: 10.000 kullanıcı veya 400 sayfa, hangisi önce gelirse.
- `429`: dur ve sıfırlama zamanına kadar bekle (varsayılan 15 dakika).
- `401`/`403`: oturum/engelleme mesajıyla dur.
- Ağ/5xx: artan beklemeyle yeniden dene, sonra devam ettirilebilir bir hatayla dur.

### Takipten çıkarma sınırları

- Varsayılan üst sınır: **çalıştırma başına 190 takipten çıkarma**. Ayarlar 1–400 arasına izin verir.
- Gecikme: işlemler arasında rastgele **12–20 saniye**.
- Uzun duraklama: **her 25 işlemde 5 dakika**.
- Üst sınırdan fazlasını seçersen o çalıştırmada yalnızca üst sınır işlenir. Geri kalanlar seçili kalır ve kalan olarak bildirilir.
- Herhangi bir değişiklik yapılmadan önce tam sayıyı gösteren bir onay penceresi açılır.
- Takipten çıkarma yöntemlerinin sırası:
  1. Sayısal kullanıcı kimliği mevcutsa `unfollowUserMutation` GraphQL mutasyonu.
  2. Kullanıcı adıyla da çalışan `friendships/destroy.json` REST uç noktası.
  3. Son çare olarak DOM'a tıklama.
- `401`, `403` ve `429` çalıştırmayı durdurur. Bunlar taşıma hatası değil, oturum/hesap koşulları olarak değerlendirilir.

### Doğrulanmamış taramalar

Takipten çıkarma şu durumlarda kapalıdır:

- ayrıştırılan hiçbir kullanıcının boolean geri takip değeri yoksa veya
- seçilen kullanıcılardan herhangi birinin geri takip değeri bilinmiyorsa.

Takip Edilenler sayfasında, İngilizce veya Türkçe olarak, sekme görünürken yeniden tara. API yolu genellikle en güvenilir kapsamı sağlar.

---

## Veri ve gizlilik

- Tüm istekler x.com / twitter.com adreslerine gider. Telemetri, analitik veya üçüncü taraf uç noktası yoktur.
- Script çerezlerinden `ct0` ve mevcutsa `twid` okur. Çerez değerlerini, CSRF tokenlarını veya diğer sırları günlüğe yazmaz.
- Ayarlar, kontrol noktaları ve son taramalar `localStorage` içinde `ux_state_v1`, `ux_scan_v1` ve `ux_last_scan_v1` anahtarlarıyla saklanır.
- Kontrol noktaları ve son taramalar 24 saat sonra sona erer ve algılanan kullanıcı adı değişirse yok sayılır.
- Yakalanan GraphQL şablonu yalnızca bellekte yaşar ve sayfa yenilendiğinde veya kapatıldığında atılır.
- Paneli kapatmak olay dinleyicilerini kaldırır ve yamalanmış `fetch` / `XMLHttpRequest` yöntemlerini geri yükler.

---

## Sorun giderme

### Tarayıcı "Don't paste code into the DevTools Console" diyor

Chrome ve Edge, Console'a `allow pasting` yazana kadar yapıştırmayı engeller. Bunu yalnızca script'i inceledikten sonra yap. Firefox ve Safari benzer bir uyarı gösterebilir.

### Panel görünmüyor

- Adres çubuğunun `x.com` veya `twitter.com` dediğini doğrula.
- Console'u aç ve hataları kontrol et.
- Sayfayı yenile ve script'i tekrar yapıştır.
- Çok eski bir kopya zaten çalışıyorsa yeni bir kopya yapıştırmak onu temizlemelidir; temizlemezse önce sayfayı yenile.

### `ct0` çerezi bulunamadı

Tam oturum açmamışsın veya çerez henüz mevcut değil. Giriş yap, x.com'u yenile ve tekrar yapıştır.

### "Takip ettiğin sayfası açamadım"

- Manuel olarak `https://x.com/<kullanıcıadın>/following` adresine git.
- Panelde tekrar dene'ye tıkla veya script'i tekrar yapıştır.
- Başka bir kullanıcının profilinde olmadığından emin ol. Script kullanıcı adını önce yan gezinme profil bağlantısından, sonra URL'den, sonra manuel girişten çözer.

### "Doğrulanmamış sonuçlar" / takipten çıkarma kapalı

Bazı satırlar güvenilir bir geri takip bayrağı sunmadı. Bu şu durumlarda olabilir:

- X yanıt şeklini değiştirdi.
- DOM dili ne İngilizce ne Türkçe ve bilinen bir "Follows you" etiketi bulunamadı.
- Bir sayfa kısmen yüklendi veya oturum sona erdi.

Takip Edilenler sekmesi açık ve görünürken yeniden tara. Uyarı devam ederse atlatmaya çalışma.

### "Takip etmeyen bulunamadı"

Doğru olabilir: taranan listedeki herkes seni geri takip ediyor veya liste çok küçük. Birkaç profili açıp doğrula. Takip Edilenler sayfasından yeni bir tarama da deneyebilirsin.

### Sorgu kimliği / biçim hataları veya API yolu başarısız

X, GraphQL sorgu kimliklerini, özellik bayraklarını ve işlem kimliği gereksinimlerini haber vermeden döndürür. Script önce yerleşik şablonlara, sonra DOM taramasına geçer. Tarama sırasında sekmeyi görünür tut. Tüm yollar başarısız olursa X büyük olasılıkla ön yüzünü değiştirmiştir; `src/dom.js` içindeki DOM seçicilerinin güncellenmesi gerekebilir.

### `x-client-transaction-id` reddedildi

Script bir işlem kimliğini yalnızca X'ten yakaladıysa kopyalar. X isteği reddederse API yolu DOM yedeğine düşer. Sayfayı yenile, Takip Edilenler sayfasını ziyaret et ve yeniden taramadan önce X'in kendi isteğini yapmasına izin ver.

### DOM taraması hiçbir şey bulamıyor

X'in işaretlemesi değişmiş olabilir. Takip Edilenler sayfasını yenile, satırların oluşmasını bekle ve tekrar dene. Hâlâ hiçbir şey bulamıyorsa DOM ayrıştırıcısının güncellenmesi gerekir.

### Tarama veya takipten çıkarma arka plan sekmesinde duraklıyor

Tarayıcılar arka plan sekmelerini yavaşlatır. Sayfa gizlendiğinde script duraklar ve senin devam etmeni bekler. Çalıştırma sırasında x.com sekmesini görünür tut.

### Hız sınırı / engellendi

Gösterilen bekleme süresini bekle. Tekrarlanan denemeler kısıtlamayı kötüleştirebilir. Tekrar denemeden önce Ayarlar'da üst sınırı düşür ve gecikmeleri artır. Script hız sınırını asla atlatmaz.

### Bir takipten çıkarma başarısız oluyor

- UI yedeği için satır artık görünür olmayabilir. Takip Edilenler sayfasını açık tut ve hedefi görünüm alanına kaydır.
- Oturum sona ermiş olabilir.
- X işlemi hız sınırlıyor veya engelliyor olabilir.
- Hesap başka bir cihazdan zaten takipten çıkarılmış olabilir.

Yeniden denemeden önce hata nedenini ve bekleme bildirimini kontrol et.

### Devam etme veya son tarama eksik

Kontrol noktaları ve son taramalar 24 saat sonra sona erer ve algılanan kullanıcı adına bağlıdır. Hesap değiştirdiysen veya kullanıcı adı algılama değiştiyse eski veriler bilinçli olarak yok sayılır.

---

## Geliştirme

Teslim edilebilir dosya, `src/` altındaki ES modüllerinden üretilir ve esbuild tarafından tek bir IIFE olarak paketlenir. Geliştirme araç zinciri Node.js 20 veya daha yenisini gerektirir.

```bash
npm install
npm test          # node:test + jsdom
npm run build     # ./unfollow-x.js dosyasını yazar
npm run check     # derleme + tam test paketi
```

Faydalı ayrıntılar:

- `src/index.js` paket giriş noktasıdır. x.com host korumasını uygular ve testler için `globalThis.__UX_TEST__` açar.
- `src/main.js` başlatma, gezinme, tarama/takipten çıkarma düzenlemesi, kalıcılık ve temizliği içerir.
- `src/api.js` GraphQL taramalarını oluşturur ve sayfalar.
- `src/dom.js` satırları ayrıştırır ve DOM yedeğini sağlar.
- `src/unfollow.js` mutasyon → REST → UI taşıma zincirini uygular.
- `src/ui.js` paneli, görünümleri, iletişim kutularını, stilleri ve etkileşimleri içerir.
- `src/theme.js` X'in tema ve erişilebilirlik bayraklarını okur ve değişiklikleri izler.
- `tests/` URL/yanıt ayrıştırma, DOM ayrıştırma, UI, hız, taşıma ve jsdom başlatma → tarama → takipten çıkarma akışını kapsar.

`unfollow-x.js` dosyasını elle düzenleme. `src/` içinde değişiklik yap ve `npm run build` çalıştır.

Otomatik test paketi gerçek tarayıcı testinin yerini tutmaz. X'in canlı ön yüzü, çerezleri ve hız sınırları jsdom ile tam olarak simüle edilemez.

---

## Manuel doğrulama kontrol listesi

Bir derlemeyi yayına hazır saymadan önce bunu giriş yapılmış bir x.com oturumunda çalıştır. Bu kontroller sürüm açısından kritik akışları kapsar:

- [ ] Ana sayfada yapıştır; panel açılır ve Takip Edilenler sayfasına gider.
- [ ] Küçük bir hesabı tara (20'den az takip); DOM yedeği veya API yolu tamamlanır.
- [ ] Daha büyük bir hesabı tara; ilerleme toplamı profil sayısıyla eşleşir.
- [ ] Tarama ortasında duraklat/devam et/iptal et; yeniden yapıştırdıktan sonra bir kontrol noktası görünür.
- [ ] Filtreleri, aramayı, tümünü seç'i ve kopyalamayı test et.
- [ ] Bir hesabı takipten çıkar; satırın kaybolduğunu ve sayının güncellendiğini doğrula.
- [ ] Bir `429` simüle et (isteğe bağlı DevTools engeli) ve geri sayımı doğrula.
- [ ] TR/EN arasında geçiş yap; sayfayı yenile ve dilin korunduğunu doğrula.
- [ ] X'i açık ve koyu arasında değiştir; panel geçerli çalıştırmayı kaybetmeden izler.
- [ ] X yüksek kontrast ve azaltılmış hareketi etkinleştir; kenarlıklar, odak halkaları ve animasyon davranışı buna göre değişir.
- [ ] Başlıktan sürükle, klavyeyle hareket ettir, `Home` tuşuna bas, pencereyi yeniden boyutlandır ve yeniden yapıştır; panel görünür kalır.
- [ ] Başarılı bir takipten çıkarma satırı üstü çizili/"çıktı" damgasını alır; başarısız olan almaz.

Ayrıca şunları doğrula:

- [ ] Panel sürüklenebilir ve küçültülebilir; konumu sayfa yenilendikten sonra korunur.
- [ ] Paneli kapatmak `fetch` / `XMLHttpRequest` yöntemlerini geri yükler ve arayüzü kaldırır.
- [ ] Kısmi veya doğrulanmamış bir tarama takipten çıkarmayı başlatamaz.
- [ ] İkinci bir yapıştırma, yinelenen kancalar bırakmak yerine önceki paneli temizler.

---

## Bilinen sınırlamalar

- X'in ön yüzü derlenmiş bir SPA'dır; sorgu kimlikleri, özellik bayrakları, yanıt şekilleri ve seçiciler her an değişebilir.
- Normal akış, X'in gerçekten yaptığı bir isteği yakalamaya bağlıdır. Yakalama olmadan yedek sorgu kimlikleri eski olabilir.
- DOM taraması dil sezgilerine ve genel satır yapısına dayanır; bilinçli olarak temkinlidir ve bir taramayı doğrulanmamış olarak işaretleyebilir.
- Yeniden yüklemeden sonra devam etmek, yakalanan sayfalama imleci yedek şablonla yeniden kullanılamıyorsa baştan tarayabilir. Birleştirme yinelenenleri ayıklar, bu yüzden daha yavaş ama güvenlidir.
- Araç masaüstü odaklıdır. Mobil düzenler ve olağandışı X denemeleri garanti edilmez.
- Toplu otomasyon doğası gereği risklidir. Varsayılanlar temkinlidir, garanti değildir.

---

## Lisans

MIT. Bkz. [LICENSE](LICENSE).
