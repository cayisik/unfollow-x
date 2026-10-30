# Unfollow X — Pasif Hesap Denetimi Tasarımı

- Tarih: 2026-10-30
- Durum: Onaylandı
- Sürüm hedefi: 0.3.0
- Kapsam: Takip edilen hesaplar arasında son 30 günde gönderi/retweet/yanıt paylaşmamış hesapları bulan yeni "Pasif hesaplar" sekmesi.

## 1. Özet

Unfollow X şu anda takip edilenleri tarar, seni geri takip etmeyenleri listeler ve seçilenleri güvenli bir hızla takipten çıkarır. Bu tasarım, aynı takip listesi üzerinde ikinci bir denetim ekseni ekler: **son 30 gün içinde hiçbir gönderi, retweet veya yanıt paylaşmamış hesaplar**.

Özellik, mevcut sonuç ekranına iki sekmeli bir yapı ekler:

1. **Takip etmeyenler** — mevcut davranış, değişmeden.
2. **Pasif hesaplar** — yeni aktivite denetimi, ayrı liste, kendi ilerlemesi ve kendi takipten çıkarma akışı.

Aktivite taraması otomatik başlamaz. Kullanıcı pasif sekmedeki düğmeyle başlatır; tarama salt okunurdur, duraklatılabilir, iptal edilebilir ve 24 saatlik yerel cache ile tekrar kullanılabilir.

## 2. Hedefler

- Takip edilen tüm hesaplar için son gönderi zamanını güvenilir biçimde tespit etmek.
- Son 30 günden eski veya hiç gönderisi olmayan hesapları ayrı bir listede göstermek.
- Gönderi, retweet ve yanıtı aktivite saymak; beğeni veya yalnızca oturum açmayı aktivite saymamak.
- Veri okunamayan hesabı **pasif saymamak**; ayrı "kontrol edilemedi" bölümünde göstermek.
- 10.000 hesaba kadar ölçeklenebilmek; ilerleme, duraklatma, iptal ve kaldığı yerden devam desteği sunmak.
- X'in hız sınırlarını ve oturum korumalarını atlatmaya çalışmamak; 429/401/403 durumlarında durmak.
- TR/EN arayüz, klavye erişilebilir sekmeler ve mevcut denetim defteri görsel dilini korumak.
- Yalnızca yerel `localStorage` kullanmak; tweet metni, bio, çerez veya token saklamamak.

## 3. Kapsam dışı

- Beğeni, yer imi, DM veya yalnızca oturum açma aktivitesi kontrolü.
- Otomatik takipten çıkarma; pasif liste de açık onay olmadan işlem yapmaz.
- 24 saatten uzun aktivite geçmişi veya trend/grafik.
- Tweet içeriğini, medyayı veya etkileşim metriklerini saklamak.
- Üçüncü taraf API, sunucu, uzantı veya telemetri.
- Mobil düzeni yeniden tasarlamak.
- X'in kendi "son aktif" bilgisini (çevrimiçi durum) okumak; X böyle bir web API'si sunmuyor.

## 4. Kullanıcı akışı

1. Kullanıcı mevcut **Taramayı başlat** düğmesiyle takip listesini tarar.
2. Tarama bitince sonuç ekranı açılır. Üstte **Takip etmeyenler** ve **Pasif hesaplar** sekmeleri görünür.
3. Kullanıcı **Pasif hesaplar** sekmesine geçer. Henüz aktivite verisi yoksa kısa açıklama ve **Aktivite taramasını başlat** düğmesi görünür.
4. Tarama başlar: ilerleme çubuğu, kontrol edilen/toplam sayısı, şu anki hesap, bulunan pasif sayısı ve kaynak etiketi (`Toplu` / `Profil`) gösterilir. **Duraklat** ve **İptal** kullanılabilir.
5. Tarama biter: pasif hesaplar en eski son gönderiden yeniye sıralanır. Kullanıcı arayabilir, filtreleyebilir, seçebilir, kopyalayabilir, gizleyebilir veya takipten çıkarabilir.
6. Takipten çıkarma onayında, seçilenler arasında seni takip eden varsa açık uyarı gösterilir.
7. Kullanıcı isterse **Aktivite verilerini temizle** ile 24 saatlik yerel kayıtları siler.

## 5. Teknik tasarım

### 5.1 Durum modeli

`src/main.js` içindeki mevcut duruma şu alanlar eklenir:

```js
state.activeTab = "nonFollowers" | "inactive"; // varsayılan: "nonFollowers"
state.activityDays = 30;                       // 1-365, ayarlardan değiştirilebilir
state.activityEntries = {};                    // id/handle -> aktivite kaydı
state.activityScan = null;                     // yarım kalan tarama bilgisi
state.activity = {
  status: "idle" | "scanning" | "paused" | "done" | "error",
  checked: 0,
  total: 0,
  inactive: 0,
  unknown: 0,
  current: "",
  source: "lookup" | "graphql" | "",
  error: "",
  nextAt: 0,
  startedAt: 0
};
```

