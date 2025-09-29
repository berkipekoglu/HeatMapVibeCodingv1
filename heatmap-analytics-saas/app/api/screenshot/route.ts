import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Client } from '@upstash/qstash';

// Redis ve QStash istemcilerini başlat
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const websiteId = searchParams.get('websiteId');
  const widthQuery = searchParams.get('w');

  if (!url || !websiteId) {
    return NextResponse.json({ error: 'URL and websiteId parameters are required' }, { status: 400 });
  }

  const viewportWidth = widthQuery ? parseInt(widthQuery, 10) : 1280;
  if (isNaN(viewportWidth) || viewportWidth <= 0) {
    return NextResponse.json({ error: 'Invalid width parameter' }, { status: 400 });
  }

  try {
    // 1. Önbelleği kontrol et
    const cacheKey = `screenshot:${websiteId}:${viewportWidth}`;
    const cachedUrl = await redis.get<string>(cacheKey);

    if (cachedUrl) {
      // 2. Önbellekte varsa: Önbellekteki resim URL'ine yönlendir
      return NextResponse.redirect(cachedUrl);
    }

    // 3. Önbellekte yoksa: QStash'e bir iş yayınla
    // Yinelenen işleri önlemek için benzersiz bir `messageId` veya `deduplicationId` kullanmak önemlidir.
    // Burada basitlik için her seferinde yayınlıyoruz, ancak QStash dökümanlarına bakarak bunu iyileştirebilirsiniz.
    await qstashClient.publishJSON({
      // Yeni worker endpoint'imiz
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-screenshot`,
      // Worker'a gönderilecek gövde
      body: {
        url,
        websiteId,
        viewportWidth,
      },
    });

    // 4. İstemciyi yer tutucu resme yönlendir
    const placeholderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/placeholder.svg`;
    return NextResponse.redirect(placeholderUrl);
    
  } catch (error) {
    console.error('[SCREENSHOT_API_ERROR]', error);
    const errorPlaceholder = `${process.env.NEXT_PUBLIC_APP_URL}/placeholder.svg`;
    return NextResponse.redirect(errorPlaceholder);
  }
}
