import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config.js";

const headers = () => ({
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

export async function logDownload({ pageUrl, fileName, audioCount, durationSeconds, sourceUrls }) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("your-project")) {
    console.warn("Supabase não configurado. Registro de download ignorado.");
    return { skipped: true };
  }

  const payload = {
    page_url: pageUrl,
    file_name: fileName,
    audio_count: audioCount,
    duration_seconds: durationSeconds,
    source_urls: sourceUrls,
    downloaded_at: new Date().toISOString(),
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/download_logs`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase retornou ${response.status}: ${errorText}`);
  }

  return { success: true };
}
