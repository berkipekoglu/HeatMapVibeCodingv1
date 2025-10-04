# Geliştirme Planı: Kapsamlı Dashboard Filtreleme

## 1. Amaç

Bu geliştirmenin amacı, hem ana dashboard sayfasını hem de ısı haritası detay sayfalarını interaktif hale getirmektir. Kullanıcıların, topladığımız zengin veriyi (tarih, sayfa, cihaz, tarayıcı, işletim sistemi) kullanarak istedikleri kırılımlarda analiz yapabilmelerini sağlamak hedeflenmektedir. Filtreleme deneyimi, tüm platformda tutarlı ve merkezi bir şekilde yönetilecektir.

---

## 2. Analiz ve Mevcut Durum

- **Veri Toplanıyor:** Oturum, User Agent (cihaz, OS, tarayıcı) ve sayfa (URL) verileri başarılı bir şekilde toplanıp veritabanına kaydediliyor.
- **Filtreler Lokalize:** Isı haritası sayfalarındaki filtreler kendi içlerinde çalışıyor ancak ana dashboard ile bir bağlantıları yok.
- **İstatistikler Statik:** Ana dashboard'daki grafikler (`/api/.../stats` endpoint'i), herhangi bir filtre kabul etmiyor ve her zaman tüm verinin özetini gösteriyor.
- **Boşluk:** Merkezi bir filtreleme durumu (state) ve bu filtrelere göre istatistikleri güncelleyen bir API altyapısı eksik.

---

## 3. Uygulama Adımları

### **Adım 1: Backend - İstatistik API'sini Filtrelenebilir Hale Getirme**

- **Görev:** `/api/websites/[websiteId]/stats/route.ts` endpoint'ini, query parametreleri üzerinden filtre kabul edecek şekilde güncellemek.
- **Detaylar:**
  - Endpoint, `startDate`, `endDate`, `pageUrl`, `device`, `browser`, `os` gibi query parametrelerini okuyacak.
  - İçerisindeki tüm SQL sorguları (clicksOverTime, browserStats, osStats, deviceStats), gelen bu parametrelere göre dinamik `WHERE` koşulları içerecek şekilde yeniden yazılacak.
  - Örneğin, `device=mobile` parametresi geldiyse, tüm istatistik sorguları sadece `device = 'mobile'` olan oturumları dikkate alacak.

### **Adım 2: Frontend - Merkezi Filtre Yönetimi (`DashboardClient.tsx`)**

- **Görev:** Tüm filtre durumlarını, en üst seviye bileşen olan `DashboardClient.tsx` içerisinde merkezi olarak yönetmek.
- **Detaylar:**
  - `DashboardClient` içine, tüm filtreler için `useState` hook'ları eklenecek: `selectedWebsite`, `dateRange`, `selectedPage`, `selectedDevice` vb.
  - Ana dashboard'da hangi web sitesinin istatistiklerinin gösterileceğini seçmek için bir "Web Sitesi Seç" dropdown menüsü eklenecek.

### **Adım 3: Frontend - Birleşik Filtre Bileşeni Oluşturma**

- **Görev:** Tüm filtre dropdown'larını ve tarih seçiciyi içeren, yeniden kullanılabilir bir `DashboardFilters` bileşeni oluşturmak.
- **Detaylar:**
  - Bu bileşen, `DashboardClient`'tan mevcut filtre değerlerini ve bu değerleri değiştirecek fonksiyonları (`onFilterChange` gibi) props olarak alacak.
  - Bu bileşen, ana dashboard sayfasının üst kısmında yer alacak.

### **Adım 4: Frontend - Veri Akışını ve Grafikleri Etkileşimli Hale Getirme**

- **Görev:** Filtrelerde yapılan bir değişikliğin, dashboard'daki grafikleri anında güncellemesini sağlamak.
- **Detaylar:**
  - `DashboardClient` içinde, filtre state'lerini dinleyen bir `useEffect` hook'u oluşturulacak.
  - Bu `useEffect`, filtrelerden herhangi biri değiştiğinde, güncel filtre parametreleriyle birlikte Adım 1'de güncellenen `/api/.../stats` endpoint'ine yeni bir istek atacak.
  - API'den dönen yeni istatistik verileri, `stats` state'ine yazılacak ve bu sayede `recharts` grafikleri otomatik olarak yeniden render edilecek.

### **Adım 5: Frontend - Filtre Durumunu Isı Haritası Sayfalarına Taşıma**

- **Görev:** Kullanıcı bir ısı haritası detay sayfasına gittiğinde, dashboard'da seçili olan filtrelerin o sayfaya otomatik olarak uygulanmasını sağlamak.
- **Detaylar:**
  - `DashboardClient`'taki "Click Map" / "Move Map" butonlarının `Link` bileşenleri, mevcut filtre durumunu query parametreleri olarak URL'e ekleyecek şekilde güncellenecek.
    - Örnek: `/dashboard/websites/123/clicks?page=...&device=mobile&os=Windows`
  - Isı haritası sayfaları (`ClickHeatmap.tsx`, `MoveHeatmap.tsx`), sayfa yüklendiğinde bu query parametrelerini okuyacak ve kendi filtre state'lerini bu değerlerle **başlatacak**.
