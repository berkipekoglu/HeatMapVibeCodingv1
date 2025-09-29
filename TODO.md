# TODO

- [x] **4.1. MVP (Minimum Viable Product) - Çekirdek Fonksiyonellik**

  - [x] Adım 1: Veri Toplama ve Depolama
  - [x] Adım 2: Temel Kullanıcı Yönetimi ve Panel
  - [x] Adım 3: İlk Isı Haritası Görselleştirmesi

- [ ] **4.2. Sürüm 1.0 - Gelişmiş Özellikler**
  - [ ] Adım 4: Gelişmiş Veri Toplama
    # TODO

- [x] **4.1. MVP (Minimum Viable Product) - Çekirdek Fonksiyonellik**

  - [x] Adım 1: Veri Toplama ve Depolama
  - [x] Adım 2: Temel Kullanıcı Yönetimi ve Panel
  - [x] Adım 3: İlk Isı Haritası Görselleştirmesi

- [ ] **4.2. Sürüm 1.0 - Gelişmiş Özellikler**
  - [ ] Adım 4: Gelişmiş Veri Toplama
    - [x] `tracker.js`'e `pageX`, `pageY`, `viewportWidth`, `viewportHeight` takibinin eklenmesi.
    - [x] Veritabanı şemasının yeni event türlerini destekleyecek şekilde güncellenmesi (`viewport_width`, `viewport_height`).
    - [x] `tracker.js`'e fare hareketi (mousemove) takibinin eklenmesi.
    - [ ] `tracker.js`'e kaydırma derinliği (scroll depth) takibinin eklenmesi.
  - [ ] Adım 5: Gelişmiş Raporlama ve Filtreleme
  - [x] Adım 6: Sayfa Üzerinde Gösterim (Sunucu Tarafı Ekran Görüntüsü Yaklaşımı ile tamamlandı)

---

### **Sürüm 1.1 - Analitik Derinliği ve Filtreleme (Toplantı Notları Detaylandırması)**

- [x] **Adım 7: Ziyaretçi Oturum (Session) Takibi ve Gruplama**
  - Amaç: Ziyaretçilerin etkileşimlerini tekil oturumlar altında toplayarak kullanıcı yolculuklarını analiz etme imkanı sunmak.
  - [x] **Veri Toplama (`tracker.js`):**
    - [x] Ziyaretçinin siteye ilk girişinde benzersiz bir `sessionId` oluştur (örn: UUID) ve bunu `sessionStorage`'da sakla.
    - [x] Her event (tıklama, hareket) ile birlikte bu `sessionId`'yi API'ye gönder.
  - [x] **Veritabanı (`schema.sql`):**
    - [x] `sessions` adında yeni bir tablo oluştur (`id`, `website_id`, `started_at`, `duration` vb.).
    - [x] `click_events` ve `mousemove_events` tablolarına `session_id` sütunu ekle ve `sessions` tablosuna referans ver (foreign key).
  - [x] **API (`/api/track`):**
    - [x] Gelen `sessionId`'yi kontrol et. Eğer veritabanında yoksa yeni bir oturum oluştur, varsa mevcut oturuma bağla.
  - [ ] **Ön Yüz (Dashboard):**
    - [ ] Belirli bir oturuma ait ısı haritasını izole bir şekilde görüntüleme özelliği.

- [x] **Adım 8: Gelişmiş Ziyaretçi Bilgileri (User Agent)**
  - Amaç: Ziyaretçilerin hangi cihaz, işletim sistemi ve tarayıcıdan geldiğini analiz ederek kitleyi daha iyi tanımak.
  - [x] **Veri Toplama (`tracker.js`):**
    - [x] `navigator.userAgent` bilgisini al ve her oturum başlangıcında API'ye gönder.
  - [x] **Veritabanı (`schema.sql`):**
    - [x] `sessions` tablosuna `user_agent`, `device_type`, `browser`, `os` gibi sütunlar ekle.
  - [x] **API (`/api/track`):**
    - [x] Gelen `userAgent` bilgisini ayrıştırarak (parsing) ilgili sütunlara kaydet.
  - [ ] **Ön Yüz (Dashboard):**
    - [ ] Isı haritası verilerini cihaza (mobil/desktop), tarayıcıya veya işletim sistemine göre filtreleme seçenekleri ekle.

