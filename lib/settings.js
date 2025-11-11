import { DEFAULT_SUPABASE_CONFIG } from "./configDefaults.js";

const STORAGE_KEY = "supabaseConfig";

export async function getStoredSupabaseConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] ?? null);
    });
  });
}

export async function getSupabaseConfig() {
  const stored = await getStoredSupabaseConfig();
  if (!stored) {
    return { ...DEFAULT_SUPABASE_CONFIG };
  }

  return {
    url: stored.url?.trim() || DEFAULT_SUPABASE_CONFIG.url,
    anonKey: stored.anonKey?.trim() || DEFAULT_SUPABASE_CONFIG.anonKey,
  };
}

export async function saveSupabaseConfig({ url, anonKey }) {
  const payload = {
    url: url?.trim() ?? "",
    anonKey: anonKey?.trim() ?? "",
  };

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: payload }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(payload);
    });
  });
}

export async function ensureDefaultSupabaseConfig() {
  const stored = await getStoredSupabaseConfig();
  if (!stored) {
    await saveSupabaseConfig(DEFAULT_SUPABASE_CONFIG);
  }
}