Kurallar:

- `state.mode` aktivite taraması sırasında `"results"` kalır; görünümü `state.activeTab` belirler.
- `state.active` (running/paused/cancelled/abort/wake) tarama ve takipten çıkarma arasında ortaktır. Aynı anda yalnızca bir iş çalışır; aktivite taraması sürerken takip taraması ve takipten çıkarma düğmeleri devre dışıdır.
- `state.selected` tek bir kümedir. Sekme değişince temizlenir; böylece bir sekmede seçilen hesap diğer sekmede yanlışlıkla işlenmez.
- `state.search` ve `state.filters` iki sekmede ortaktır.
- `state.activeTab` kalıcı değildir; yeniden yüklemede `"nonFollowers"` olur. `activityDays` kalıcıdır.
- Yeni takip taraması başlarken `activeTab` `"nonFollowers"` yapılır. `showLastScan` de aynısını yapar.
- Aktivite taraması başlarken `activeTab` `"inactive"` yapılır.
- Aktivite taraması sırasında sekme gizlenirse mevcut davranış gereği tarama duraklar.

### 5.2 Aktivite kaydı

Her hesap için tutulan kayıt:

```js
{
  id: "123",
  handle: "alice",
  state: "known" | "unknown",
  lastTweetAt: 1760000000000, // epoch ms; 0 = hiç gönderi yok; null = bilinmiyor
  reason: "",                 // unknown ise kısa neden kodu
  checkedAt: 1760000000000,
  source: "lookup" | "graphql"
}
```

- `state: "known"` ise `lastTweetAt` bir zaman damgası veya `0`'dır.
- `state: "unknown"` ise `lastTweetAt` `null`'dır ve `reason` şu kodlardan biridir: `not-found`, `no-id`, `unavailable`, `protected`, `template`, `parse`, `network`.
- Kayıt anahtarı önce `id`, yoksa küçük harfli `handle`'dır. Aynı hesap iki anahtarla tutulmaz; id sonradan bulunursa handle anahtarı id'ye taşınır.
- `state.activity.inactive` ve `state.activity.unknown` yalnızca ilerleme göstergesidir; liste sayaçları her zaman cache'teki kayıtlardan yeniden hesaplanır.
- Tweet metni, medya, bio, etkileşim sayısı veya çerez değeri saklanmaz.

### 5.3 Sınıflandırma

```js
cutoff = Date.now() - activityDays * 24 * 60 * 60 * 1000;

if (!entry || entry.state === "unknown") return "unknown";
if (entry.lastTweetAt === 0) return "inactive";      // hiç gönderi yok
if (entry.lastTweetAt <= cutoff) return "inactive";  // 30 gün veya daha eski
return "active";
```

- "Son 30 gün içinde" ifadesi katı yorumlanır: tam 30 gün önceki gönderi pasif sayılır.
- Eşik değiştiğinde cache'teki ham `lastTweetAt` yeniden sınıflandırılır; yeni istek gerekmez.
- `state: "unknown"` hiçbir zaman pasif sayılmaz.
- Gelecekteki zaman damgaları (saat kayması) aktif sayılır.

### 5.4 Adaylar ve tarama kapsamı

- Adaylar mevcut `state.users` içindeki, handle'ı olan tüm hesaplardır. Gizlenenler de dahildir.
- `checkedAt` son 24 saat içinde olan kayıtlar varsayılan olarak atlanır.
- Tüm adaylar tazeyse tarama başlatılmaz; "Aktivite verileri güncel" bildirimi gösterilir.
- Takip taraması kısmiyse aktivite taraması yalnızca o ana kadar taranan hesapları kontrol eder; arayüzde "kısmi liste" uyarısı kalır.
- Takip taraması doğrulanmamışsa aktivite taraması çalışabilir (salt okunur), ancak takipten çıkarma mevcut güvenlik kuralı gereği kapalı kalır.
- Takip listesi boşsa pasif sekme "Önce takip listeni tara" durumunu gösterir.

### 5.5 Birincil veri yolu: `users/lookup`

Endpoint:

```
GET /i/api/1.1/users/lookup.json
```

Parametreler:

- Kimliği olan hesaplar için `user_id=1,2,3,...` (10 adet).
- Kimliği olmayan hesaplar için `screen_name=alice,bob,...` (10 adet).
- `include_entities=true`.