- [x] **Adım 9: Sayfa (Route) Bazlı Isı Haritası Takibi**
  - Amaç: Sadece ana sayfa değil, web sitesinin tüm alt sayfaları (`/hakkimizda`, `/urunler/abc`) için ayrı ayrı ısı haritaları sunmak.
  - [x] **Veri Toplama (`tracker.js`):**
    - [x] Her event ile birlikte o anki sayfanın yolunu (`window.location.pathname`) yakala ve `page_route` olarak API'ye gönder.
  - [x] **Veritabanı (`schema.sql`):**
    - [x] `click_events` ve `mousemove_events` tablolarına `page_route` (VARCHAR) sütunu ekle.
  - [x] **Ön Yüz (Dashboard):**
    - [x] Isı haritası görüntüleme sayfasında, verisi olan tüm `page_route`'ları listeleyen bir dropdown menü ekle.
    - [x] Kullanıcı bir route seçtiğinde, sadece o route'a ait ısı haritasını ve ekran görüntüsünü göster.

- [x] **Adım 10: Gelişmiş Filtreleme ve Raporlama**
  - [x] **Tarihe Göre Filtreleme:**
    - [x] Isı haritası sayfasına başlangıç ve bitiş tarihi seçmek için bir takvim bileşeni (Date Range Picker) ekle.
    - [x] API endpoint'lerini (`/clicks`, `/moves`) bu tarih aralığına göre veri döndürecek şekilde güncelle.
  - [x] **Ekran Görüntüsü Yönetimi:**
    - [x] Ekran görüntüsü önbelleğini manuel olarak temizleyip yeniden oluşturmak için dashboard'a bir "Ekran Görüntüsünü Yenile" butonu ekle.
    - [ ] Arka planda, belirli aralıklarla (örn: günde bir) ekran görüntülerini otomatik olarak güncelleyen bir cron job kur (opsiyonel, ileri seviye).

### **Sürüm 2.0 - Performans ve Ek Analiz Araçları**

- [ ] **Adım 11: Web Performans Metrikleri (Monitoring)**
  - Amaç: Kullanıcılara sitelerinin teknik performansı hakkında temel bilgiler sunmak.
  - [ ] **Veri Toplama (`tracker.js`):**
    - [ ] `PerformanceObserver` API'si ile Core Web Vitals (LCP, FID, CLS) metriklerini topla.
    - [ ] `window.onerror` ile yakalanan JavaScript hatalarını (JS Errors) topla.
    - [ ] Bu verileri göndermek için yeni bir API endpoint'i (`/api/performance`) oluştur.
  - [ ] **Veritabanı (`schema.sql`):**
    - [ ] Performans metrikleri ve JS hataları için yeni tablolar oluştur.
  - [ ] **Ön Yüz (Dashboard):**
    - [ ] Web sitesi paneline, bu metriklerin ve hataların listelendiği yeni bir "Performans" sekmesi ekle.

    - [x] Veritabanı şemasının yeni event türlerini destekleyecek şekilde güncellenmesi (`viewport_width`, `viewport_height`).
    - [x] `tracker.js`'e fare hareketi (mousemove) takibinin eklenmesi.
    - [ ] `tracker.js`'e kaydırma derinliği (scroll depth) takibinin eklenmesi.
  - [ ] Adım 5: Gelişmiş Raporlama ve Filtreleme
  - [x] Adım 6: Sayfa Üzerinde Gösterim (Sunucu Tarafı Ekran Görüntüsü Yaklaşımı ile tamamlandı)

---

### **Sürüm 1.1 - Analitik Derinliği ve Filtreleme (Toplantı Notları Detaylandırması)**

- [ ] **Adım 7: Ziyaretçi Oturum (Session) Takibi ve Gruplama**
  - Amaç: Ziyaretçilerin etkileşimlerini tekil oturumlar altında toplayarak kullanıcı yolculuklarını analiz etme imkanı sunmak.
  - [ ] **Veri Toplama (`tracker.js`):**
    - [ ] Ziyaretçinin siteye ilk girişinde benzersiz bir `sessionId` oluştur (örn: UUID) ve bunu `sessionStorage`'da sakla.
    - [ ] Her event (tıklama, hareket) ile birlikte bu `sessionId`'yi API'ye gönder.
  - [ ] **Veritabanı (`schema.sql`):**
    - [ ] `sessions` adında yeni bir tablo oluştur (`id`, `website_id`, `started_at`, `duration` vb.).
    - [ ] `click_events` ve `mousemove_events` tablolarına `session_id` sütunu ekle ve `sessions` tablosuna referans ver (foreign key).
  - [ ] **API (`/api/track`):**
    - [ ] Gelen `sessionId`'yi kontrol et. Eğer veritabanında yoksa yeni bir oturum oluştur, varsa mevcut oturuma bağla.
  - [ ] **Ön Yüz (Dashboard):**
    - [ ] Belirli bir oturuma ait ısı haritasını izole bir şekilde görüntüleme özelliği.

