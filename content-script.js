function collectAudioSources() {
  const audioElements = Array.from(document.querySelectorAll("audio, source[type^='audio/']"));
  const uniqueUrls = new Set();

  audioElements.forEach((el) => {
    const src = el.currentSrc || el.src || el.getAttribute("src");
    if (!src) {
      return;
    }

    if (src.startsWith("blob:")) {
      return;
    }

    try {
      const absoluteUrl = new URL(src, window.location.href).href;
      uniqueUrls.add(absoluteUrl);
    } catch (error) {
      console.warn("Ignorando URL inválida de áudio", src, error);
    }
  });

  return Array.from(uniqueUrls);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === "COLLECT_AUDIO_URLS") {
    sendResponse({ urls: collectAudioSources() });
  }
});