İstek başlıkları mevcut `authHeaders` düzenini kullanır: bearer, `x-csrf-token`, `x-twitter-auth-type`, `x-twitter-active-user`, `x-twitter-client-language`; `credentials: "include"`.

Yanıt işleme:

- Yanıt bir dizi kullanıcı nesnesidir; `{ users: [...] }` şeklinde gelirse de açılır.
- Kullanıcı `id_str`/`screen_name` ile eşlenir.
- `status.created_at` varsa ve geçerli bir tarihse: `state: "known"`, `lastTweetAt = Date.parse(created_at)`.
- `status` yoksa ve `statuses_count === 0` ise: `state: "known"`, `lastTweetAt = 0` (hiç gönderi yok).
- `status` yoksa ve `statuses_count > 0` ise: hesap GraphQL yedeğine kuyruğa alınır.
- `status` yoksa ve `statuses_count` alanı da yoksa: hesap GraphQL yedeğine kuyruğa alınır.
- Kullanıcı yanıtta yoksa: `state: "unknown"`, `reason: "not-found"`.
- Tarih okunamıyorsa: GraphQL yedeğine kuyruğa alınır.
- Bir grupta istenen kullanıcıların hiçbiri dönmezse, uç nokta işlevsiz kabul edilir ve kalan hesaplar için GraphQL yedeğine geçilir.
- Yanıttan gelen `id`, daha önce kimliği olmayan kullanıcı kaydına işlenir.
- `status` alanı en son gönderiyi (gönderi, retweet veya yanıt) temsil eder; beğeni sayılmaz.

`users/lookup` desteklenmiyorsa (`400`, `403`, `404`, `405`, `410` veya beklenmeyen gövde) ölümcül hata sayılmaz; kalan hesaplar için GraphQL yedeğine geçilir ve arayüzde bir kez "Toplu kontrol kullanılamadı; hesap başına kontrole geçildi" bildirimi gösterilir. `403` burada "uç nokta izni yok" olarak yorumlanır; GraphQL yedeği de `403` dönerse tarama engellendi olarak durur.

### 5.6 Yedek veri yolu: `UserTweetsAndReplies`

- Yakalanmış `UserTweetsAndReplies` isteği varsa o kullanılır (query ID, features, fieldToggles, transaction ID dahil).
- Yakalanmamışsa bilinen yedek şablon denenir:
  - Query ID: `M9Tz6NGTHeRzqHOPdj9I7g` (2026-10 itibarıyla; değişebilir).
  - Değişkenler: `userId`, `count: 20`, `includePromotedContent: false`, `withCommunity: true`, `withVoice: true`, `withV2Timeline: true`.
  - Features: `src/config.js` içindeki web istemcisi feature set'i.
  - `fieldToggles`: yakalanmışsa kullanılır; yoksa `{ withArticlePlainText: false }`.
- Kimliği olmayan hesap GraphQL yedeğinde kontrol edilemez; `state: "unknown"`, `reason: "no-id"`.
- Yanıt ayrıştırma:
  - `timeline_v2` veya `timeline` altındaki instruction'lar yürünür.
  - `TweetWithVisibilityResults` sarmalayıcıları açılır.
  - Yalnızca hedef kullanıcının yazdığı gönderiler/yanıtlar ve hedef kullanıcının retweetlediği girişler sayılır; promote edilmiş veya başka kullanıcıya ait içerik yok sayılır.
  - Geçerli `legacy.created_at` değerlerinin en büyüğü `lastTweetAt` olur.
  - Kullanıcı timeline'ı geçerli ama hiç giriş yoksa: `lastTweetAt = 0` (hiç gönderi/yanıt yok).
  - Kullanıcı bulunamadı/suspended/erişilemez veya yanıt şekli tanınmıyorsa: `state: "unknown"`, uygun `reason`.
- İlk GraphQL isteği `400/404/410` veya format hatasıyla dönerse şablonun tamamı geçersiz kabul edilir; kalan hesaplar `unknown` (`reason: "template"`) olarak işaretlenir ve arayüzde "Bir profilin Yanıtlar sekmesini açıp tekrar dene" ipucu gösterilir. Tek tek hesaplara ait hatalar taramayı durdurmaz.
- `429`, `401`, `403`, ağ veya 5xx hataları taramayı durdurur; kısmi sonuçlar korunur.

### 5.7 Tarama döngüsü ve hız

