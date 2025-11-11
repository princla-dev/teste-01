import { getSupabaseConfig, saveSupabaseConfig } from "../lib/settings.js";

const form = document.getElementById("config-form");
const urlInput = document.getElementById("supabase-url");
const anonKeyInput = document.getElementById("supabase-anon-key");
const feedback = document.getElementById("feedback");

async function populateForm() {
  try {
    const { url, anonKey } = await getSupabaseConfig();
    urlInput.value = url;
    anonKeyInput.value = anonKey;
  } catch (error) {
    console.error("Não foi possível carregar a configuração atual", error);
    setFeedback("Erro ao carregar configurações. Veja o console para detalhes.", true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setFeedback("Salvando configurações...");

  try {
    await saveSupabaseConfig({ url: urlInput.value, anonKey: anonKeyInput.value });
    setFeedback("Configurações salvas com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar configurações", error);
    setFeedback(`Erro: ${error.message}`, true);
  }
});

function setFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("error", isError);
}

populateForm();