- [ ] **Adım 8: Gelişmiş Ziyaretçi Bilgileri (User Agent)**
  - Amaç: Ziyaretçilerin hangi cihaz, işletim sistemi ve tarayıcıdan geldiğini analiz ederek kitleyi daha iyi tanımak.
  - [ ] **Veri Toplama (`tracker.js`):**
    - [ ] `navigator.userAgent` bilgisini al ve her oturum başlangıcında API'ye gönder.
  - [ ] **Veritabanı (`schema.sql`):**
    - [ ] `sessions` tablosuna `user_agent`, `device_type`, `browser`, `os` gibi sütunlar ekle.
  - [ ] **API (`/api/track`):**
    - [ ] Gelen `userAgent` bilgisini ayrıştırarak (parsing) ilgili sütunlara kaydet.
  - [ ] **Ön Yüz (Dashboard):**
    - [ ] Isı haritası verilerini cihaza (mobil/desktop), tarayıcıya veya işletim sistemine göre filtreleme seçenekleri ekle.

- [ ] **Adım 9: Sayfa (Route) Bazlı Isı Haritası Takibi**
  - Amaç: Sadece ana sayfa değil, web sitesinin tüm alt sayfaları (`/hakkimizda`, `/urunler/abc`) için ayrı ayrı ısı haritaları sunmak.
  - [ ] **Veri Toplama (`tracker.js`):**
    - [ ] Her event ile birlikte o anki sayfanın yolunu (`window.location.pathname`) yakala ve `page_route` olarak API'ye gönder.
  - [ ] **Veritabanı (`schema.sql`):**
    - [ ] `click_events` ve `mousemove_events` tablolarına `page_route` (VARCHAR) sütunu ekle.
  - [ ] **Ön Yüz (Dashboard):**
    - [ ] Isı haritası görüntüleme sayfasında, verisi olan tüm `page_route`'ları listeleyen bir dropdown menü ekle.
    - [ ] Kullanıcı bir route seçtiğinde, sadece o route'a ait ısı haritasını ve ekran görüntüsünü göster.

- [ ] **Adım 10: Gelişmiş Filtreleme ve Raporlama**
  - [ ] **Tarihe Göre Filtreleme:**
    - [ ] Isı haritası sayfasına başlangıç ve bitiş tarihi seçmek için bir takvim bileşeni (Date Range Picker) ekle.
    - [ ] API endpoint'lerini (`/clicks`, `/moves`) bu tarih aralığına göre veri döndürecek şekilde güncelle.
  - [ ] **Ekran Görüntüsü Yönetimi:**
    - [ ] Ekran görüntüsü önbelleğini manuel olarak temizleyip yeniden oluşturmak için dashboard'a bir "Ekran Görüntüsünü Yenile" butonu ekle.
    - [ ] Arka planda, belirli aralıklarla (örn: günde bir) ekran görüntülerini otomatik olarak güncelleyen bir cron job kur (opsiyonel, ileri seviye).

### **Sürüm 2.0 - Performans ve Ek Analiz Araçları**

- [ ] **Adım 11: Web Performans Metrikleri (Monitoring)**
  - Amaç: Kullanıcılara sitelerinin teknik performansı hakkında temel bilgiler sunmak.
  - [ ] **Veri Toplama (`tracker.js`):**
    - [ ] `PerformanceObserver` API'si ile Core Web Vitals (LCP, FID, CLS) metriklerini topla.
    - [ ] `window.onerror` ile yakalanan JavaScript hatalarını (JS Errors) topla.
    - [ ] Bu verileri göndermek için yeni bir API endpoint'i (`/api/performance`) oluştur.
  - [ ] **Veritabanı (`schema.sql`):**
    - [ ] Performans metrikleri ve JS hataları için yeni tablolar oluştur.
  - [ ] **Ön Yüz (Dashboard):**
    - [ ] Web sitesi paneline, bu metriklerin ve hataların listelendiği yeni bir "Performans" sekmesi ekle.