- Toplu istek boyutu sabittir: **10 hesap**. Ayarlardan değiştirilmez.
- İstekler arasında mevcut `scanDelayMin` / `scanDelayMax` değerleri kullanılır (varsayılan 1,5–2,5 sn).
- Her 10 istekte bir mevcut `scanPauseEveryPages` / `scanPauseMs` değerleriyle uzun duraklama yapılır (varsayılan ~10 sn).
- Toplu modda bir istek 10 hesabı kapsar; GraphQL yedeğinde bir istek bir hesabı kapsar. Uzun duraklama sayacı her iki modda da istek sayısına göre işler.
- Her grup/5 hesap sonrası:
  - Sonuçlar bellekteki cache'e eklenir.
  - `localStorage`'a yazılır (başarısızsa tarama durmaz; arayüzde cache uyarısı gösterilir).
  - Arayüz en fazla ~500 ms'de bir güncellenir.
- `shouldPause` ve `shouldCancel` her istek öncesinde ve bekleme sırasında kontrol edilir. Duraklatma sırasında 500 ms'lik döngüyle beklenir; iptal `activeSleep`/`AbortController` ile uyanır.
- Tarama tamamlanınca `activityScan` temizlenir; iptal/hata/rate limit durumunda `checked`, `total`, `stopped` ve `savedAt` ile saklanır.
- Tahmini süre: 3.000 hesap, 10'lu toplu modda ~300 istek; 1,5–2,5 sn aralık ve 10 sn'lik duraklamalarla yaklaşık 15 dakika. GraphQL yedeğinde bu süre belirgin biçimde uzar; arayüz kaynak etiketiyle bunu gösterir.

### 5.8 Hata yönetimi

| Durum | Davranış |
| --- | --- |
| `users/lookup` desteklenmiyor | GraphQL yedeğine geç; bir kez bilgi bildirimi göster |
| `429` | Dur; `resetAt`/`retry-after` ile bekleme saatini göster; kısmi sonuçları sakla |
| `401` | Dur; "Oturum süresi doldu" mesajı |
| `403` (lookup) | Yedek yola geç; GraphQL de 403 ise "engellendi" olarak dur |
| `403` (GraphQL) | Dur; "X işlemi engelledi" mesajı |
| `5xx` / ağ | Mevcut artan beklemeli yeniden deneme; tükenirse dur |
| GraphQL şablonu geçersiz | Kalanları `unknown` yap; "Yanıtlar sekmesini aç" ipucu |
| Tek hesap erişilemez | O hesabı `unknown` yap; taramaya devam et |
| `localStorage` yazılamıyor | Taramaya devam et; cache uyarısı göster |

Kullanıcı tarafından iptal edilirse hata gösterilmez; kısmi sonuçlar ve "Devam et" durumu kalır.

### 5.9 Cache ve saklama

Anahtarlar:

- `ux_activity_v1` — aktivite kayıtları.
- `ux_activity_scan_v1` — yarım kalan tarama bilgisi.
- `ux_state_v1` — mevcut ayarlara `activityDays` eklenir.

`ux_activity_v1` şeması:

```js
{
  version: 1,
  viewerHandle: "me",
  savedAt: 1760000000000,
  entries: {
    "123": { id: "123", handle: "alice", state: "known", lastTweetAt: 1760000000000, reason: "", checkedAt: 1760000000000, source: "lookup" }
  }
}
```

Kurallar:

- TTL: **24 saat**. `checkedAt` 24 saatten eski kayıtlar yüklenirken ve kaydedilirken düşürülür. Bellekte kalan kayıtlar da okunurken tazelik kontrolünden geçer; 24 saati dolan kayıt pasif listesinde gösterilmez.
- Kayıtlar `viewerHandle` ile bağlıdır; görüntüleyen hesap değişirse eski kayıtlar kullanılmaz.
- Tamamlanan takip taramasında artık takip edilmeyen hesapların kayıtları budanır.
- Başarılı takipten çıkarmada ilgili kayıt hemen silinir.
- `activityScan` kaydı da 24 saat TTL'ye sahiptir ve görüntüleyen hesaba bağlıdır.
- Cache silme: pasif sekmedeki **Aktivite verilerini temizle** bağlantısı, onay penceresinden sonra iki anahtarı da siler ve bellek durumunu sıfırlar. Tarama sürerken bu bağlantı gösterilmez.
- `localStorage` yoksa veya kota dolarsa tarama bellekte devam eder; yeniden yüklemede devam desteği olmaz.

## 6. Arayüz

### 6.1 Sekmeler

- Sonuç görünümünün üstünde `role="tablist"` içinde iki `role="tab"` düğmesi:
  - **Takip etmeyenler** `(N)`
  - **Pasif hesaplar** `(N)`
- Sekme rozetleri filtrelenmemiş toplamları gösterir:
  - Takip etmeyenler: `followsViewer !== true` olan hesaplar.
  - Pasif: sınıflandırması `inactive` olan hesaplar.
- Pasif görünümdeki büyük sayaç ise aktif arama/filtrelerden geçen pasif hesap sayısını gösterir.
- Sekme değişince `state.selected` temizlenir, `state.activeTab` güncellenir ve görünüm yeniden çizilir.
- Klavye: düğmeler normal `button` semantiğiyle odaklanabilir; `aria-selected` doğru güncellenir.

