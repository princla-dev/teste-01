import { getSupabaseConfig } from "./settings.js";

function buildHeaders(anonKey) {
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

export async function logDownload({ pageUrl, fileName, audioCount, durationSeconds, sourceUrls }) {
  const { url, anonKey } = await getSupabaseConfig();

  if (!url || !anonKey || url.includes("your-project")) {
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

  const response = await fetch(`${url}/rest/v1/download_logs`, {
    method: "POST",
    headers: {
      ...buildHeaders(anonKey),
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
