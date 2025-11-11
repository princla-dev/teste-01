chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "FETCH_AUDIO_ARRAY_BUFFERS") {
    handleFetchAudioBuffers(message.urls)
      .then((buffers) => sendResponse({ success: true, buffers }))
      .catch((error) => {
        console.error("Erro ao baixar áudios", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  return false;
});

async function handleFetchAudioBuffers(urls = []) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error("Nenhum URL recebido para download.");
  }

  const buffers = [];
  for (const url of urls) {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Falha ao baixar ${url} (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "audio/mpeg";
    buffers.push({ data: arrayBufferToBase64(arrayBuffer), mimeType: contentType, url });
  }
  return buffers;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