### 6.2 Pasif görünüm durumları

**Henüz taranmadı**

- Başlık: "Pasif hesaplar"
- Açıklama: "Takip ettiğin hesaplardan son 30 günde gönderi, retweet veya yanıt paylaşmayanları bul."
- Düğme: **Aktivite taramasını başlat**
- Takip listesi yoksa düğme yerine "Önce takip listeni tara" mesajı.

**Taranıyor / duraklatıldı**

- İlerleme çubuğu: `checked / total`. `total`, bu çalıştırmada kontrol edilecek aday sayısıdır; cache'teki taze kayıtlar toplama dahil edilmez.
- Sayılar: bulunan pasif, kontrol edilemedi.
- Şu anki hesap: `Şu an: @handle`.
- Kaynak etiketi: `Toplu` veya `Profil`.
- Bekleme durumunda: "Sonraki istek: Ns" veya hız limiti saati.
- Düğmeler: **Duraklat/Devam et**, **İptal**.
- O ana kadar bulunan pasifler liste altında görünmeye devam eder.

**Bitti**

- Büyük sayaç: "N pasif hesap".
- Alt satır: "X / Y kontrol edildi · Z bilinmiyor · son kontrol: 5 dk önce".
- Arama, filtre çipleri, liste ve işlem çubuğu.
- Butonlar: **Yeniden tara** (eksik kayıtları kontrol eder; 24 saat dolduysa tümü yeniden kontrol edilir), **Temizle**.

**Kısmi / iptal**

- "X hesap kontrol edildi. Kalanlar için devam et." uyarısı.
- **Devam et** düğmesi; kalan adaylar cache'teki taze kayıtlar atlanarak kontrol edilir.

**Hata**

- Hata nedeni gösterilir; kısmi sonuçlar korunur.
- **Tekrar dene** ve **Geri** düğmeleri.

### 6.3 Satırlar

Her pasif satır:

- Avatar, isim, `@handle`.
- Rozetler: doğrulanmış, korumalı, **seni takip ediyor**, geri takip verisi bilinmiyorsa **bilinmiyor**.
- Son gönderi bilgisi: "Son gönderi: 47 gün önce" veya "Hiç gönderi yok".
- Seçim kutusu.
- Kopyala, gizle/göster, profili aç ikonları.

Sıralama:

1. Hiç gönderisi olmayanlar.
2. En eski `lastTweetAt` değerine sahip olanlar.
3. Eşitlikte alfabetik handle.

### 6.4 Kontrol edilemeyenler

- Pasif listesinin altında `<details>` benzeri katlanabilir **"Kontrol edilemedi (N)"** bölümü.
- Satırlarda avatar, isim, handle ve kısa neden etiketi bulunur.
- Seçim kutusu yoktur; bu hesaplar takipten çıkarılamaz.
- Neden etiketleri: "Erişilemedi", "Kimlik yok", "Sorgu başarısız", "Korumalı".

### 6.5 Takipten çıkarma

- Pasif sekmede de mevcut güvenli kuyruk, gecikmeler, üst sınır ve hız limiti durdurmaları kullanılır.
- Seçilenler arasında `followsViewer === true` olan varsa onay penceresinde ek uyarı:
  - "Seçilen N hesap seni takip ediyor. Yine de takipten çıkılsın mı?"
- Aşağıdaki durumlarda takipten çıkarma kapalıdır:
  - Tarama doğrulanmamışsa (`state.unverified`).
  - Seçilenlerden herhangi birinin `followsViewer` değeri `null`/`undefined` ise.
- Onay penceresi yıkıcı (`destructive`) stil kullanır; mevcut "geri alınamaz" uyarısı pasif listeye uyarlanır.
- Başarılı çıkarmada:
  - Hesap `state.users` içinden çıkarılır.
  - `state.selected` ve aktivite cache kaydı silinir.
  - Son tarama anlık görüntüsü güncellenir.
- Üst sınır aşılırsa mevcut `capNotice` davranışı geçerlidir.

### 6.6 Ayarlar ve temizleme

- Ayarlar penceresindeki "Tarama" grubuna **Pasif eşiği (gün)** alanı eklenir.
  - Varsayılan 30, minimum 1, maksimum 365.
  - Kaydetme mevcut `save-settings` akışıyla yapılır; `activityDays` `ux_state_v1` içinde saklanır.
- Pasif sekmede **Aktivite verilerini temizle** bağlantısı:
  - Onay başlığı: "Aktivite verileri silinsin mi?"
  - Gövde: "Son gönderi zamanları ve kontrol kayıtları bu cihazdan silinir."
  - Onayla: `ux_activity_v1` ve `ux_activity_scan_v1` silinir, bellek sıfırlanır, pasif görünüm "henüz taranmadı" durumuna döner.

