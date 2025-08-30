import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

/**
 * Tracker'dan gelen POST isteklerini işler.
 * @param {Request} request - Gelen istek nesnesi.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Veri doğrulama (Basic validation)
    const { x, y, url, websiteId, viewportWidth, viewportHeight } = data;
    if (typeof x !== "number" || typeof y !== "number" || !url || !websiteId || typeof viewportWidth !== "number" || typeof viewportHeight !== "number") {
      return NextResponse.json(
        { message: "Invalid data format" },
        { status: 400 }
      );
    }

    // Veritabanına kaydet
    await sql`
            INSERT INTO click_events (website_id, x, y, url, viewport_width, viewport_height)
            VALUES (${websiteId}, ${x}, ${y}, ${url}, ${viewportWidth}, ${viewportHeight});
        `;

    return NextResponse.json(
      { message: "Data received successfully" },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    console.error("Error processing tracking data:", error);
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 500 }
    );
  }
}

// Tarayıcıların OPTIONS isteği göndermesi durumunda (CORS preflight)
// bu isteğe olumlu yanıt vermek için bir handler ekliyoruz.
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Daha sonra belirli domainlerle kısıtlanmalı
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
