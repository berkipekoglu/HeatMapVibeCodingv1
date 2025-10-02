Mevcut ekran görüntüsü mekanizmamızın tam olarak nasıl çalıştığını ve kontrollerini analiz edip size raporluyorum.

Kısa Cevap:
Hayır, ekran görüntüleri her seferinde yeniden oluşturulmuyor. Akıllı bir önbellekleme (caching) ve asenkron (asynchronous) üretim sistemi
kullanıyoruz. Görüntü sadece ya hiç mevcut değilse ya da süresi dolmuşsa yeniden oluşturulur.

---

### Çalışma Prensibi ve Kontrol Akışı

Sistemimizin iki ana senaryosu vardır:

#### Senaryo 1: "Mutlu Son" - Ekran Görüntüsü Önbellekte Mevcut

Bu, bir kullanıcı aynı sayfanın (aynı ekran genişliğinde) ısı haritasını son 24 saat içinde daha önce ziyaret ettiyse gerçekleşen en yaygın ve en hızlı
senaryodur.

1.  İstek Başlangıcı: Isı haritası sayfası (ClickHeatmap.tsx) yüklenir ve bir <img> etiketi, src olarak /api/screenshot?url=... adresine bir istek
    gönderir.
    Bu, bir sayfanın ilk defa ziyaret edilmesi veya önbellek süresinin (24 saat) dolması durumunda gerçekleşir.

1.  İstek ve API Kontrolü: İlk adımlar aynıdır. /api/screenshot API'si Redis'i kontrol eder.

- Redis Önbelleği: Sistemin ana kontrol noktasıdır. Bir isteğin hızlı mı (önbellekten) yoksa yavaş mı (yeniden oluşturma) olacağını belirler.

#### Senaryo 2: "İlk Ziyaret" veya "Önbellek Boş" (Cache Miss)

Bu senaryo, bir sayfanın ısı haritası ilk defa görüntülendiğinde veya daha önce oluşturulmuş ekran görüntüsünün 24 saatlik önbellek süresi dolduğunda
tetiklenir. Bu, sistemin "ağır işi" yaptığı yerdir, ancak kullanıcı deneyimini minimumda etkileyecek şekilde tasarlanmıştır.

Adım Adım Akış:

##### A. Kullanıcının Gördükleri (Ön Yüz):

1.  İstek: Kullanıcı, ısı haritası sayfasına tıklar. Tarayıcı, /dashboard/websites/.../clicks adresini yüklemeye başlar.
2.  İşin Kuyruğa Atılması: Adım 3'te, /api/screenshot API'si, tarayıcıya yer tutucuya gitmesini söyledikten hemen sonra, asıl işi yapmak üzere Upstash
    QStash mesaj kuyruğuna bir "iş" (job) bırakır. Bu iş, { url, websiteId, viewportWidth } gibi bilgileri içerir.
3.  Başarılı Polling: Ön yüzdeki sorgulama döngüsü devam ederken, 3 saniye sonra atılan yeni /api/screenshot isteği, artık Adım 10'da kaydedilen veriyi
    Redis'te bulur.
    Bu asenkron yapı sayesinde, kullanıcı 10-20 saniye sürebilecek bir ekran görüntüsü oluşturma işlemi için boş bir sayfaya bakmak yerine, işlemin devam
    ettiğini belirten bir yer tutucu görür ve işlem bittiğinde arayüz kendini otomatik olarak günceller.