### 6.7 Küçültülmüş panel

- Aktif sekme pasifse ve sonuç varsa: `pillResults` yerine **"{count} pasif"** gösterilir.
- Aktivite taraması sürerken: **"Aktivite taranıyor"**.
- Diğer durumlarda mevcut davranış korunur.

### 6.8 Dil metinleri

Tüm yeni metinler `src/config.js` içindeki `I18N.en` ve `I18N.tr` sözlüklerine eklenir. Başlıca anahtarlar:

| Anahtar | EN | TR |
| --- | --- | --- |
| `tabNonFollowers` | Non-followers | Takip etmeyenler |
| `tabInactive` | Inactive | Pasif hesaplar |
| `activityKicker` | Activity audit | Aktivite denetimi |
| `activityStart` | Start activity scan | Aktivite taramasını başlat |
| `activityScanning` | Checking activity… | Aktivite kontrol ediliyor… |
| `activityProgress` | {checked} / {total} checked | {checked} / {total} kontrol edildi |
| `activityCurrent` | Now: @{handle} | Şu an: @{handle} |
| `activityFound` | {count} inactive accounts | {count} pasif hesap |
| `activityFoundOne` | 1 inactive account | 1 pasif hesap |
| `activityNone` | No inactive accounts in this window | Bu aralıkta pasif hesap yok |
| `activityNever` | No posts yet | Hiç gönderi yok |
| `activityLastPost` | Last post: {time} | Son gönderi: {time} |
| `activityUnknown` | Could not check | Kontrol edilemedi |
| `activityUnknownCount` | {count} accounts could not be checked | {count} hesap kontrol edilemedi |
| `activityFresh` | Activity data is up to date | Aktivite verileri güncel |
| `activityNeedsScan` | Scan your following list first | Önce takip listeni tara |
| `activityClear` | Clear activity data | Aktivite verilerini temizle |
| `activityCleared` | Activity data cleared | Aktivite verileri temizlendi |
| `activityClearTitle` | Clear activity data? | Aktivite verileri silinsin mi? |
| `activityClearBody` | Last post times and check records will be removed from this device. | Son gönderi zamanları ve kontrol kayıtları bu cihazdan silinir. |
| `activityFallback` | Batch check unavailable; switching to profile checks | Toplu kontrol kullanılamadı; hesap başına kontrole geçildi |
| `activityGraphqlHint` | Open any profile's Replies tab once, then retry | Bir profilin Yanıtlar sekmesini açıp tekrar dene |
| `activityFollowsWarning` | {count} selected accounts follow you. Unfollow anyway? | Seçilen {count} hesap seni takip ediyor. Yine de takipten çıkılsın mı? |
| `activityUnfollowTitle` | Unfollow {count} inactive accounts? | {count} pasif hesaptan çıkılsın mı? |
| `activityUnfollowBody` | This cannot be undone. These accounts may follow you back. | Bu işlem geri alınamaz. Bu hesaplar seni takip ediyor olabilir. |
| `activityDays` | Inactive threshold (days) | Pasif eşiği (gün) |
| `activitySourceBatch` | Batch | Toplu |
| `activitySourceProfile` | Profile | Profil |
| `pillInactive` | {count} inactive | {count} pasif |
| `pillActivity` | Checking activity | Aktivite taranıyor |

## 7. Güvenlik ve gizlilik

- Tüm istekler x.com / twitter.com'a gider; telemetri, analitik veya üçüncü taraf uç noktası yoktur.
- Aktivite cache'i yalnızca yerel `localStorage`'da tutulur; tweet metni, bio, medya, çerez veya token saklanmaz.
- `ct0` ve `twid` yalnızca mevcut oturum doğrulaması için okunur; değerleri loglanmaz.
- Cache 24 saat sonra düşer; görüntüleyen hesaba bağlıdır; kullanıcı tek tıkla temizleyebilir.
- Aktivite taraması salt okunurdur; hiçbir hesap bu aşamada takipten çıkarılmaz.
- Hız limitleri, CAPTCHA, hesap kilidi veya diğer korumalar atlatılmaz.
- `users/lookup` ve GraphQL istekleri X'in kendi web oturumunun izin verdiği ölçüde yapılır; ayrı bir API anahtarı kullanılmaz.
- Yakalanan istek şablonları yalnızca bellekte yaşar; sayfa yenilenince atılır.

## 8. Kod yapısı ve dosya değişiklikleri

Yeni dosyalar:

