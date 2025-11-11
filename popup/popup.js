import { base64ToArrayBuffer, mergeArrayBuffersToWav } from "../lib/audio.js";
import { logDownload } from "../lib/supabaseClient.js";

const collectButton = document.getElementById("collect");
const statusEl = document.getElementById("status");
const OUTPUT_FILENAME = "audios_unidos.wav";

collectButton.addEventListener("click", async () => {
  collectButton.disabled = true;
  setStatus("Coletando áudios da página...");
  let downloadUrl;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error("Não foi possível identificar a aba ativa.");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: "COLLECT_AUDIO_URLS" });
    const urls = response?.urls ?? [];

    if (!urls.length) {
      setStatus("Nenhum áudio encontrado nesta página.");
      return;
    }

    setStatus(`Encontrados ${urls.length} áudios. Baixando conteúdos...`);
    const downloadResponse = await chrome.runtime.sendMessage({
      type: "FETCH_AUDIO_ARRAY_BUFFERS",
      urls,
    });

    if (!downloadResponse?.success) {
      throw new Error(downloadResponse?.error || "Falha ao baixar os áudios.");
    }

    const arrayBuffers = downloadResponse.buffers.map((item) => base64ToArrayBuffer(item.data));
    setStatus("Convertendo e unindo os áudios...");

    const { blob, duration } = await mergeArrayBuffersToWav(arrayBuffers);
    downloadUrl = URL.createObjectURL(blob);

    await chrome.downloads.download({
      url: downloadUrl,
      filename: OUTPUT_FILENAME,
      saveAs: true,
    });

    setStatus("Download iniciado! Registrando no Supabase...");

    try {
      await logDownload({
        pageUrl: tab.url,
        fileName: OUTPUT_FILENAME,
        audioCount: urls.length,
        durationSeconds: duration,
        sourceUrls: urls,
      });
      setStatus("Download iniciado e registrado com sucesso!");
    } catch (error) {
      console.warn("Não foi possível registrar o download no Supabase", error);
      setStatus("Download iniciado, mas houve um problema ao registrar no Supabase. Veja o console para detalhes.");
    }
  } catch (error) {
    console.error(error);
    setStatus(`Erro: ${error.message}`);
  } finally {
    if (downloadUrl) {
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
    }
    collectButton.disabled = false;
  }
});

function setStatus(message) {
  statusEl.textContent = message;
}
