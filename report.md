feat(analytics): Add advanced filtering, site health monitoring & session tracking

### Tamamlanan Geliştirmeler ve Özellikler Raporu

Bu geliştirme döngüsünde, uygulamanın analitik yeteneklerini ve kullanıcı arayüzünü temelden
iyileştiren bir dizi kritik özellik ekledik.

1. Gelişmiş Veri Toplama ve Analiz Altyapısı:

- Ziyaretçi Oturum (Session) Takibi:
- Detaylı Ziyaretçi Bilgileri (User Agent):
- Sayfa (Route) Bazlı Filtreleme:
- Cihaz, Tarayıcı ve İşletim Sistemi Filtreleri:
- Esnek URL Eşleştirme:

3. "Site Sağlığı" ve Performans İzleme (Monitoring) Özelliği (Adım 11):

- Veri Toplama:

4. Hata Ayıklama ve Kararlılık İyileştirmeleri:

- reset-db betiğindeki, veritabanını sıfırlarken hata veren sorun giderildi.
  Özetle, uygulama artık sadece bir ısı haritası aracı olmaktan çıkıp, temel düzeyde oturum takibi,
  kitle segmentasyonu ve performans izleme yeteneklerine sahip, çok daha kapsamlı bir analitik
  platformu haline geldi.

5. Veritabanı Şeması

- Veritabanı şeması; sessions, performance_metrics ve js_errors tablolarını içerecek şekilde genişletildi.