- `src/activity.js` — saf ayrıştırıcılar ve `runActivityScan` döngüsü.
- `tests/activity.test.js` — birim ve akış testleri.
- `tests/fixtures/lookup.json` — `users/lookup` yanıt örneği.
- `tests/fixtures/user-tweets.json` — `UserTweetsAndReplies` yanıt örneği.
- `tests/fixtures/user-tweets-empty.json` — boş timeline örneği.

Değişecek dosyalar:

- `src/config.js` — `ACTIVITY_KEY`, `ACTIVITY_SCAN_KEY`, `ACTIVITY_TTL`, `ACTIVITY_BATCH_SIZE`, `ACTIVITY_DEFAULT_DAYS`, `ACTIVITY_QUERY_ID`, `ACTIVITY_FEATURES`, yeni i18n anahtarları, `VERSION = "0.3.0"`.
- `src/capture.js` — `UserTweetsAndReplies` yakalama; mevcut `Following` davranışı korunur. `getCapturedActivity()` eklenir; `uninstallCapture`/`resetCapture` iki şablonu da temizler.
- `src/storage.js` — `loadActivity`, `saveActivity`, `clearActivity`, `loadActivityScan`, `saveActivityScan`, `clearActivityScan`.
- `src/main.js` — yeni durum alanları, `startActivityScan`, `pauseActivity`, `resumeActivity`, `cancelActivity`, `clearActivity`, sekme/ayar/takipten çıkarma entegrasyonu, cache budama.
- `src/ui.js` — sekmeler, pasif görünüm, ilerleme, bilinmeyen bölümü, satır meta bilgisi, ayar alanı, temizleme onayı, pill etiketi, aktif görünüme göre `update` dağıtımı.
- `src/index.js` — yalnızca test kancası gerekiyorsa yeni saf fonksiyonları dışa açar; üretim davranışı değişmez.
- `README.md`, `README.tr.md` — özellik, hız sınırları, veri/gizlilik, sorun giderme, sürüm.
- `package.json`, `package-lock.json` — sürüm `0.3.0`.
- `unfollow-x.js` — `npm run build` ile yeniden üretilir.
- `tests/ui.test.js`, `tests/main.test.js`, `tests/storage.test.js`, `tests/capture.test.js`, `tests/config.test.js` — yeni davranış ve regresyon testleri.

## 9. Test planı

### Birim testleri

- `users/lookup` yanıtı:
  - `status.created_at` olan kullanıcı → known + doğru zaman.
  - `status` yok, `statuses_count = 0` → never (0).
  - `status` yok, `statuses_count > 0` → GraphQL kuyruğu.
  - Eksik kullanıcı → unknown/not-found.
  - Bozuk tarih → GraphQL kuyruğu.
  - `{ users: [...] }` sarmalayıcısı.
- `UserTweetsAndReplies` yanıtı:
  - Yeni gönderi, eski gönderi, retweet, yanıt, pinli eski gönderi + yeni gönderi.
  - Promoted/başka kullanıcı içeriği yok sayılır.
  - Boş timeline → 0.
  - `UserUnavailable`/suspended → unknown.
  - `TweetWithVisibilityResults` sarmalayıcısı.
- Sınıflandırma: tam 30 gün, 29 gün, 31 gün, 0, null, gelecek tarih.
- Cache tazeliği: 23 saat, 24 saat, 25 saat; viewer uyuşmazlığı; budama.

### Akış testleri

- 25 hesap → 3 `users/lookup` isteği (10/10/5), doğru sıra ve sonuçlar.
- `users/lookup` 404 → GraphQL yedeğine geçiş; sonuçlar unknown değil, known.
- Bir grupta 3 eksik `status` → yalnızca o 3 hesap için GraphQL isteği.
- 429 → durur, kısmi sonuçlar korunur, `stopped: "rate"`.
- 401 → durur, `stopped: "auth"`.
- Duraklat/devam ve iptal; iptalde kısmi sonuçlar.
- 24 saat içindeki kayıtlar atlanır; tümü tazeyse istek atılmaz.
- Cache yazımı başarısız olsa da tarama devam eder.

### Arayüz testleri

- Sekmeler, sayaçlar, `aria-selected`.
- Pasif görünümde başlangıç, tarama, bitti, hata, kısmi durumları.
- Satırda "Hiç gönderi yok" ve "Son gönderi: X gün önce".
- Bilinmeyen bölümünde seçim kutusu yok.
- Pasif sekmede takipten çıkarma onayı ve "seni takip ediyor" uyarısı.
- `activityDays` ayarının kaydı ve yeniden yüklenmesi.
- Temizleme onayı ve sıfırlanma.
- TR/EN metinleri.

### Entegrasyon testleri

- Takip taraması → pasif sekme → aktivite taraması → pasif sonuç → seçim → onay → takipten çıkarma.
- Pasif sekmede `followsViewer: true` olan hesap uyarıyla çıkarılabilir.
- `followsViewer: null` olan hesap seçilemez/engellenir.
- `state.unverified` true ise pasif takipten çıkarma kapalı.
- Başarılı çıkarmada kullanıcı ve cache kaydı silinir.

### Komutlar

- `npm test`
- `npm run build`
- `npm run check` (build + tüm testler)

Testler canlı X'e bağlanmaz; tüm API yanıtları fixture veya sahte `fetch` ile sağlanır.

## 10. Kabul kriterleri

- Son 30 günde gönderi/retweet/yanıtı olmayan hesaplar pasif listede; son 30 günde aktivitesi olanlar pasif değil.
- Hiç gönderisi olmayan hesap "Hiç gönderi yok" olarak pasif listede.
- Veri okunamayan hesap pasif sayılmıyor, "Kontrol edilemedi" bölümünde ve seçilemez.
- `users/lookup` çalışmazsa GraphQL yedeği devreye giriyor; o da çalışmazsa hesaplar unknown kalıyor.
- 10'lu bloklar, 1,5–2,5 sn gecikme, 10 istekte bir uzun duraklama uygulanıyor.
- 429/401/403 durumlarında tarama duruyor; kısmi sonuçlar korunuyor.
- Duraklat/devam/iptal çalışıyor; sayfa yenilendiğinde 24 saat içinde kaldığı yerden devam edilebiliyor.
- Cache 24 saat sonra düşüyor; temizleme düğmesi anında siliyor; görüntüleyen hesaba bağlı.
- Pasif sekmeden takipten çıkarma uyarıyla çalışıyor; doğrulanmamış taramada kapalı.
- TR/EN metinleri ve klavye erişilebilir sekmeler çalışıyor.
- `npm run check` temiz geçiyor; `unfollow-x.js` güncel.
- README ve README.tr.md yeni özelliği, sınırları ve veri saklamayı belgeliyor.

## 11. Riskler ve sınırlamalar

- **`users/lookup` kaldırılabilir.** Birincil yol desteklenmezse GraphQL yedeği devreye girer; süre uzar.
- **GraphQL query ID'leri değişebilir.** Yakalanmış şablon tercih edilir; yedek ID eskiyebilir. Bu durumda kullanıcıya Yanıtlar sekmesini açma ipucu gösterilir.
- **Hız sınırları.** 10'lu bloklar ve gecikmeler riski azaltır ama garanti etmez; 429'da durulur.
- **Zaman damgası anlamı.** X'in `status` alanı en son gönderiyi/retweeti/yanıtı verir; beğeni veya oturum açma aktivite sayılmaz. Bu, ürün tanımıyla uyumludur.
- **Büyük listeler.** 10.000 hesap için toplu modda bile uzun sürebilir; ilerleme, cache ve devam desteği vardır.
- **Korumalı/suspended hesaplar.** Erişilemeyen hesaplar unknown kalır; yanlış pasif sınıflandırma yapılmaz.
- **Saat kayması.** Gelecekteki tarihler aktif sayılır; geçersiz tarihler unknown/fallback olur.
- **`localStorage` kotası.** Cache yazılamazsa tarama bellekte devam eder; yeniden yüklemede devam desteği olmaz.
- **Tek aktif iş.** Aktivite taraması sürerken takip taraması veya takipten çıkarma başlatılamaz; kullanıcı önce iptal etmelidir.
- **Tarama sırasında sekme görünür olmalı.** Arka plan sekmesinde tarayıcı yavaşlatır; mevcut davranış gibi duraklar.

## 12. Uygulama sırası (özet)

1. `config.js` sabitleri ve i18n anahtarları.
2. `activity.js` saf ayrıştırıcılar + testleri.
3. `storage.js` aktivite cache'i + testleri.
4. `capture.js` `UserTweetsAndReplies` yakalama + testleri.
5. `runActivityScan` akışı + testleri (lookup, fallback, hız, iptal).
6. `main.js` durum ve orkestrasyon entegrasyonu.
7. `ui.js` sekmeler, pasif görünüm, ayarlar, takipten çıkarma uyarısı.
8. Entegrasyon testleri ve regresyon testleri.
9. README/README.tr.md, sürüm, build.
10. `npm run check` ve manuel duman testi.

## 13. Onay

Bu tasarım kullanıcı tarafından 2026-10-30 tarihinde bölüm bölüm onaylanmıştır:

- Bölüm 1: Veri akışı ve motor — onaylandı.
- Bölüm 2: Arayüz ve davranış — onaylandı.
- Bölüm 3: Veri saklama, güvenlik, kod yapısı ve testler — onaylandı.
